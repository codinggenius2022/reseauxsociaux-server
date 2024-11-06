const { required } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;

const PostSchema = new Schema(
  {
    content: {
      type: {},
      required: true,
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
    image: {
      url: String,
      public_id: String,
    },
    comments: [
      {
        text: String,
        postedBy: { type: ObjectId, ref: "User" },
        created: { type: Date, default: Date.now },
      },
    ],
    likes: [{ type: ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// note that to be very explicit an _id field can be added to the comments fields like so
// _id: {type: ObjectId, auto: true} which will automatically generate _id for each comment. However, if
// this is not added, mongoose will still generate _id field for each comment.

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
