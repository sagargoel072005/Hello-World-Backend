const express = require("express");
const Post = require("../models/post");
const chatUpload = require("../middlewares/chatUpload");
const cloudinary = require("../config/cloudinary");

const {
  createPost,
  toggleLike,
  addComment,
} = require("../controller/postController");

const { userAuth } = require("../middlewares/auth");

const PostRouter = express.Router();

PostRouter.post(
  "/posts/",
  userAuth,
  chatUpload.single("media"),
  createPost
);

PostRouter.post(
  "/posts/:id/like",
  userAuth,
  toggleLike
);

PostRouter.post(
  "/posts/:id/comment",
  userAuth,
  addComment
);

PostRouter.get(
  "/posts/feed",
  userAuth,
  async (req, res) => {
    try {
      const posts = await Post.find()
        .populate(
          "user",
          "firstName lastName photoUrl"
        )
        .populate(
          "comments.user",
          "firstName lastName photoUrl"
        )
        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

PostRouter.get(
  "/posts/user/:id",
  userAuth,
  async (req, res) => {
    try {
      const posts = await Post.find({
        user: req.params.id,
      })
        .populate(
          "user",
          "firstName lastName photoUrl"
        )
        .populate(
          "comments.user",
          "firstName lastName photoUrl"
        )
        .sort({ createdAt: -1 });

      res.json(posts);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

PostRouter.delete(
  "/posts/:id",
  userAuth,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          error: "Post not found",
        });
      }

      if (
        post.user.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          error: "Unauthorized",
        });
      }
if (post.publicId) {
  await cloudinary.uploader.destroy(
    post.publicId,
    {
      resource_type:
        post.mediaType === "video"
          ? "video"
          : "image",
    }
  );
}

await post.deleteOne();

      res.json({
        message: "Post deleted successfully",
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }
);

module.exports = PostRouter;