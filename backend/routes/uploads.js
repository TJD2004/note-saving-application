const express = require('express');
const router = express.Router();
const {
  uploadFile,
  getUploads,
  downloadUpload,
  deleteUpload,
  getTrashUploads,
  restoreUpload,
  permanentDeleteUpload,
  emptyUploadTrash,
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Trash routes first so '/trash' isn't swallowed by any single-segment param route.
router.get('/trash', protect, getTrashUploads);
router.delete('/trash', protect, emptyUploadTrash);

router
  .route('/')
  .get(protect, getUploads)
  .post(protect, upload.single('file'), uploadFile);

router.get('/:id/download', protect, downloadUpload);
router.delete('/:id', protect, deleteUpload);
router.put('/:id/restore', protect, restoreUpload);
router.delete('/:id/permanent', protect, permanentDeleteUpload);

module.exports = router;
