const fs = require('fs');
const path = require('path');
const Upload = require('../models/Upload');
const { UPLOAD_DIR, getCategory } = require('../middleware/upload');

// @desc    Upload a new file (docx, pdf, image, etc.)
// @route   POST /api/uploads
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const doc = await Upload.create({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      category: getCategory(req.file.mimetype),
      user: req.user.id,
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all uploaded files for user (excludes trashed files)
// @route   GET /api/uploads
// @access  Private
const getUploads = async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.user.id, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 });
    res.status(200).json(uploads);
  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download / stream a single uploaded file (works for trashed files too,
//          so a file can still be previewed before being restored)
// @route   GET /api/uploads/:id/download
// @access  Private
const downloadUpload = async (req, res) => {
  try {
    const doc = await Upload.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (doc.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const filePath = path.join(UPLOAD_DIR, doc.storedName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File missing from storage' });
    }

    res.setHeader('Content-Type', doc.mimetype);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(doc.originalName)}"`
    );
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Move an uploaded file to trash (soft delete, file stays on disk)
// @route   DELETE /api/uploads/:id
// @access  Private
const deleteUpload = async (req, res) => {
  try {
    const doc = await Upload.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (doc.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all trashed uploads for user
// @route   GET /api/uploads/trash
// @access  Private
const getTrashUploads = async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.user.id, isDeleted: true })
      .sort({ deletedAt: -1 });
    res.status(200).json(uploads);
  } catch (error) {
    console.error('Get upload trash error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Restore an uploaded file out of trash
// @route   PUT /api/uploads/:id/restore
// @access  Private
const restoreUpload = async (req, res) => {
  try {
    const doc = await Upload.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (doc.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    doc.isDeleted = false;
    doc.deletedAt = null;
    await doc.save();

    res.status(200).json(doc);
  } catch (error) {
    console.error('Restore upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Permanently delete a single uploaded file (removes DB record + file on disk)
// @route   DELETE /api/uploads/:id/permanent
// @access  Private
const permanentDeleteUpload = async (req, res) => {
  try {
    const doc = await Upload.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (doc.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const filePath = path.join(UPLOAD_DIR, doc.storedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Upload.findByIdAndDelete(req.params.id);

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    console.error('Permanent delete upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Empty the drive trash (permanently delete everything in it)
// @route   DELETE /api/uploads/trash
// @access  Private
const emptyUploadTrash = async (req, res) => {
  try {
    const trashed = await Upload.find({ user: req.user.id, isDeleted: true });

    trashed.forEach((doc) => {
      const filePath = path.join(UPLOAD_DIR, doc.storedName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    const result = await Upload.deleteMany({ user: req.user.id, isDeleted: true });
    res.status(200).json({ deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Empty upload trash error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  uploadFile,
  getUploads,
  downloadUpload,
  deleteUpload,
  getTrashUploads,
  restoreUpload,
  permanentDeleteUpload,
  emptyUploadTrash,
};
