/*
 * System Status Route
 * Provides access to system status information
 */

import { Router } from 'express';
import { getSystemStatus } from '../controllers/system-status.controller';

const router = Router();

// GET /api/system/status - Retrieve system status information
router.get('/status', getSystemStatus);

export default router;