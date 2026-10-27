import { Conversation, Message } from "../models/message.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// GET /api/conversations — list all conversations for the current user
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate("participants", "name email role avatar")
    .sort({ lastMessageAt: -1 });

  res.status(200).json({ success: true, conversations });
});

// POST /api/conversations — start or get a conversation with another user
export const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body;

  if (!participantId) {
    return res.status(400).json({ success: false, message: "Participant ID is required." });
  }

  if (participantId === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "Cannot start a conversation with yourself." });
  }

  // Look for an existing conversation between these two users
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId] },
  }).populate("participants", "name email role avatar");

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
    });
    conversation = await conversation.populate("participants", "name email role avatar");
  }

  res.status(200).json({ success: true, conversation });
});

// GET /api/conversations/:id/messages — paginated message history
export const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }

  // Ensure the requesting user is a participant — prevent unauthorized message access
  const isParticipant = conversation.participants
    .map((p) => p.toString())
    .includes(req.user._id.toString());

  if (!isParticipant) {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  const skip = (Number(page) - 1) * Number(limit);

  const messages = await Message.find({ conversation: req.params.id })
    .populate("sender", "name avatar role")
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, page: Number(page), messages });
});
