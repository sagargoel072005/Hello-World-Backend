const Post = require("../models/Post");
const cloudinary = require("../config/cloudinary");

const createPost = async (req, res) => {
  try {
    if (!req.body.caption && !req.file) {
      return res.status(400).json({
        message: "Caption or media is required",
      });
    }

 let mediaUrl = null;
let publicId = null;

if (req.file) {
  const result = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "posts",
      resource_type: "auto",
    }
  );

  mediaUrl = result.secure_url;
  publicId = result.public_id;
}

const mediaType = req.file
  ? req.file.mimetype.startsWith("video")
    ? "video"
    : "image"
  : null;

const post = new Post({
  user: req.user._id,
  caption: req.body.caption,
  mediaUrl,
  publicId,
  mediaType,
});

    await post.save();

    await post.populate(
      "user",
      "firstName lastName photoUrl"
    );

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

const addComment = async (req, res) => {
  try {
    if (!req.body.text?.trim()) {
      return res.status(400).json({
        message: "Comment required",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    post.comments.push({
      user: req.user._id,
      text: req.body.text,
    });

    await post.save();

    await post.populate(
      "comments.user",
      "firstName lastName photoUrl"
    );

    res.json(post);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  createPost,
  toggleLike,
  addComment,
};