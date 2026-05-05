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

module.exports = { getMyProfile };