import type { NextFunction, Request, Response } from "express";
import { parseBody, parseParam } from "../../lib/validation";
import { addMcqQuestionSchema, contestIdParamSchema, createContestSchema } from "./contest.schema";
import { addMcqQuestionToContest, createContest, getContestDetails } from "./contest.service";
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
        const params = parseParam(contestIdParamSchema, req.params, res);
        if (!params) return;

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

    const params = parseParam(contestIdParamSchema, req.params, res);
    if (!params) return;

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
