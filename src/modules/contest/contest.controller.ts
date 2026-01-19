import type { NextFunction, Request, Response } from "express";
import { parseBody, parseParam } from "../../lib/validation";
import {
    addMcqQuestionSchema,
    addDsaProblemSchema,
    contestIdParamSchema,
    createContestSchema,
    submitMcqBodySchema,
    submitMcqParamsSchema,
} from "./contest.schema";
import {
    addDsaProblemToContest,
    addMcqQuestionToContest,
    createContest,
    getContestLeaderboard,
    getContestDetails,
    submitMcqAnswer,
} from "./contest.service";
import { ok, fail } from "../../lib/response";

export async function createContestHandler(req: Request, res: Response, next: NextFunction) {
    const body = parseBody(createContestSchema, req.body, res);
    if (!body) return;
    try {
        if (!req.auth) return;
        const contest = await createContest({
            creatorId: req.auth.userId,
            title: body.title,
            description: body.description,
            startTime: new Date(body.startTime),
            endTime: new Date(body.endTime),
        });
        return ok(res, {
            id: contest.id,
            title: contest.title,
            description: contest.description ?? null,
            creatorId: contest.creatorId,
            startTime: contest.startTime.toISOString(),
            endTime: contest.endTime.toISOString(),
        },
            201)
    } catch (e) {
        next(e);
    }

}

export async function getContestDetailsHandler(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.auth) return;
        const parsed = contestIdParamSchema.safeParse(req.params);
        if (!parsed.success) {
            return fail(res, "CONTEST_NOT_FOUND", 404);
        }
        const params = parsed.data;

        const contest = await getContestDetails(params.contestId, req.auth.role);

        if (!contest) {
            return fail(res, "CONTEST_NOT_FOUND", 404);
        }

        return ok(
            res,
            {
                id: contest.id,
                title: contest.title,
                description: contest.description ?? null,
                startTime: contest.startTime.toISOString(),
                endTime: contest.endTime.toISOString(),
                creatorId: contest.creatorId,
                mcqs: contest.mcqQuestions,
                dsaProblems: contest.dsaProblems,
            },
            200
        );
    } catch (err) {
        return next(err);
    }
}    

export async function addMcqQuestionHandler(req: Request, res: Response, next: NextFunction) {
    const body = parseBody(addMcqQuestionSchema, req.body, res);
    if (!body) return;

    const contestParamsParsed = contestIdParamSchema.safeParse(req.params);
    if (!contestParamsParsed.success) {
        return fail(res, "CONTEST_NOT_FOUND", 404);
    }
    const params = contestParamsParsed.data;

    try {
        const created = await addMcqQuestionToContest({
            contestId: params.contestId,
            questionText: body.questionText,
            options: body.options,
            correctOptionIndex: body.correctOptionIndex,
            points: body.points,
        });

        if (!created) {
            return fail(res, "CONTEST_NOT_FOUND", 404);
        }

        return ok(res, { id: created.id, contestId: created.contestId }, 201);
    } catch (err) {
        return next(err);
    }
}

export async function submitMcqAnswerHandler(req: Request, res: Response, next: NextFunction) {
    const body = parseBody(submitMcqBodySchema, req.body, res);
    if (!body) return;

    const submitParamsParsed = submitMcqParamsSchema.safeParse(req.params);
    if (!submitParamsParsed.success) {
        return fail(res, "QUESTION_NOT_FOUND", 404);
    }
    const params = submitParamsParsed.data;

    try {
        if (!req.auth) return;

        const result = await submitMcqAnswer({
            contestId: params.contestId,
            questionId: params.questionId,
            userId: req.auth.userId,
            selectedOptionIndex: body.selectedOptionIndex,
        });

        if (!result.ok) {
            if (result.error === "QUESTION_NOT_FOUND") return fail(res, "QUESTION_NOT_FOUND", 404);
            if (result.error === "FORBIDDEN") return fail(res, "FORBIDDEN", 403);
            if (result.error === "ALREADY_SUBMITTED") return fail(res, "ALREADY_SUBMITTED", 400);
            if (result.error === "CONTEST_NOT_ACTIVE") return fail(res, "CONTEST_NOT_ACTIVE", 400);
            return fail(res, "INVALID_REQUEST", 400);
        }

        return ok(res, { isCorrect: result.isCorrect, pointsEarned: result.pointsEarned }, 201);
    } catch (err) {
        return next(err);
    }
}

export async function addDsaProblemHandler(req: Request, res: Response, next: NextFunction) {
    const body = parseBody(addDsaProblemSchema, req.body, res);
    if (!body) return;

    const contestParamsParsed = contestIdParamSchema.safeParse(req.params);
    if (!contestParamsParsed.success) {
        return fail(res, "CONTEST_NOT_FOUND", 404);
    }
    const params = contestParamsParsed.data;

    try {
        const created = await addDsaProblemToContest({
            contestId: params.contestId,
            title: body.title,
            description: body.description,
            tags: body.tags,
            points: body.points,
            timeLimit: body.timeLimit,
            memoryLimit: body.memoryLimit,
            testCases: body.testCases,
        });

        if (!created) {
            return fail(res, "CONTEST_NOT_FOUND", 404);
        }

        return ok(res, { id: created.id, contestId: created.contestId }, 201);
    } catch (err) {
        return next(err);
    }
}

export async function getContestLeaderboardHandler(req: Request, res: Response, next: NextFunction) {
    const parsed = contestIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
        return fail(res, "CONTEST_NOT_FOUND", 404);
    }
    const params = parsed.data;

    try {
        const rows = await getContestLeaderboard(params.contestId);
        if (!rows) {
            return fail(res, "CONTEST_NOT_FOUND", 404);
        }

        return ok(res, rows, 200);
    } catch (err) {
        return next(err);
    }
}
