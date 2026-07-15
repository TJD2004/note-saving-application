import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, FileText, HardDrive } from 'lucide-react';
import { getTrashFiles, emptyFileTrash } from '../store/slices/fileSlice';
import { getDriveTrash, emptyDriveTrash } from '../store/slices/driveSlice';
import TrashNoteCard from '../components/TrashNoteCard';
import TrashDriveCard from '../components/TrashDriveCard';
import LoadingSpinner from '../components/LoadingSpinner';

const RETENTION_DAYS = 30;

const Trash = () => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState('notes');

  const { trashFiles, isTrashLoading: isNotesTrashLoading } = useSelector((state) => state.files);
  const { trashUploads, isTrashLoading: isDriveTrashLoading } = useSelector((state) => state.drive);

  useEffect(() => {
    dispatch(getTrashFiles());
    dispatch(getDriveTrash());
  }, [dispatch]);

  const activeItems = tab === 'notes' ? trashFiles : trashUploads;
  const isLoading = tab === 'notes' ? isNotesTrashLoading : isDriveTrashLoading;

  const handleEmptyTrash = () => {
    const label = tab === 'notes' ? 'notes' : 'files';
    if (window.confirm(`Permanently delete all ${activeItems.length} ${label} in trash? This can't be undone.`)) {
      dispatch(tab === 'notes' ? emptyFileTrash() : emptyDriveTrash());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-2 rounded-lg">
              <Trash2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trash</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Deleted notes and files stay here for {RETENTION_DAYS} days before they're removed for good
          </p>
        </div>

        {/* Tabs + Empty trash */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
            <button
              onClick={() => setTab('notes')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                tab === 'notes'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Notes ({trashFiles.length})</span>
            </button>
            <button
              onClick={() => setTab('drive')}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                tab === 'drive'
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <HardDrive className="h-4 w-4" />
              <span>My Drive ({trashUploads.length})</span>
            </button>
          </div>

          {activeItems.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 self-start sm:self-auto"
            >
              <Trash2 className="h-4 w-4" />
              <span>Empty trash</span>
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : activeItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tab === 'notes'
              ? trashFiles.map((file) => <TrashNoteCard key={file._id} file={file} />)
              : trashUploads.map((file) => <TrashDriveCard key={file._id} file={file} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Trash2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Trash is empty
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {tab === 'notes'
                ? 'Deleted notes will show up here.'
                : 'Deleted files from My Drive will show up here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trash;
