import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  File as FileIcon,
  Download,
  Eye,
  Trash2,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { deleteDriveFile, downloadDriveFile } from '../store/slices/driveSlice';
import { formatFileSize, getCategoryStyle } from '../utils/fileHelpers';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ICONS = {
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  slide: Presentation,
  image: ImageIcon,
  text: FileText,
  other: FileIcon,
};

const DriveFileCard = ({ file }) => {
  const dispatch = useDispatch();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const Icon = ICONS[file.category] || FileIcon;
  const style = getCategoryStyle(file.category);
  const isImage = file.category === 'image';
  const [thumbUrl, setThumbUrl] = useState(null);

  useEffect(() => {
    if (!isImage) return undefined;

    let objectUrl;
    const token = localStorage.getItem('token');

    axios
      .get(`${BASE_URL}/api/uploads/${file._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })
      .then((res) => {
        objectUrl = window.URL.createObjectURL(res.data);
        setThumbUrl(objectUrl);
      })
      .catch(() => setThumbUrl(null));

    return () => {
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [file._id, isImage]);

  const handleView = () => {
    dispatch(downloadDriveFile({ id: file._id, originalName: file.originalName, mode: 'view' }));
    setShowMenu(false);
  };

  const handleDownload = () => {
    dispatch(downloadDriveFile({ id: file._id, originalName: file.originalName, mode: 'download' }));
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Move "${file.originalName}" to trash?`)) {
      setIsDeleting(true);
      try {
        await dispatch(deleteDriveFile(file._id)).unwrap();
      } catch (error) {
        console.error('Failed to delete file:', error);
      } finally {
        setIsDeleting(false);
      }
    }
    setShowMenu(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`${style.bg} p-2 rounded-lg shrink-0`}>
              <Icon className={`h-5 w-5 ${style.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-semibold text-gray-900 dark:text-white truncate"
                title={file.originalName}
              >
                {file.originalName}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(file.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 opacity-0 group-hover:opacity-100"
              disabled={isDeleting}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 mt-2 w-44 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div className="py-2">
                  <button
                    onClick={handleView}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isImage && thumbUrl && (
          <button
            onClick={handleView}
            className="block w-full h-32 mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
          >
            <img
              src={thumbUrl}
              alt={file.originalName}
              className="w-full h-full object-cover"
            />
          </button>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="uppercase tracking-wide">{file.category}</span>
          <span>{formatFileSize(file.size)}</span>
        </div>
      </div>
    </div>
  );
};

export default DriveFileCard;
