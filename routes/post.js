const express = require("express");
const router = express.Router();
const {
  createPost,
  uploadImage,
  postsByUser,
  userPost,
  updatePost,
  deletePost,
  newsfeed,
  likePost,
  unlikePost,
  addComment,
  removeComment,
  getPost,
  posts,
  getPosts,
} = require("../controllers/post");
const {
  authenticateToken,
  canUpdateAndDelete,
  isAdmin,
} = require("../middlewares/auth");
const formidable = require("express-formidable");

router.post("/create-post", authenticateToken, createPost);
router.post(
  "/image-upload",
  authenticateToken,
  formidable({ maxFileSize: 5 * 1024 * 1024 }),
  uploadImage
);
router.get("/user-posts", authenticateToken, postsByUser);
router.get("/newsfeed", authenticateToken, newsfeed);
router.get("/user-post/:_id", authenticateToken, userPost);
router.put(
  "/update-post/:_id",
  authenticateToken,
  canUpdateAndDelete,
  updatePost
);
router.delete(
  "/delete-post/:_id",
  authenticateToken,
  canUpdateAndDelete,
  deletePost
);
router.put("/like-post", authenticateToken, likePost);
router.put("/unlike-post", authenticateToken, unlikePost);
router.put("/add-comment", authenticateToken, addComment);
router.put("/post/remove-comment/:_id", authenticateToken, removeComment);
router.get("/post/:_id", getPost);
router.get("/posts", posts);

//admin
router.get("/admin/posts", authenticateToken, isAdmin, getPosts);
router.delete(
  "/admin/post/delete/:_id",
  authenticateToken,
  isAdmin,
  deletePost
);
module.exports = router;
