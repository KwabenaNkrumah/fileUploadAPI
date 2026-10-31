const express = require("express");
const app = express();
const fileRouter = require("./routes/file.route");

app.use(express.json());

app.get("/", (req, res) =>
  res.status(200).json({
    sucess: true,
    message: "File upload API running",
  }),
);

app.use("/api/file", fileRouter);

module.exports = app;
