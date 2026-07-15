import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FileText, RotateCcw, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { restoreFile, permanentDeleteFile } from '../store/slices/fileSlice';

const TrashNoteCard = ({ file }) => {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);

  const handleRestore = async () => {
    setBusy(true);
    try {
      await dispatch(restoreFile(file._id)).unwrap();
    } catch (error) {
      console.error('Failed to restore note:', error);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteForever = async () => {
    if (window.confirm(`Permanently delete "${file.title}"? This can't be undone.`)) {
      setBusy(true);
      try {
        await dispatch(permanentDeleteFile(file._id)).unwrap();
      } catch (error) {
        console.error('Failed to permanently delete note:', error);
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-3 mb-3">
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
          <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {file.title}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Deleted {format(new Date(file.deletedAt), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
        {file.content}
      </p>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleRestore}
          disabled={busy}
          className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors duration-200 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Restore</span>
        </button>
        <button
          onClick={handleDeleteForever}
          disabled={busy}
          className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-200 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete forever</span>
        </button>
      </div>
    </div>
  );
};

export default TrashNoteCard;
