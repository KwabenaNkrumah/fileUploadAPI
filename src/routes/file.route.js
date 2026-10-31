const express = require("express");
const router = express.Router();
const uploadMiddleware = require("./../middleware/upload.middleware");

const {
  uploadSingleController,
  uploadMultipleController,
  getFilesController,
  getFileByIdController,
  downloadFileController,
  deleteFileController,
} = require("./file.controller");

// Upload one file using the form field 'file
router.post("/upload", uploadMiddleware.single("file"), uploadSingleController);

// upload upto 10 files using the form field 'files'
router.post(
  "/upload/multiple",
  uploadMiddleware.array("files", 10),
  uploadMultipleController,
);

// List files, with optional pagination and search
router.get("/", getFilesController);

// Download must be declared before the general ID route
router.get("/:id/download", downloadFileController);

// Get file metadata
router.get("/:id", getFileByIdController);

// Delete a file
router.delete("/:id", deleteFileController);

module.exports = router;
