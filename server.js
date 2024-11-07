const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");
// const router = require("./routes/auth");
// const postRouter = require("./routes/post")
const { readdirSync } = require("fs");
const path = require("path");

require("dotenv").config();

const app = express();

const http = require("http").createServer(app);

const io = require("socket.io")(http, {
  path: "/socket.io",
  cors: {
    origin: [process.env.CLIENT_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-type"],
  },
});

mongoose.connect(process.env.DATABASE);

//middleware
app.use(morgan("dev"));
// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//   })
// );

app.use(
  cors({
    origin: [process.env.CLIENT_URL],
  })
);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

// app.use("/api", router);
let normalizedRoutesPath = path.join(__dirname, "routes");
readdirSync(normalizedRoutesPath).map((r) =>
  app.use("/api", require(`./routes/${r}`))
);

// io.on("connect", (socket) => {
//   socket.on("send-message", (message) => {
//     console.log(message);
//   });
//   console.log("what's up");
// });

io.on("connect", (socket) => {
  socket.on("new-post", (newPost) => {
    socket.broadcast.emit("new-post-data", newPost);
  });
});

http.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
