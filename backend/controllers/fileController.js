const File = require('../models/File');

// @desc    Get all files for user
// @route   GET /api/files
// @access  Private
const getFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 });

    res.status(200).json(files);
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single file
// @route   GET /api/files/:id
// @access  Private

const getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Make sure user owns file
    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    res.status(200).json(file);
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new file
// @route   POST /api/files
// @access  Private

const createFile = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Please add title and content' });
    }

    const file = await File.create({
      title,
      content,
      user: req.user.id,
    });

    res.status(201).json(file);
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update file
// @route   PUT /api/files/:id
// @access  Private

const updateFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Make sure user owns file
    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedFile = await File.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedFile);
  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Move file to trash (soft delete)
// @route   DELETE /api/files/:id
// @access  Private

const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Make sure user owns file
    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all trashed notes for user
// @route   GET /api/files/trash
// @access  Private

const getTrashFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id, isDeleted: true })
      .sort({ deletedAt: -1 });

    res.status(200).json(files);
  } catch (error) {
    console.error('Get trash error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Restore a note out of trash
// @route   PUT /api/files/:id/restore
// @access  Private

const restoreFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.status(200).json(file);
  } catch (error) {
    console.error('Restore file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Permanently delete a single note from trash
// @route   DELETE /api/files/:id/permanent
// @access  Private

const permanentDeleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    console.error('Permanent delete file error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Empty the notes trash (permanently delete everything in it)
// @route   DELETE /api/files/trash
// @access  Private

const emptyFileTrash = async (req, res) => {
  try {
    const result = await File.deleteMany({ user: req.user.id, isDeleted: true });
    res.status(200).json({ deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Empty trash error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFiles,
  getFile,
  createFile,
  updateFile,
  deleteFile,
  getTrashFiles,
  restoreFile,
  permanentDeleteFile,
  emptyFileTrash,
};