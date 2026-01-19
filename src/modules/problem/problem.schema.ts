import { z } from "zod";

export const problemIdParamSchema = z
  .object({
    problemId: z.string().uuid(),
  })
  .strict();

export type ProblemIdParams = z.infer<typeof problemIdParamSchema>;

export const submitProblemBodySchema = z
  .object({
    code: z.string().min(1).max(200_000),
    language: z.string().min(1).max(50),
  })
  .strict();

export type SubmitProblemBody = z.infer<typeof submitProblemBodySchema>;

export const problemSubmissionStatusSchema = z.enum([
  "accepted",
  "wrong_answer",
  "time_limit_exceeded",
  "runtime_error",
]);

export type ProblemSubmissionStatus = z.infer<typeof problemSubmissionStatusSchema>;
