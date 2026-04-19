const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");
const profileRouter = express.Router();
const bcrypt = require("bcryptjs");
const upload = require("../middlewares/upload");
const User = require("../models/user");


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
     upload.single("photo"), 
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

module.exports = profileRouter;