import { z } from "zod";

export const createContestSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    startTime: z.string().datetime({ offset: true }),
    endTime: z.string().datetime({ offset: true }),
  })
  .strict()
  .refine(
    (v) => new Date(v.endTime).getTime() > new Date(v.startTime).getTime(),
    { message: "End time must be greater than start time." }
  );

export type CreateContestBody = z.infer<typeof createContestSchema>;

export const contestIdParamSchema = z
  .object({
    contestId: z.string().uuid(),
  })
  .strict();

export type ContestIdParams = z.infer<typeof contestIdParamSchema>;

export const submitMcqParamsSchema = z
  .object({
    contestId: z.string().uuid(),
    questionId: z.string().uuid(),
  })
  .strict();

export type SubmitMcqParams = z.infer<typeof submitMcqParamsSchema>;

export const submitMcqBodySchema = z
  .object({
    selectedOptionIndex: z.number().int().min(0),
  })
  .strict();

export type SubmitMcqBody = z.infer<typeof submitMcqBodySchema>;

export const addMcqQuestionSchema = z
  .object({
    questionText: z.string().min(1).max(5000),
    options: z.array(z.string().min(1).max(500)).min(2).max(10),
    correctOptionIndex: z.number().int().min(0),
    points: z.number().int().min(1).max(1000),
  })
  .strict()
  .refine((v) => v.correctOptionIndex < v.options.length, {
    message: "correctOptionIndex out of bounds",
  });

export type AddMcqQuestionBody = z.infer<typeof addMcqQuestionSchema>;

const testCaseSchema = z
  .object({
    input: z.string().min(1).max(50_000),
    expectedOutput: z.string().min(1).max(50_000),
    isHidden: z.boolean().optional().default(false),
  })
  .strict();

export const addDsaProblemSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(50_000),
    tags: z.array(z.string().min(1).max(50)).max(25).optional().default([]),
    points: z.number().int().min(1).max(100_000).optional().default(100),
    timeLimit: z.number().int().min(1).max(60_000).optional().default(2000),
    memoryLimit: z.number().int().min(1).max(8192).optional().default(256),
    testCases: z.array(testCaseSchema).min(1).max(200),
  })
  .strict();

export type AddDsaProblemBody = z.infer<typeof addDsaProblemSchema>;