import { Router } from "express";
import { getUser, getUsers, patchUser, removeUser } from "./user.controller.ts";
import { requireAuth, requireRole, requireSelfOrCreator } from "../../middleware/auth.middleware.ts";

const router = Router();

router.use(requireAuth);

router.get("/", requireRole("CREATOR"), getUsers);
router.get("/:id", requireSelfOrCreator("id"), getUser);
router.patch("/:id", requireSelfOrCreator("id"), patchUser);
router.delete("/:id", requireSelfOrCreator("id"), removeUser);

export default router;
