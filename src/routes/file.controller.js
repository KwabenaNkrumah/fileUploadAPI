const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const fileModel = require("./../models/file.model");

const uploadDir = path.resolve(__dirname, "../../uploads");

const saveFileMetaData = async (file) =>
  await fileModel.create({
    originalName: file.originalname,
    fileName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    size: file.size,
  });

const uploadSingleController = async (req, res, next) => {
  let savedFile;
  try {
    if (!req.file)
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });

    saveFile = await saveFileMetaData(req.file);

    return res.status(201).json({
      success: true,
      message: "File uploaded successfilly.",
      data: saveFile,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    next(error);
  }
};

const uploadMultipleController = async (req, res, next) => {
  const files = req.files || [];
  const saveFiles = [];

  try {
    if (files.length === 0)
      return res.status(400).json({
        success: false,
        message: "Please upload at least one file",
      });

    for (const file of files) {
      console.log("loop");
      console.log(file);
      saveFiles.push(await saveFileMetaData(file));
    }

    return res.status(201).json({
      success: true,
      message: "Files uploaded successdully.",
      count: saveFiles.length,
      data: saveFiles,
    });
  } catch (error) {
    // Roll back files and records if saving fails parteay through
    console.log(error.message);
    console.log("==============");
    await Promise.all((file) => fs.unlink(file.path).catch(() => {}));

    await fileModel
      .deleteMany({
        _id: { $in: saveFiles.map((file) => file._id) },
      })
      .catch(() => {});

    next(error);
  }
};

const getFilesController = async (req, res, next) => {
  try {
    let { page = "1", limit = "10", search = "" } = req.query;

    page = +page;
    limit = +limit;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100.",
      });
    search = String(search).trim();

    const escapedSearch = search.replace(/[.*+?^${}|[\]\\}]/g, "\\$&");

    const filter = (search = search
      ? { originalName: { $regex: escapedSearch, $option: "i" } }
      : {});

    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      fileModel
        .find(filter)
        .sort({ crearedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      fileModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

const getFileByIdController = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID.",
      });
    }

    const file = await fileModel.findById(req.params.id).lean();
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

const downloadFileController = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID.",
      });
    }

    const file = await fileModel.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }
    // console.log(file);

    // Build the disk path from the generated filename
    const filePath = path.resolve(uploadDir, file.fileName);
    console.log(path.dirname(filePath));
    console.log(filePath);

    if (path.dirname(filePath) !== uploadDir) {
      res.status(400).json({
        success: false,
        message: "Invalid file path.",
      });
    }

    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "File is missing from the storage",
      });
    }
    res.end();
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const deleteFileController = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file ID.",
      });
    }

    const file = await fileModel.findById(id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }
    const filePath = path.resolve(uploadDir, file.fileName);

    if (path.dirname(filePath) !== uploadDir) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path.",
      });
    }

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") return next(error);
    }

    await fileModel.deleteOne({ _id: file.id });

    return res.status(200).json({
      success: true,
      message: "File deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSingleController,
  uploadMultipleController,
  getFilesController,
  getFileByIdController,
  downloadFileController,
  deleteFileController,
};
