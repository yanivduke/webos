/*
 * WebOS - Server API Routes
 * This file defines the core API routes for the WebOS operating system interface.
 * All routes are open and accessible without authentication.
 */

import { Router } from 'express';
import systemStatusRoute from './system-status.route';
import fileOperationsRoute from './file-operations.route';
import settingsRoute from './settings.route';

const router = Router();

// Mount all routes
router.use('/system', systemStatusRoute);
router.use('/files', fileOperationsRoute);
router.use('/settings', settingsRoute);

export default router;