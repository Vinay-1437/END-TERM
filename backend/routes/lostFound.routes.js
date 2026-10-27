import express from "express";
import {
  getLostFoundItems,
  getLostFoundById,
  createLostFoundItem,
  updateLostFoundItem,
  deleteLostFoundItem,
  resolveLostFoundItem,
} from "../controllers/lostFound.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/", protect, getLostFoundItems);
router.get("/:id", protect, getLostFoundById);
router.post("/", protect, upload.single("image"), createLostFoundItem);
router.put("/:id", protect, updateLostFoundItem);
router.delete("/:id", protect, deleteLostFoundItem);
router.put("/:id/resolve", protect, resolveLostFoundItem);

export default router;
