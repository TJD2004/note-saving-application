import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import fileSlice from './slices/fileSlice';
import themeSlice from './slices/themeSlice';
import driveSlice from './slices/driveSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    files: fileSlice,
    theme: themeSlice,
    drive: driveSlice,
  },
});