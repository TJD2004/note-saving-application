const fs = require('fs');
const path = require('path');
const File = require('../models/File');
const Upload = require('../models/Upload');
const { UPLOAD_DIR } = require('../middleware/upload');

// How long an item stays in trash before it's permanently removed.
const TRASH_RETENTION_DAYS = Number(process.env.TRASH_RETENTION_DAYS || 30);

const purgeOldTrash = async () => {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  try {
    const noteResult = await File.deleteMany({
      isDeleted: true,
      deletedAt: { $lte: cutoff },
    });

    const oldUploads = await Upload.find({
      isDeleted: true,
      deletedAt: { $lte: cutoff },
    });

    oldUploads.forEach((doc) => {
      const filePath = path.join(UPLOAD_DIR, doc.storedName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    const uploadIds = oldUploads.map((doc) => doc._id);
    if (uploadIds.length) {
      await Upload.deleteMany({ _id: { $in: uploadIds } });
    }

    if (noteResult.deletedCount || uploadIds.length) {
      console.log(
        `Trash cleanup: removed ${noteResult.deletedCount} note(s) and ${uploadIds.length} upload(s) older than ${TRASH_RETENTION_DAYS} days`
      );
    }
  } catch (error) {
    console.error('Trash cleanup error:', error);
  }
};

// Runs once on boot, then once every 24h.
const scheduleTrashCleanup = () => {
  purgeOldTrash();
  setInterval(purgeOldTrash, 24 * 60 * 60 * 1000);
};

module.exports = { scheduleTrashCleanup, purgeOldTrash, TRASH_RETENTION_DAYS };
