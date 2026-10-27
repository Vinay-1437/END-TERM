import express from "express";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getConversations);
router.post("/", protect, getOrCreateConversation);
router.get("/:id/messages", protect, getMessages);

export default router;
