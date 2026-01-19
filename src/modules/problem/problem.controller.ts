import type { NextFunction, Request, Response } from "express";
import { parseBody, parseParam } from "../../lib/validation";
import { fail, ok } from "../../lib/response";
import { problemIdParamSchema, submitProblemBodySchema } from "./problem.schema";
import { getProblemDetails, submitProblemSolution } from "./problem.service";

export async function getProblemDetailsHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = problemIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return fail(res, "PROBLEM_NOT_FOUND", 404);
  }
  const params = parsed.data;

  try {
    const problem = await getProblemDetails(params.problemId);

    if (!problem) {
      return fail(res, "PROBLEM_NOT_FOUND", 404);
    }

    // CRITICAL: only visible test cases are returned.
    return ok(
      res,
      {
        id: problem.id,
        contestId: problem.contestId,
        title: problem.title,
        description: problem.description,
        tags: problem.tags as unknown,
        points: problem.points,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        visibleTestCases: problem.testCases,
      },
      200
    );
  } catch (err) {
    return next(err);
  }
}

export async function submitProblemHandler(req: Request, res: Response, next: NextFunction) {
  const parsed = problemIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return fail(res, "PROBLEM_NOT_FOUND", 404);
  }
  const params = parsed.data;

  const body = parseBody(submitProblemBodySchema, req.body, res);
  if (!body) return;

  try {
    if (!req.auth) return;

    const result = await submitProblemSolution({
      problemId: params.problemId,
      userId: req.auth.userId,
      code: body.code,
      language: body.language,
    });

    if (!result.ok) {
      if (result.error === "PROBLEM_NOT_FOUND") return fail(res, "PROBLEM_NOT_FOUND", 404);
      if (result.error === "FORBIDDEN") return fail(res, "FORBIDDEN", 403);
      return fail(res, "CONTEST_NOT_ACTIVE", 400);
    }

    return ok(
      res,
      {
        status: result.status,
        pointsEarned: result.pointsEarned,
        testCasesPassed: result.testCasesPassed,
        totalTestCases: result.totalTestCases,
      },
      201
    );
  } catch (err) {
    return next(err);
  }
}
