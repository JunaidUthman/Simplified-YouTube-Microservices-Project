import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

export class StorageService {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || process.env.UPLOAD_DIR || './uploads';
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save buffer/file to local storage
   */
  async saveFile(buffer: Buffer, originalFilename: string = 'video.mp4'): Promise<{ filename: string; filePath: string; url: string }> {
    this.ensureUploadDir();
    const ext = extname(originalFilename) || '.mp4';
    const filename = `${randomUUID()}${ext}`;
    const filePath = join(this.uploadDir, filename);

    writeFileSync(filePath, buffer);

    // Relative URL path for API serving
    const url = `/uploads/${filename}`;
    return { filename, filePath, url };
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(filename: string): Promise<boolean> {
    const filePath = join(this.uploadDir, filename);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Get local file path for streaming or downloading
   */
  getFilePath(filename: string): string | null {
    const filePath = join(this.uploadDir, filename);
    if (existsSync(filePath)) {
      return filePath;
    }
    return null;
  }
}
