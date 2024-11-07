const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");
const { readdirSync } = require("fs");
const path = require("path");

require("dotenv").config();

const app = express();

const http = require("http").createServer(app);

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "https://reseauxsociaux-client.onrender.com",
    ],
  })
);

const io = require("socket.io")(http, {
  path: "/socket.io",
  cors: {
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:3000",
      "https://reseauxsociaux-client.onrender.com",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});

mongoose.connect(process.env.DATABASE);

//middleware
app.use(morgan("dev"));

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

io.on("connect", (socket) => {
  socket.on("new-post", (newPost) => {
    socket.broadcast.emit("new-post-data", newPost);
  });
});

http.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
