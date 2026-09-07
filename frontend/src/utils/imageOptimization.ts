/**
 * Image Optimization Utilities
 * Phase 25 - Performance optimization for image upload and processing
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Compress and resize an image while maintaining aspect ratio
 * @param dataUrl - Base64 data URL of the image
 * @param options - Compression options
 * @returns Promise resolving to compressed base64 data URL
 */
export async function compressImage(
  dataUrl: string,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate target dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const scale = Math.min(widthRatio, heightRatio);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }
        
        // Create canvas and context
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to data URL with compression
        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = dataUrl;
  });
}

/**
 * Calculate the size of a base64 data URL in bytes
 * @param dataUrl - Base64 data URL
 * @returns Size in bytes
 */
export function getDataUrlSize(dataUrl: string): number {
  // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  
  // Calculate size: base64 uses 4 characters for 3 bytes
  // Account for padding
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * Format bytes to human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if an image exceeds a maximum file size
 * @param dataUrl - Base64 data URL
 * @param maxSizeBytes - Maximum allowed size in bytes
 * @returns true if image is within size limit
 */
export function isImageSizeValid(dataUrl: string, maxSizeBytes: number): boolean {
  return getDataUrlSize(dataUrl) <= maxSizeBytes;
}

/**
 * Compress image until it's under a target size
 * @param dataUrl - Base64 data URL
 * @param targetSizeBytes - Target size in bytes
 * @param maxAttempts - Maximum compression attempts
 * @returns Promise resolving to compressed image
 */
export async function compressToTargetSize(
  dataUrl: string,
  targetSizeBytes: number,
  maxAttempts: number = 5
): Promise<string> {
  let compressed = dataUrl;
  let quality = 0.9;
  const qualityStep = 0.1;
  
  for (let i = 0; i < maxAttempts; i++) {
    const size = getDataUrlSize(compressed);
    
    if (size <= targetSizeBytes) {
      return compressed;
    }
    
    quality -= qualityStep;
    if (quality < 0.3) {
      quality = 0.3; // Don't go below 30% quality
    }
    
    compressed = await compressImage(compressed, { quality });
  }
  
  return compressed;
}

/**
 * Validate image dimensions
 * @param dataUrl - Base64 data URL
 * @param minWidth - Minimum width (optional)
 * @param minHeight - Minimum height (optional)
 * @returns Promise resolving to validation result
 */
export async function validateImageDimensions(
  dataUrl: string,
  minWidth?: number,
  minHeight?: number
): Promise<{ valid: boolean; width: number; height: number; error?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      let valid = true;
      let error: string | undefined;
      
      if (minWidth && width < minWidth) {
        valid = false;
        error = `Image width must be at least ${minWidth}px (got ${width}px)`;
      } else if (minHeight && height < minHeight) {
        valid = false;
        error = `Image height must be at least ${minHeight}px (got ${height}px)`;
      }
      
      resolve({ valid, width, height, error });
    };
    
    img.onerror = () => {
      resolve({ valid: false, width: 0, height: 0, error: 'Failed to load image' });
    };
    
    img.src = dataUrl;
  });
}

/**
 * Extract image metadata
 * @param dataUrl - Base64 data URL
 * @returns Promise resolving to image metadata
 */
export async function getImageMetadata(dataUrl: string): Promise<{
  width: number;
  height: number;
  size: number;
  sizeFormatted: string;
  mimeType: string;
}> {
  const validation = await validateImageDimensions(dataUrl);
  const size = getDataUrlSize(dataUrl);
  const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
  
  return {
    width: validation.width,
    height: validation.height,
    size,
    sizeFormatted: formatBytes(size),
    mimeType,
  };
}
