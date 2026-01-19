import { prisma } from "../../lib/prisma";

export type Contest = {
    id: string,
    creatorId: string;
    title: string;
    description: string;
    startTime: Date,
    endTime: Date
}
export async function createContest(input: {
    creatorId: string;
    title: string;
    description: string;
    startTime: Date,
    endTime: Date
}):
    Promise<Contest> {
    const contest = await prisma.contest.create({
        data: {
            creatorId: input.creatorId,
            title: input.title,
            description: input.description,
            startTime: input.startTime,
            endTime: input.endTime,
        },
        select: {
            id: true,
            title: true,
            description: true,
            creatorId: true,
            startTime: true,
            endTime: true
        }
    });
    return contest;
}

export async function getContestDetails(contestId: string, viewerRole: "creator" | "contestee") {
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: {
            id: true,
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            creatorId: true,
            mcqQuestions: {
                select: {
                    id: true,
                    questionText: true,
                    options: true,
                    points: true,
                },
            },
            dsaProblems: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    tags: true,
                    points: true,
                    timeLimit: true,
                    memoryLimit: true,
                },
            },
        }
    });
    return contest;

}

export async function addMcqQuestionToContest(input: {
    contestId: string;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    points: number;
}): Promise<{ id: string; contestId: string } | null> {
    const contest = await prisma.contest.findUnique({
        where: { id: input.contestId },
        select: { id: true },
    });

    if (!contest) return null;

    const question = await prisma.mcqQuestion.create({
        data: {
            contestId: input.contestId,
            questionText: input.questionText,
            options: input.options,
            correctOptionIndex: input.correctOptionIndex,
            points: input.points,
        },
        select: {
            id: true,
            contestId: true,
        },
    });

    return question;
}

export type SubmitMcqResult =
    | { ok: true; isCorrect: boolean; pointsEarned: number }
    | { ok: false; error: "QUESTION_NOT_FOUND" | "CONTEST_NOT_ACTIVE" | "ALREADY_SUBMITTED" | "FORBIDDEN" | "INVALID_REQUEST" };

export async function submitMcqAnswer(input: {
    contestId: string;
    questionId: string;
    userId: string;
    selectedOptionIndex: number;
}): Promise<SubmitMcqResult> {
    const question = await prisma.mcqQuestion.findFirst({
        where: {
            id: input.questionId,
            contestId: input.contestId,
        },
        select: {
            id: true,
            options: true,
            correctOptionIndex: true,
            points: true,
            contest: {
                select: {
                    startTime: true,
                    endTime: true,
                    creatorId: true,
                },
            },
        },
    });

    if (!question) return { ok: false, error: "QUESTION_NOT_FOUND" };

    // Prevent contest creator from submitting (even if they somehow have contestee role)
    if (question.contest.creatorId === input.userId) {
        return { ok: false, error: "FORBIDDEN" };
    }

    const now = Date.now();
    if (now < question.contest.startTime.getTime() || now > question.contest.endTime.getTime()) {
        return { ok: false, error: "CONTEST_NOT_ACTIVE" };
    }

    const existing = await prisma.mcqSubmission.findFirst({
        where: {
            userId: input.userId,
            questionId: input.questionId,
        },
        select: { id: true },
    });

    if (existing) {
        return { ok: false, error: "ALREADY_SUBMITTED" };
    }

    const optionsValue = question.options as unknown;
    const options = Array.isArray(optionsValue) ? optionsValue : undefined;
    if (!options || input.selectedOptionIndex >= options.length) {
        return { ok: false, error: "INVALID_REQUEST" };
    }

    const isCorrect = input.selectedOptionIndex === question.correctOptionIndex;
    const pointsEarned = isCorrect ? question.points : 0;

    await prisma.mcqSubmission.create({
        data: {
            userId: input.userId,
            questionId: input.questionId,
            selectedOptionIndex: input.selectedOptionIndex,
            isCorrect,
            pointsEarned,
        },
        select: { id: true },
    });

    return { ok: true, isCorrect, pointsEarned };
}

export async function addDsaProblemToContest(input: {
    contestId: string;
    title: string;
    description: string;
    tags: string[];
    points: number;
    timeLimit: number;
    memoryLimit: number;
    testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
}): Promise<{ id: string; contestId: string } | null> {
    const contest = await prisma.contest.findUnique({
        where: { id: input.contestId },
        select: { id: true },
    });

    if (!contest) return null;

    const created = await prisma.dsaProblem.create({
        data: {
            contestId: input.contestId,
            title: input.title,
            description: input.description,
            tags: input.tags,
            points: input.points,
            timeLimit: input.timeLimit,
            memoryLimit: input.memoryLimit,
            testCases: {
                create: input.testCases.map((tc) => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    isHidden: tc.isHidden,
                })),
            },
        },
        select: {
            id: true,
            contestId: true,
        },
    });

    return created;
}

export type LeaderboardRow = {
    userId: number;
    name: string | null;
    totalPoints: number;
    rank: number;
};

function stableNumericId(input: string): number {
    // FNV-1a 32-bit hash for stable numeric IDs in API responses
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    // Convert to unsigned and avoid 0
    return (hash >>> 0) || 1;
}

export async function getContestLeaderboard(contestId: string): Promise<LeaderboardRow[] | null> {
    const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: { id: true },
    });

    if (!contest) return null;

    const mcqSums = await prisma.mcqSubmission.groupBy({
        by: ["userId"],
        where: {
            question: {
                contestId,
            },
        },
        _sum: {
            pointsEarned: true,
        },
    });

    const mcqPointsByUser = new Map<string, number>();
    for (const row of mcqSums) {
        mcqPointsByUser.set(row.userId, row._sum.pointsEarned ?? 0);
    }

    // For each userId + problemId, pick the best pointsEarned, then sum per user.
    const dsaBestPerProblem = await prisma.dsaSubmission.groupBy({
        by: ["userId", "problemId"],
        where: {
            problem: {
                contestId,
            },
        },
        _max: {
            pointsEarned: true,
        },
    });

    const dsaPointsByUser = new Map<string, number>();
    for (const row of dsaBestPerProblem) {
        const best = row._max.pointsEarned ?? 0;
        dsaPointsByUser.set(row.userId, (dsaPointsByUser.get(row.userId) ?? 0) + best);
    }

    const userIds = Array.from(
        new Set<string>([...mcqPointsByUser.keys(), ...dsaPointsByUser.keys()])
    );

    if (userIds.length === 0) return [];

    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
    });

    const rows: Array<Omit<LeaderboardRow, "rank">> = users.map((u) => ({
        userId: stableNumericId(u.id),
        name: u.name ?? null,
        totalPoints: (mcqPointsByUser.get(u.id) ?? 0) + (dsaPointsByUser.get(u.id) ?? 0),
    }));

    rows.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return a.userId - b.userId;
    });

    // Dense ranking: 1,2,2,3...
    const ranked: LeaderboardRow[] = [];
    let rank = 0;
    let lastPoints: number | null = null;
    for (const row of rows) {
        if (lastPoints === null || row.totalPoints !== lastPoints) {
            rank += 1;
            lastPoints = row.totalPoints;
        }
        ranked.push({ ...row, rank });
    }

    return ranked;
}