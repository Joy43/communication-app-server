/**
 * Cloudinary Configuration Module
 *
 * This module configures Cloudinary for file uploads.
 * Make sure to include this in your main app.module.ts
 */

export const cloudinaryConfig = {
  isGlobal: true,
  envFilePath: '.env',
};

/**
 * Environment Variables Required:
 *
 * Cloud_Name: Your Cloudinary cloud name
 * API_key: Your Cloudinary API key
 * API_Secret: Your Cloudinary API secret
 *
 * Example .env file:
 * Cloud_Name=your_cloud_name
 * API_key=your_api_key
 * API_Secret=your_api_secret
 */

/**
 * Configuration validation schema (optional but recommended)
 */
export const cloudinaryValidationSchema = {
  Cloud_Name: {
    type: 'string',
    description: 'Cloudinary cloud name',
  },
  API_key: {
    type: 'string',
    description: 'Cloudinary API key',
  },
  API_Secret: {
    type: 'string',
    description: 'Cloudinary API secret',
  },
};

/**
 * Cloudinary upload options
 */
export interface CloudinaryUploadOptions {
  folder?: string; 
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  use_filename?: boolean; 
  unique_filename?: boolean; 
  tags?: string[]; 
  max_file_size?: number; 
  max_files_per_request?: number; 
}

/**
 * Default upload options
 */
export const defaultCloudinaryUploadOptions: CloudinaryUploadOptions = {
  folder: 'communication-app',
  resource_type: 'auto',
  use_filename: true,
  unique_filename: true,
  tags: ['communication-app'],
  max_file_size: 100 * 1024 * 1024, 
  max_files_per_request: 10,
};

/**
 * Supported file types
 */
export const SUPPORTED_FILE_TYPES = {
  images: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  videos: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
  ],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export const ALL_SUPPORTED_MIME_TYPES =
  Object.values(SUPPORTED_FILE_TYPES).flat();
