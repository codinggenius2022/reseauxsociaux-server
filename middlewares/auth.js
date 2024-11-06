const { verifyAccessToken } = require("../helpers/auth");
const Post = require("../models/post");
const User = require("../models/user");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  const result = verifyAccessToken(token);
  if (!result.success) {
    return res.status(401).json({ message: result.message });
  }

  req.user = result.data;
  next();
};

const canUpdateAndDelete = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params._id);
    if (req.user._id != post.postedBy) {
      return res.json({
        error: "You don't have permission to edit this post",
      });
    }
    next();
  } catch (err) {
    console.log(err);
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role !== "Admin") {
      return res.json({
        error: "You don't have permission to view this page",
      });
    }
    next();
  } catch (err) {
    console.log(err);
  }
};
module.exports = { authenticateToken, canUpdateAndDelete, isAdmin };
