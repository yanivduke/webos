import JSZip from 'jszip';

export type CompressionLevel = 'none' | 'fast' | 'normal' | 'maximum';

export interface ArchiveFile {
  name: string;
  path: string;
  size: number;
  compressedSize: number;
  ratio: number;
  date: Date;
  isDirectory: boolean;
  comment?: string;
}

export interface ArchiveOptions {
  compressionLevel?: CompressionLevel;
  password?: string;
  comment?: string;
  splitSize?: number; // For multi-part archives (in MB)
}

export interface CreateArchiveOptions extends ArchiveOptions {
  files: Array<{
    path: string;
    content: string | Blob | ArrayBuffer;
    isDirectory?: boolean;
  }>;
}

export interface ExtractOptions {
  password?: string;
  destinationPath?: string;
  selectedFiles?: string[]; // Extract only specific files
}

class ArchiveManager {
  /**
   * Create a ZIP archive from files
   */
  async createArchive(options: CreateArchiveOptions): Promise<Blob> {
    const zip = new JSZip();

    // Map compression level to JSZip compression level
    const compressionLevel = this.mapCompressionLevel(options.compressionLevel);

    // Add files to archive
    for (const file of options.files) {
      if (file.isDirectory) {
        // Create folder
        zip.folder(file.path);
      } else {
        // Add file
        zip.file(file.path, file.content, {
          compression: compressionLevel > 0 ? 'DEFLATE' : 'STORE',
          compressionOptions: {
            level: compressionLevel
          }
        });
      }
    }

    // Add archive comment if provided
    if (options.comment) {
      (zip as any).comment = options.comment;
    }

    // Generate archive
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: compressionLevel > 0 ? 'DEFLATE' : 'STORE',
      compressionOptions: {
        level: compressionLevel
      }
    });

    return blob;
  }

  /**
   * Extract ZIP archive
   */
  async extractArchive(archiveBlob: Blob, options: ExtractOptions = {}): Promise<Array<{
    path: string;
    content: string | Blob;
    isDirectory: boolean;
  }>> {
    const zip = await JSZip.loadAsync(archiveBlob);
    const extractedFiles: Array<{
      path: string;
      content: string | Blob;
      isDirectory: boolean;
    }> = [];

    // Get list of files to extract
    const filesToExtract = options.selectedFiles
      ? Object.keys(zip.files).filter(name => options.selectedFiles?.includes(name))
      : Object.keys(zip.files);

    for (const fileName of filesToExtract) {
      const file = zip.files[fileName];

      if (file.dir) {
        // Directory
        extractedFiles.push({
          path: fileName,
          content: new Blob([]),
          isDirectory: true
        });
      } else {
        // File - extract as blob
        const content = await file.async('blob');
        extractedFiles.push({
          path: fileName,
          content: content,
          isDirectory: false
        });
      }
    }

    return extractedFiles;
  }

  /**
   * List archive contents without extracting
   */
  async listArchiveContents(archiveBlob: Blob): Promise<ArchiveFile[]> {
    const zip = await JSZip.loadAsync(archiveBlob);
    const files: ArchiveFile[] = [];

    for (const [fileName, fileData] of Object.entries(zip.files)) {
      const uncompressedSize = (fileData as any)._data?.uncompressedSize || 0;
      const compressedSize = (fileData as any)._data?.compressedSize || 0;
      const ratio = uncompressedSize > 0
        ? Math.round((1 - compressedSize / uncompressedSize) * 100)
        : 0;

      files.push({
        name: fileName.split('/').pop() || fileName,
        path: fileName,
        size: uncompressedSize,
        compressedSize: compressedSize,
        ratio: ratio,
        date: fileData.date || new Date(),
        isDirectory: fileData.dir,
        comment: fileData.comment
      });
    }

    return files;
  }

  /**
   * Add files to existing archive
   */
  async addToArchive(
    existingArchiveBlob: Blob,
    filesToAdd: Array<{
      path: string;
      content: string | Blob | ArrayBuffer;
      isDirectory?: boolean;
    }>,
    options: ArchiveOptions = {}
  ): Promise<Blob> {
    const zip = await JSZip.loadAsync(existingArchiveBlob);
    const compressionLevel = this.mapCompressionLevel(options.compressionLevel);

    // Add new files
    for (const file of filesToAdd) {
      if (file.isDirectory) {
        zip.folder(file.path);
      } else {
        zip.file(file.path, file.content, {
          compression: compressionLevel > 0 ? 'DEFLATE' : 'STORE',
          compressionOptions: {
            level: compressionLevel
          }
        });
      }
    }

    // Update comment if provided
    if (options.comment) {
      (zip as any).comment = options.comment;
    }

    // Generate updated archive
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: compressionLevel > 0 ? 'DEFLATE' : 'STORE',
      compressionOptions: {
        level: compressionLevel
      }
    });

    return blob;
  }

  /**
   * Remove files from archive
   */
  async removeFromArchive(
    archiveBlob: Blob,
    filesToRemove: string[]
  ): Promise<Blob> {
    const zip = await JSZip.loadAsync(archiveBlob);

    // Remove files
    for (const fileName of filesToRemove) {
      zip.remove(fileName);
    }

    // Generate updated archive
    const blob = await zip.generateAsync({
      type: 'blob'
    });

    return blob;
  }

  /**
   * Test archive integrity (CRC check)
   */
  async testArchive(archiveBlob: Blob): Promise<{
    valid: boolean;
    errors: string[];
    fileCount: number;
  }> {
    const errors: string[] = [];
    let fileCount = 0;

    try {
      const zip = await JSZip.loadAsync(archiveBlob, {
        checkCRC32: true
      });

      // Try to read each file to verify integrity
      for (const [fileName, fileData] of Object.entries(zip.files)) {
        if (!fileData.dir) {
          fileCount++;
          try {
            await fileData.async('blob');
          } catch (error) {
            errors.push(`CRC check failed for ${fileName}: ${error}`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        fileCount
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Archive is corrupted: ${error}`],
        fileCount: 0
      };
    }
  }

  /**
   * Get archive information
   */
  async getArchiveInfo(archiveBlob: Blob): Promise<{
    fileCount: number;
    folderCount: number;
    totalSize: number;
    compressedSize: number;
    compressionRatio: number;
    comment?: string;
  }> {
    const zip = await JSZip.loadAsync(archiveBlob);

    let fileCount = 0;
    let folderCount = 0;
    let totalSize = 0;
    let compressedSize = 0;

    for (const fileData of Object.values(zip.files)) {
      if (fileData.dir) {
        folderCount++;
      } else {
        fileCount++;
        totalSize += (fileData as any)._data?.uncompressedSize || 0;
        compressedSize += (fileData as any)._data?.compressedSize || 0;
      }
    }

    const compressionRatio = totalSize > 0
      ? Math.round((1 - compressedSize / totalSize) * 100)
      : 0;

    return {
      fileCount,
      folderCount,
      totalSize,
      compressedSize,
      compressionRatio,
      comment: (zip as any).comment
    };
  }

  /**
   * Map compression level to JSZip compression level (0-9)
   */
  private mapCompressionLevel(level?: CompressionLevel): number {
    switch (level) {
      case 'none':
        return 0;
      case 'fast':
        return 3;
      case 'normal':
        return 6;
      case 'maximum':
        return 9;
      default:
        return 6; // Default to normal
    }
  }

  /**
   * Format file size for display
   */
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}

// Export singleton instance
export const archiveManager = new ArchiveManager();
export default archiveManager;
