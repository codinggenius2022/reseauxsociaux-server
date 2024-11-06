const express = require("express");
const router = express.Router();
const formidable = require("express-formidable");
const {
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
} = require("../controllers/auth");
const { authenticateToken, isAdmin } = require("../middlewares/auth");
const { uploadImage } = require("../controllers/post");

router.post("/register", register);
router.post("/login", login);
router.get("/current-user", authenticateToken, currentUser);
router.post("/forgot-password", forgotPassword);
router.post(
  "/image-upload",
  authenticateToken,
  formidable({ maxFileSize: 5 * 1024 * 1024 }),
  uploadImage
);
router.put("/profile-update", authenticateToken, profileUpdate);
router.get("/find-users", authenticateToken, findUsers);
router.put("/follow-user", authenticateToken, addFollower, followUser);
router.put("/unfollow-user", authenticateToken, removeFollower, unfollowUser);
router.get("/following", authenticateToken, following);
router.get("/followers", authenticateToken, followers);
router.get("/search-users", authenticateToken, searchUsers);
router.get("/following/:username", authenticateToken, userFollowing);
router.get("/followers/:username", authenticateToken, userFollowers);
router.get("/user-profile/:username", authenticateToken, userProfile);
router.get("/current-admin", authenticateToken, isAdmin, currentAdmin);
router.put("/admin/user/update/:_id", authenticateToken, isAdmin, updateUser);
router.delete(
  "/admin/user/delete/:_id",
  authenticateToken,
  isAdmin,
  deleteUser
);
router.get("/admin/users", authenticateToken, isAdmin, getUsers);
module.exports = router;
