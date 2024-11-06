const Post = require("../models/post");

const cloudinary = require("cloudinary").v2;

const https = require("https");
const User = require("../models/user");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadImage = async (req, res) => {
  try {
    // Upload an image
    const result = await cloudinary.uploader.upload(req.files.image.path, {
      agent: agent,
    });
    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.log("cloudinary error", error);
    return res.json({
      error: "file upload failed",
    });
  }
};

const createPost = async (req, res) => {
  const { content, image } = req.body;
  if (Object.keys(content).length < 1) {
    return res.json({
      error: "Content is required",
    });
  }
  try {
    const post = await new Post({
      content,
      image,
      postedBy: req.user._id,
    });
    if (!post) {
      return res.json({
        error: "Post could not be created",
      });
    }
    await post.save();
    postWithUser = await Post.findById(post._id)
      .populate("postedBy", "_id name username email image")
      .populate("comments.postedBy", "_id name username email image");
    return res.json(postWithUser);
  } catch (error) {
    return res.json({
      error: "Something went wrong. Try again",
    });
  }
};

const postsByUser = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("postedBy", "_id name profile_photo")
      .sort({ createdAt: -1 })
      .limit(10);
    if (!posts) {
      return res.json({
        error: "No posts found",
      });
    }
    return res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

const userPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params._id);
    if (!post) {
      return res.json({
        error: "No post found",
      });
    }
    return res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const updatePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params._id, req.body, {
      new: true,
    });
    if (!post) {
      return res.json({
        error: "Post update not succsssful",
      });
    }
    return res.json({
      success: true,
    });
  } catch (err) {}
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params._id);
    if (!post) {
      return res.json({
        error: "Post deletion unsuccessful",
      });
    } else {
      if (post.image && post.image.public_id) {
        const result = await cloudinary.uploader.destroy(post.image.public_id, {
          agent: agent,
        });
        if (!result) {
          console.log("Error deleting image from image server");
        }
      } else {
        console.log("Post has not have image");
      }
      return res.json({
        success: "Post was successfully deleted",
      });
    }
  } catch (err) {
    console.log(err);
  }
};

const newsfeed = async (req, res) => {
  try {
    //pagination parameters
    const page = req.query.page;
    const pageSize = 5;
    const skip = (page - 1) * pageSize;

    const user = await User.findById(req.user._id);
    const following = user.following;
    following.push(user._id);
    const posts = await Post.find({ postedBy: { $in: following } })
      .skip(skip)
      .limit(pageSize)
      .populate("postedBy", "_id name username image")
      .populate("comments.postedBy", "_id name username image")
      .sort({ createdAt: -1 });

    const postsCount = await Post.find({
      postedBy: { $in: following },
    }).estimatedDocumentCount();
    return res.json({ posts, postsCount, pageSize });
  } catch (err) {
    console.log(err);
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      { $addToSet: { likes: req.user._id } },
      { new: true }
    );
    return res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const unlikePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.body._id,
      { $pull: { likes: req.user._id } },
      { new: true }
    );
    return res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const addComment = async (req, res) => {
  const { postId, comment } = req.body;
  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { text: comment, postedBy: req.user._id } },
      },
      { new: true }
    )
      .populate("postedBy", "_id name username image")
      .populate("comments.postedBy", "_id name username image");
    return res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const removeComment = async (req, res) => {
  const { postId } = req.body;
  const commentId = req.params._id;
  console.log("postId ==> ", postId, "commentId ==>", commentId);
  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { comments: { _id: commentId } },
      },
      { new: true }
    );
    console.log("post==>", post);
    return res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params._id)
      .populate("postedBy", "_id name username image")
      .populate("comments.postedBy", "_id name username image");
    if (!post) {
      return res.json({
        error: "No post found",
      });
    }
    return res.json(post);
  } catch (err) {
    console.log(err);
  }
};

const posts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("postedBy", "_id name username image")
      .populate("comments.postedBy", "_id name username image")
      .limit(20)
      .sort({ createdAt: -1 });
    return res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

//admin
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("postedBy", "_id name username image")
      .sort({ createdAt: -1 });
    if (!posts || posts.length < 0) {
      return res.status(200).send("No posts found");
    }
    return res.json(posts);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
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
};
