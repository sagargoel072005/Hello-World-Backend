const User = require("../models/user");
const Post = require("../models/post");

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    const posts = await Post.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName photoUrl")
      .populate("comments.user", "firstName lastName photoUrl");

    res.json({ user, posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const posts = await Post.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .populate(
        "user",
        "firstName lastName photoUrl"
      )
      .populate(
        "comments.user",
        "firstName lastName photoUrl"
      );

    res.json({
      user,
      posts,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = { getMyProfile ,getUserProfile};