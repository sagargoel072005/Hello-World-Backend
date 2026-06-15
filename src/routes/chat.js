const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { Chat } = require("../models/chat");
const fs = require("fs");
const chatUpload = require("../middlewares/chatUpload");
const cloudinary = require("../config/cloudinary");


const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;

  try {
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });
    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }
    res.json(chat);
  } catch (err) {
    console.error(err);
  }
});

chatRouter.post("/chat/upload",userAuth,chatUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        throw new Error("No file uploaded");
      }

      const filePath = req.file.path.replace(/\\/g, "/");

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "chat_media",
        resource_type: "auto",
      });

      try {
        fs.unlinkSync(filePath);
      } catch {}

      res.json({
        success: true,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        fileType: req.file.mimetype,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

module.exports = chatRouter;