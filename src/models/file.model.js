const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      require: true,
      trim: true,
    },
    fileName: {
      type: String,
      require: true,
      unique: true,
    },
    filePath: {
      type: String,
      require: true,
    },
    mimeType: {
      type: String,
      require: true,
    },
    size: {
      type: String,
      require: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("File", fileSchema);
