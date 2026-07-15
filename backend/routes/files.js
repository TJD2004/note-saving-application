const express = require('express');
const router = express.Router();
const {
  getFiles,
  getFile,
  createFile,
  updateFile,
  deleteFile,
  getTrashFiles,
  restoreFile,
  permanentDeleteFile,
  emptyFileTrash,
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

// Trash routes must come before the generic '/:id' routes below,
// otherwise '/trash' would be matched as an :id of "trash".
router.get('/trash', protect, getTrashFiles);
router.delete('/trash', protect, emptyFileTrash);

router.route('/').get(protect, getFiles).post(protect, createFile);
router.route('/:id').get(protect, getFile).put(protect, updateFile).delete(protect, deleteFile);
router.put('/:id/restore', protect, restoreFile);
router.delete('/:id/permanent', protect, permanentDeleteFile);

module.exports = router;
