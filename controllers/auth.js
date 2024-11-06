const User = require("../models/user");
const { hashPassword, comparePassword } = require("../helpers/auth");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const register = async (req, res) => {
  const { name, email, password, secret } = req.body;
  if (!name) {
    return res.json({
      error: "Email is required",
    });
  }
  if (!email) {
    return res.json({
      error: "Email is required",
    });
  }
  if (!password || password.length < 6) {
    return res.json({
      error: "Password is required and must be at least 6 characters",
    });
  }
  if (!secret) {
    return res.json({
      error: "Secret answer is required",
    });
  }
  const exist = await User.findOne({ email });
  if (exist) {
    return res.json({
      error: "Email is already taken",
    });
  }
  const hashedPassword = await hashPassword(password);
  const user = new User({
    name,
    email,
    password: hashedPassword,
    secret,
    username: uuidv4(),
  });

  try {
    await user.save();
    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: "Something went wrong. Try registering again",
    });
  }
};

const login = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        error: "No user found",
      });
    }
    const match = await comparePassword(req.body.password, user.password);
    if (!match) {
      return res.json({
        error: "Password is incorrect",
      });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const { password, secret, ...filteredUser } = user._doc;
    return res.json({
      token,
      filteredUser,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: "Something went wrong while loggin in. Try again",
    });
  }
};

const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({
        error: "User does not exist",
      });
    }
    if (user) res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.json({
      error: "User does not have permission to view this page",
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email, newPassword, secret } = req.body;
  if (!newPassword) {
    return res.json({
      message: "Password is required and must be at least 6 characters",
    });
  }
  if (!secret) {
    return res.json({
      message: "Secret answer is required",
    });
  }
  if (!email) {
    return res.json({
      message: "Email used in registering account is required",
    });
  }
  try {
    const hashed = await hashPassword(newPassword);
    const forgotPasswordUser = await User.findOneAndUpdate(
      { email, secret },
      { password: hashed }
    );
    if (!forgotPasswordUser) {
      return res.json({
        message: "Password reset was not successful",
      });
    }
    return res.json({ ok: true });
  } catch (error) {
    console.log(error);
    return res.json({
      message: "Something went wrong. Try again",
    });
  }
};

const profileUpdate = async (req, res) => {
  const data = {};
  if (req.body.username) {
    data.username = req.body.username;
  }
  if (req.body.about) {
    data.about = req.body.about;
  }
  if (req.body.name) {
    data.name = req.body.name;
  }
  if (req.body.password && req.body.password.length >= 6) {
    data.password = req.body.password;
  } else if (req.body.password && req.body.password.length < 6) {
    return res.json({
      error: "Password must be 6 characters and above",
    });
  }
  if (req.body.secret) {
    data.secret = req.body.secret;
  }
  if (Object.keys(req.body.image).length > 0) {
    data.image = req.body.image;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(req.user._id, data, {
      new: true,
    });
    if (!updatedUser) {
      return res.json({
        error: "User update unsuccessful",
      });
    }
    updatedUser.password = undefined;
    updatedUser.secret = undefined;
    return res.json({
      success: true,
      updatedUser: updatedUser,
    });
  } catch (err) {
    console.log(err);
  }
};

const findUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const following = user.following;
    following.push(user._id);
    const usersNotFollowed = await User.find({ _id: { $nin: following } })
      .select("-password -secret")
      .limit(10);
    return res.json(usersNotFollowed);
  } catch (err) {
    console.log(err);
  }
};

//addFollower middleware

const addFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $addToSet: { followers: req.user._id },
    });
    next();
  } catch (err) {
    console.log(err);
  }
};

// remove follower middleware
const removeFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $pull: { followers: req.user._id },
    });
    next();
  } catch (err) {
    console.log(err);
  }
};

const followUser = async (req, res) => {
  if (req.user._id == req.body._id) {
    return res.json({
      error: "You cannot follow yourself",
    });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { following: req.body._id } },
      { new: true }
    ).select("-password -secret");
    return res.json(user);
  } catch (err) {
    console.log(err);
  }
};

const unfollowUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { following: req.body._id },
      },
      { new: true }
    ).select("-password -secret");
    return res.json(user);
  } catch (err) {
    console.log(err);
  }
};

const following = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const following = user.following;
    const users = await User.find({ _id: { $in: following } });
    return res.json(users);
  } catch (err) {
    console.log(err);
  }
};

const followers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const followers = user.followers;
    const users = await User.find({ _id: { $in: followers } });
    return res.json(users);
  } catch (err) {
    console.log(err);
  }
};

const searchUsers = async (req, res) => {
  const q = req.query.q;
  if (!q) return;
  try {
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
      ],
    }).select("-password -secret");
    return res.json(users);
  } catch (err) {
    console.log(err);
  }
};

const userProfile = async (req, res) => {
  try {
    const users = await User.find({ username: req.params.username });
    if (!users.length) {
      return res.json({
        error: "User not found",
      });
    }
    return res.json(users[0]);
  } catch (err) {
    console.log(err);
  }
};

const userFollowing = async (req, res) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username }).populate(
      "following",
      "_id name username email image"
    );
    const following = user.following;
    return res.json(following);
  } catch (err) {
    console.log(err);
  }
};

const userFollowers = async (req, res) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username: username }).populate(
      "followers",
      "_id name username image"
    );
    const followers = user.followers;
    return res.json(followers);
  } catch (err) {
    console.log(err);
  }
};

//Admin
const currentAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.json({
        error: "User does not exist",
      });
    }
    if (user.role !== "Admin") {
      return res.json({
        error: "You need admin permission to view this page",
      });
    }
    if (user.role == "Admin") {
      return res.json({ success: true });
    }
  } catch (err) {
    console.log(err);
  }
};

const updateUser = async (req, res) => {
  _id = req.params._id;
  updateData = req.body;
  try {
    const user = await User.findByIdAndUpdate(_id, updateData, {
      new: true,
    }).select("-password -secret");
    if (!user) {
      return res.json({
        error: "User could not be updated",
      });
    }
    console.log(user);
    return res.json({ user, success: true });
  } catch (err) {
    console.log(err);
  }
};

const deleteUser = async (req, res) => {
  const _id = req.params._id;
  try {
    const user = await User.findByIdAndDelete(_id);
    if (!user) {
      return res.json({
        error: "User could not be deleted",
      });
    }
    return res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -secret");
    if (users.length < 0) {
      return res.json({
        error: "No users found",
      });
    }
    return res.json(users);
  } catch (err) {
    console.error(err);
  }
};
//end of admin routes

module.exports = {
  register,
  login,
  currentUser,
  forgotPassword,
  profileUpdate,
  findUsers,
  addFollower,
  followUser,
  following,
  removeFollower,
  unfollowUser,
  searchUsers,
  userFollowing,
  userFollowers,
  userProfile,
  followers,
  currentAdmin,
  updateUser,
  deleteUser,
  getUsers,
};
