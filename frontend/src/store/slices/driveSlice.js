import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/uploads`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Upload a new file (docx, pdf, image, etc.)
export const uploadDriveFile = createAsyncThunk(
  'drive/upload',
  async ({ file, onProgress }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(API_URL, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to upload file'
      );
    }
  }
);

// Get all uploaded files
export const getDriveFiles = createAsyncThunk(
  'drive/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load files'
      );
    }
  }
);

// Download / open a file as a blob (keeps auth token out of the URL)
export const downloadDriveFile = createAsyncThunk(
  'drive/download',
  async ({ id, originalName, mode }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${id}/download`, {
        headers: getAuthHeader(),
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(response.data);

      if (mode === 'view') {
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = originalName || 'download';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      // Release the blob URL shortly after use
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);

      return id;
    } catch (error) {
      return rejectWithValue('Failed to download file');
    }
  }
);

// Delete a file (moves to trash)
export const deleteDriveFile = createAsyncThunk(
  'drive/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete file'
      );
    }
  }
);

// Get trashed uploads
export const getDriveTrash = createAsyncThunk(
  'drive/getTrash',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/trash`, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load trash');
    }
  }
);

// Restore a file out of trash
export const restoreDriveFile = createAsyncThunk(
  'drive/restore',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${id}/restore`, {}, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to restore file');
    }
  }
);

// Permanently delete a single file from trash
export const permanentDeleteDriveFile = createAsyncThunk(
  'drive/permanentDelete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${id}/permanent`, { headers: getAuthHeader() });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete file');
    }
  }
);

// Empty the drive trash
export const emptyDriveTrash = createAsyncThunk(
  'drive/emptyTrash',
  async (_, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/trash`, { headers: getAuthHeader() });
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to empty trash');
    }
  }
);

const initialState = {
  uploads: [],
  trashUploads: [],
  isLoading: false,
  isTrashLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,
};

const driveSlice = createSlice({
  name: 'drive',
  initialState,
  reducers: {
    resetDriveError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload
      .addCase(uploadDriveFile.pending, (state) => {
        state.isUploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadDriveFile.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.uploads.unshift(action.payload);
      })
      .addCase(uploadDriveFile.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.error = action.payload;
      })
      // Get all
      .addCase(getDriveFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDriveFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.uploads = action.payload;
      })
      .addCase(getDriveFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteDriveFile.fulfilled, (state, action) => {
        state.uploads = state.uploads.filter((u) => u._id !== action.payload);
      })
      .addCase(deleteDriveFile.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Get trash
      .addCase(getDriveTrash.pending, (state) => {
        state.isTrashLoading = true;
        state.error = null;
      })
      .addCase(getDriveTrash.fulfilled, (state, action) => {
        state.isTrashLoading = false;
        state.trashUploads = action.payload;
      })
      .addCase(getDriveTrash.rejected, (state, action) => {
        state.isTrashLoading = false;
        state.error = action.payload;
      })
      // Restore
      .addCase(restoreDriveFile.fulfilled, (state, action) => {
        state.trashUploads = state.trashUploads.filter((u) => u._id !== action.payload._id);
        state.uploads.unshift(action.payload);
      })
      .addCase(restoreDriveFile.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Permanent delete
      .addCase(permanentDeleteDriveFile.fulfilled, (state, action) => {
        state.trashUploads = state.trashUploads.filter((u) => u._id !== action.payload);
      })
      .addCase(permanentDeleteDriveFile.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Empty trash
      .addCase(emptyDriveTrash.fulfilled, (state) => {
        state.trashUploads = [];
      })
      .addCase(emptyDriveTrash.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { resetDriveError, setUploadProgress } = driveSlice.actions;
export default driveSlice.reducer;
