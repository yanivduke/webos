/*
 * Settings Route
 * Handles system settings and configuration
 */

import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';

const router = Router();

// GET /api/settings - Retrieve current system settings
router.get('/', getSettings);

// PUT /api/settings - Update system settings
router.put('/', updateSettings);

export default router;