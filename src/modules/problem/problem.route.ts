import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.ts";
import { getProblemDetailsHandler, submitProblemHandler } from "./problem.controller.ts";

const router = Router();

router.get("/:problemId", requireAuth, getProblemDetailsHandler);
router.post("/:problemId/submit", requireAuth, submitProblemHandler);

export default router;
