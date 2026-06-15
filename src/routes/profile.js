const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");
const profileRouter = express.Router();
const bcrypt = require("bcryptjs");
const chatUpload = require("../middlewares/chatUpload");
const User = require("../models/user");
const cloudinary = require("../config/cloudinary");
const { getMyProfile ,getUserProfile} = require("../controller/profileController");
const fs = require("fs");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
    try {
        const user = req.user;
        res.send(user);
    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
    try {
        validateEditProfileData(req);
        const loggedInUser = req.user;

        Object.keys(req.body).forEach((key) => {
            loggedInUser[key] = req.body[key]
        });
        await loggedInUser.save();
        res.json({
            message: `${loggedInUser.firstName},your profile updated successfully`,

            data: loggedInUser,
        });

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

profileRouter.patch("/profile/edit/password", userAuth, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            throw new Error("Password is required");
        }
        const loggedInUser = req.user;
        const passwordHash = await bcrypt.hash(password, 10);
        loggedInUser.password = passwordHash;
        await loggedInUser.save();
        res.send("password updated successfully");

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }
});

profileRouter.post("/upload-photo", userAuth,
     chatUpload.single("photo"), 
     async (req, res) => {
   try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.user._id;
      const imageUrl = req.file.location;
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { photoUrl: imageUrl },
        { new: true }
      );

      res.json({
        success: true,
        data: updatedUser,
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
}
);

profileRouter.post( "/profile/upload-photo",
  userAuth,
  chatUpload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) throw new Error("No file uploaded");

      const filePath = req.file.path.replace(/\\/g, "/");
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "profile_photos",
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      });

      // Clean up temp file
      try { fs.unlinkSync(req.file.path); } catch {}

      req.user.photoUrl = result.secure_url;
      await req.user.save();

      res.json(req.user);
    } catch (err) {
      console.error("PHOTO UPLOAD ERROR:", err);
      res.status(500).send({ error: err.message });
    }
  }
);

profileRouter.get("/profile/connections-count", userAuth, async (req, res) => {
  try {
    const ConnectionRequest = require("../models/connectionRequest");
    const userId = req.user._id;
    const count = await ConnectionRequest.countDocuments({
      $or: [
        { fromUserId: userId, status: "accepted" },
        { toUserId: userId,   status: "accepted" },
      ],
    });
    res.json({ count });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

profileRouter.post( "/profile/upload-cover",
  userAuth,
  chatUpload.single("cover"),
  async (req, res) => {
    try {
      if (!req.file) throw new Error("No file uploaded");

      const filePath = req.file.path.replace(/\\/g, "/");
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "cover_photos",
        transformation: [{ width: 1200, height: 400, crop: "fill" }],
      });

      try { fs.unlinkSync(req.file.path); } catch {}

      req.user.coverPhotoUrl = result.secure_url;
      await req.user.save();

      res.json(req.user);
    } catch (err) {
      console.error("COVER UPLOAD ERROR:", err);
      res.status(500).send({ error: err.message });
    }
  }
);

profileRouter.post( "/profile/upload-resume",
  userAuth,
  chatUpload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) throw new Error("No file uploaded");

      // Validate file type
      const allowed = ["application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowed.includes(req.file.mimetype)) {
        try { fs.unlinkSync(req.file.path); } catch {}
        throw new Error("Invalid file type. Only PDF, DOC, DOCX allowed.");
      }

      const filePath = req.file.path.replace(/\\/g, "/");

      // Delete old resume from Cloudinary if it exists
      if (req.user.resumePublicId) {
        try {
          await cloudinary.uploader.destroy(req.user.resumePublicId, {
            resource_type: "raw",
          });
        } catch {}
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "resumes",
        resource_type: "raw",               // for non-image files
        use_filename: true,
        unique_filename: true,
        access_mode: "public",
      });

      try { fs.unlinkSync(req.file.path); } catch {}

      req.user.resumeUrl = result.secure_url;
      req.user.resumePublicId = result.public_id;
      await req.user.save();

      res.json({
        message: "Resume uploaded successfully",
        resumeUrl: result.secure_url,
        user: req.user,
      });
    } catch (err) {
      console.error("RESUME UPLOAD ERROR:", err);
      res.status(500).send({ error: err.message });
    }
  }
);

profileRouter.delete("/profile/resume", userAuth, async (req, res) => {
  try {
    if (req.user.resumePublicId) {
      await cloudinary.uploader.destroy(req.user.resumePublicId, {
        resource_type: "raw",
      });
    }
    req.user.resumeUrl = "";
    req.user.resumePublicId = "";
    await req.user.save();
    res.json({ message: "Resume deleted successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

profileRouter.get("/me", userAuth, getMyProfile);
profileRouter.get("/profile/:userId/",userAuth,getUserProfile);

module.exports = profileRouter;

