import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UploadCloud, HardDrive, Search, X } from 'lucide-react';
import { getDriveFiles, uploadDriveFile, resetDriveError, setUploadProgress } from '../store/slices/driveSlice';
import DriveFileCard from '../components/DriveFileCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatFileSize } from '../utils/fileHelpers';

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.svg';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // keep in sync with backend/middleware/upload.js

const MyDrive = () => {
  const dispatch = useDispatch();
  const { uploads, isLoading, isUploading, uploadProgress, error } = useSelector((state) => state.drive);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    dispatch(getDriveFiles());
  }, [dispatch]);

  const totalSize = uploads.reduce((sum, u) => sum + (u.size || 0), 0);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setLocalError('');
    dispatch(resetDriveError());

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        setLocalError(`"${file.name}" is over the 25MB limit and was skipped.`);
        return;
      }
      dispatch(
        uploadDriveFile({
          file,
          onProgress: (pct) => dispatch(setUploadProgress(pct)),
        })
      );
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const filteredUploads = uploads.filter((u) =>
    u.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg">
              <HardDrive className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Drive</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Upload and store PDFs, Word docs, spreadsheets, images and more
          </p>
        </div>

        {/* Upload dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mb-6 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors duration-200 ${
            isDragging
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-purple-400'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
          />
          <UploadCloud className="h-10 w-10 text-purple-500 mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, images &middot; up to 25MB each
          </p>

          {isUploading && (
            <div className="w-full max-w-sm mt-4">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                Uploading&hellip; {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        {(localError || error) && (
          <div className="mb-6 flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
            <span>{localError || error}</span>
            <button onClick={() => { setLocalError(''); dispatch(resetDriveError()); }}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Search + summary bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search your files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {uploads.length} file{uploads.length !== 1 ? 's' : ''} &middot; {formatFileSize(totalSize)} used
            </p>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredUploads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUploads.map((file) => (
              <DriveFileCard key={file._id} file={file} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <HardDrive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No files found' : 'No files yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {searchTerm
                ? `No files match "${searchTerm}".`
                : 'Drag a file into the box above to upload your first document.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDrive;
