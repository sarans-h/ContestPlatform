import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.ts";
import { addMcqQuestionHandler, createContestHandler, getContestDetailsHandler } from "./contest.controller.ts";

const router = Router();

router.post("/",requireAuth,requireRole("creator"),createContestHandler);
router.get("/:contestId",requireAuth,getContestDetailsHandler);
router.post("/:contestId/mcq", requireAuth,requireRole("creator"), addMcqQuestionHandler);
// router.post("/:contestId/mcq/:questionId/submit",requireAuth,requireRole("CONTESTEE"));
// router.post("/:contestId/dsa",requireAuth,requireRole("CREATOR"))
// router.post("/:contestId/leaderboard",requireAuth)
export default router;
 