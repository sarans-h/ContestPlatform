import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.ts";
import {
	addMcqQuestionHandler,
	addDsaProblemHandler,
	createContestHandler,
	getContestLeaderboardHandler,
	getContestDetailsHandler,
	submitMcqAnswerHandler,
} from "./contest.controller.ts";

const router = Router();

router.post("/",requireAuth,requireRole("creator"),createContestHandler);
router.get("/:contestId",requireAuth,getContestDetailsHandler);
router.post("/:contestId/mcq", requireAuth,requireRole("creator"), addMcqQuestionHandler);
router.get("/:contestId/leaderboard", requireAuth, getContestLeaderboardHandler);
router.post(
	"/:contestId/mcq/:questionId/submit",
	requireAuth,
	submitMcqAnswerHandler
);
router.post("/:contestId/dsa", requireAuth, requireRole("creator"), addDsaProblemHandler);
export default router;
 