/*
 * File Operations Route
 * Handles file system operations (list, create, update, delete)
 */

import { Router } from 'express';
import { listFiles, createFile, updateFile, deleteFile } from '../controllers/file-operations.controller';

const router = Router();

// GET /api/files - List files in the current directory
router.get('/', listFiles);

// POST /api/files - Create a new file
router.post('/', createFile);

// PUT /api/files/:id - Update an existing file
router.put('/:id', updateFile);

// DELETE /api/files/:id - Delete a file
router.delete('/:id', deleteFile);

export default router;