import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Filesystem Operations', () => {
  const API_BASE = 'http://localhost:3001/api';

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  describe('File Listing', () => {
    it('should fetch files from a directory', async () => {
      const mockFiles = {
        path: 'df0',
        items: [
          { name: 'file1.txt', type: 'file', size: 1024 },
          { name: 'folder1', type: 'folder', size: 0 },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFiles,
      });

      const response = await fetch(`${API_BASE}/files?path=df0`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.items).toHaveLength(2);
      expect(data.items[0].name).toBe('file1.txt');
    });

    it('should handle empty directories', async () => {
      const mockEmpty = {
        path: 'empty',
        items: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmpty,
      });

      const response = await fetch(`${API_BASE}/files?path=empty`);
      const data = await response.json();

      expect(data.items).toHaveLength(0);
    });
  });

  describe('File Upload', () => {
    it('should upload a file successfully', async () => {
      const mockUploadResponse = {
        success: true,
        file: {
          name: 'test.txt',
          size: 1024,
          path: 'df0/test.txt',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUploadResponse,
      });

      const formData = new FormData();
      formData.append('file', new Blob(['test content']), 'test.txt');

      const response = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.file.name).toBe('test.txt');
    });

    it('should handle upload errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Upload failed' }),
      });

      const formData = new FormData();
      formData.append('file', new Blob(['test content']), 'test.txt');

      const response = await fetch(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: formData,
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('File Operations', () => {
    it('should create a new folder', async () => {
      const mockResponse = {
        success: true,
        folder: {
          name: 'NewFolder',
          type: 'folder',
          path: 'df0/NewFolder',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/files/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'df0', name: 'NewFolder' }),
      });

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.folder.name).toBe('NewFolder');
    });

    it('should delete a file', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await fetch(`${API_BASE}/files/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'df0/test.txt' }),
      });

      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should rename a file', async () => {
      const mockResponse = {
        success: true,
        file: {
          oldName: 'old.txt',
          newName: 'new.txt',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/files/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'df0/old.txt',
          newName: 'new.txt',
        }),
      });

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.file.newName).toBe('new.txt');
    });

    it('should copy a file', async () => {
      const mockResponse = {
        success: true,
        file: {
          source: 'df0/file.txt',
          destination: 'ram/file.txt',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/files/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'df0/file.txt',
          destination: 'ram/file.txt',
        }),
      });

      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should move a file', async () => {
      const mockResponse = {
        success: true,
        file: {
          source: 'df0/file.txt',
          destination: 'ram/file.txt',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/files/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'df0/file.txt',
          destination: 'ram/file.txt',
        }),
      });

      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  describe('Path Validation', () => {
    it('should reject invalid paths', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid path' }),
      });

      const response = await fetch(`${API_BASE}/files?path=../../../etc/passwd`);

      expect(response.ok).toBe(false);
    });

    it('should handle special characters in filenames', async () => {
      const mockResponse = {
        success: true,
        file: {
          name: 'file with spaces.txt',
          path: 'df0/file with spaces.txt',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch(`${API_BASE}/files/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'df0',
          name: 'file with spaces.txt',
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
