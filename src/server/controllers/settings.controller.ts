/*
 * Settings Controller
 * Handles system settings and configuration
 */

import { Request, Response } from 'express';

// Mock settings data (in a real implementation, this would come from configuration files)
const getSettings = (req: Request, res: Response) => {
  try {
    const settings = {
      theme: 'light',
      language: 'en',
      notifications: {
        system: true,
        updates: true,
        alerts: true
      },
      autoSave: true,
      terminal: {
        historySize: 1000,
        fontSize: 12,
        fontFamily: 'Monaco, Consolas, monospace'
      },
      fileSystem: {
        showHidden: false,
        sortFiles: 'name'
      }
    };

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error retrieving settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve settings'
    });
  }
};

const updateSettings = (req: Request, res: Response) => {
  try {
    const { theme, language, notifications, autoSave, terminal, fileSystem } = req.body;
    
    // Validate required fields
    if (!theme) {
      return res.status(400).json({
        success: false,
        error: 'Theme is required'
      });
    }
    
    // Mock settings update
    const updatedSettings = {
      theme: theme || 'light',
      language: language || 'en',
      notifications: {
        system: notifications?.system || true,
        updates: notifications?.updates || true,
        alerts: notifications?.alerts || true
      },
      autoSave: autoSave !== undefined ? autoSave : true,
      terminal: {
        historySize: terminal?.historySize || 1000,
        fontSize: terminal?.fontSize || 12,
        fontFamily: terminal?.fontFamily || 'Monaco, Consolas, monospace'
      },
      fileSystem: {
        showHidden: fileSystem?.showHidden || false,
        sortFiles: fileSystem?.sortFiles || 'name'
      }
    };
    
    res.status(200).json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
};

export {
  getSettings,
  updateSettings
};