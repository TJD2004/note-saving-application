const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  storedName: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  category: {
    // pdf | doc | image | sheet | slide | text | other
    type: String,
    default: 'other',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

uploadSchema.index({ user: 1, createdAt: -1 });
uploadSchema.index({ user: 1, isDeleted: 1 });

module.exports = mongoose.model('Upload', uploadSchema);
