const Post = require("../models/post");

const createPost = async (req, res) => {
  try {
    const mediaType = req.file ? (req.file.mimetype.startsWith("video") ? "video" : "image") : null;

    const newPost = new Post({
      user: req.user._id,
      caption: req.body.caption,
      mediaUrl: req.file ? req.file.location : null, // S3 URL
      mediaType: mediaType
    });

    await newPost.save();
    res.json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.includes(req.user._id);
    if (alreadyLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({
      user: req.user._id,
      text: req.body.text,
    });

    await post.save();
    await post.populate("comments.user", "firstName lastName photoUrl");

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPost, toggleLike, addComment };