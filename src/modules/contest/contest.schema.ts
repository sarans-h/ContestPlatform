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