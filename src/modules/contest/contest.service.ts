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
    const includeCorrect = viewerRole == "creator";
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
                select: includeCorrect
                    ? {
                        id: true,
                        questionText: true,
                        options: true,
                        points: true,
                        correctOptionIndex: true,
                    } : {
                        id: true,
                        questionText: true,
                        options: true,
                        points: true,
                    }
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