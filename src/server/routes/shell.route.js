const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');
const stateManager = require('../utils/state-manager');
const { sanitizePath, sanitizeName, resolveStoragePath } = require('../utils/path-utils');

// Storage base path
const STORAGE_BASE = path.join(__dirname, '../storage/workbench');
const SHELL_STATE_KEY = 'app_shell';
const MAX_HISTORY = 200;

/**
 * Shell Command Routes - Execute shell commands
 */

// Utility to get full path
const getFullPath = (diskPath, fileName = '') => {
  return resolveStoragePath(STORAGE_BASE, diskPath, fileName);
};

const loadShellState = async () => {
  return stateManager.load(SHELL_STATE_KEY, {
    history: [],
    lastPath: 'dh0',
    lastExecutedAt: null,
    savedAt: null
  });
};

const saveShellState = async (state) => {
  const payload = {
    history: state.history || [],
    lastPath: state.lastPath || 'dh0',
    lastExecutedAt: new Date().toISOString()
  };
  await stateManager.save(SHELL_STATE_KEY, {
    ...payload,
    savedAt: payload.lastExecutedAt
  });
  return payload;
};

const combinePaths = (...segments) => {
  return sanitizePath(segments.filter(Boolean).join('/'));
};

// POST /api/shell/execute - Execute shell command
router.post('/execute', async (req, res) => {
  try {
    const { command, currentPath = 'dh0' } = req.body;

    if (!command) {
      return res.status(400).json({
        error: 'Command required',
        output: ''
      });
    }

    const shellState = await loadShellState();
    let activePath = sanitizePath(currentPath || shellState.lastPath || 'dh0');

    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output = '';
    let error = null;
    let newPath = activePath;

    try {
      switch (cmd) {
        case 'ls':
        case 'dir':
          output = await executeLS(activePath);
          break;

        case 'cd':
          const result = await executeCD(activePath, args[0]);
          output = result.output;
          newPath = result.newPath;
          break;

        case 'pwd':
          output = `${activePath}:`;
          break;

        case 'cat':
        case 'type':
          if (!args[0]) {
            error = 'cat: missing file operand';
          } else {
            output = await executeCAT(activePath, args[0]);
          }
          break;

        case 'mkdir':
          if (!args[0]) {
            error = 'mkdir: missing operand';
          } else {
            output = await executeMKDIR(activePath, args[0]);
          }
          break;

        case 'rm':
        case 'delete':
          if (!args[0]) {
            error = 'rm: missing operand';
          } else {
            output = await executeRM(activePath, args[0]);
          }
          break;

        case 'echo':
          output = args.join(' ');
          break;

        case 'date':
          output = new Date().toString();
          break;

        case 'clear':
        case 'cls':
          output = '[CLEAR]';
          break;

        case 'help':
          output = getHelpText();
          break;

        case 'version':
          output = 'WebOS Amiga Workbench v2.0.0\nKickstart 40.68, Workbench 40.42';
          break;

        case 'about':
          output = getAboutText();
          break;

        default:
          error = `${cmd}: command not found. Type 'help' for available commands.`;
      }
    } catch (cmdError) {
      error = cmdError.message;
    }

    const now = new Date().toISOString();
    const historyEntry = {
      id: randomUUID(),
      command,
      cwd: activePath,
      output,
      error,
      executedAt: now
    };

    const history = shellState.history || [];
    history.push(historyEntry);
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    const persisted = await saveShellState({
      history,
      lastPath: newPath || activePath
    });

    res.json({
      command: command,
      output: output,
      error: error,
      currentPath: persisted.lastPath,
      savedAt: persisted.lastExecutedAt
    });

  } catch (error) {
    res.status(500).json({
      error: 'Command execution failed',
      message: error.message,
      output: ''
    });
  }
});

// Execute LS command
async function executeLS(currentPath) {
  const fullPath = getFullPath(currentPath);

  try {
    const items = await fs.readdir(fullPath);

    if (items.length === 0) {
      return 'Directory is empty';
    }

    let output = '';
    for (const item of items) {
      const itemPath = path.join(fullPath, item);
      const stats = await fs.stat(itemPath);
      const type = stats.isDirectory() ? 'DIR' : '   ';
      const size = stats.isDirectory() ? '' : `${stats.size}`;
      output += `${type}  ${item.padEnd(30)} ${size}\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`ls: cannot access '${currentPath}': ${error.message}`);
  }
}

// Execute CD command
async function executeCD(currentPath, newPath) {
  if (!newPath) {
    return {
      output: currentPath + ':',
      newPath: currentPath
    };
  }

  // Handle absolute paths (disk names)
  if (newPath.match(/^(df|dh|ram)\d*:?$/i)) {
    const disk = newPath.replace(':', '');
    const fullPath = getFullPath(disk);

    try {
      await fs.access(fullPath);
      return {
        output: `Changed to ${disk}:`,
        newPath: sanitizePath(disk)
      };
    } catch {
      throw new Error(`cd: ${disk}: No such disk`);
    }
  }

  // Handle relative paths
  if (newPath === '..') {
    const segments = sanitizePath(currentPath).split('/');
    if (segments.length <= 1) {
      return {
        output: 'dh0:',
        newPath: 'dh0'
      };
    }
    segments.pop();
    const parent = segments.join('/');
    return {
      output: `${parent}:`,
      newPath: parent
    };
  }

  // Try to cd into subdirectory
  const combined = combinePaths(currentPath, newPath);
  const fullPath = getFullPath(combined);
  try {
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      const relPath = sanitizePath(path.relative(STORAGE_BASE, fullPath));
      return {
        output: `Changed to ${relPath}`,
        newPath: relPath
      };
    } else {
      throw new Error(`cd: ${newPath}: Not a directory`);
    }
  } catch (error) {
    throw new Error(`cd: ${newPath}: No such directory`);
  }
}

// Execute CAT command
async function executeCAT(currentPath, fileName) {
  const targetPath = combinePaths(currentPath, fileName);
  const fullPath = getFullPath(targetPath);

  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`cat: ${fileName}: ${error.code === 'ENOENT' ? 'No such file' : error.message}`);
  }
}

// Execute MKDIR command
async function executeMKDIR(currentPath, dirName) {
  const targetPath = combinePaths(currentPath, dirName);
  const fullPath = getFullPath(targetPath);

  try {
    await fs.mkdir(fullPath, { recursive: false });
    return `Directory created: ${dirName}`;
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(`mkdir: ${dirName}: Directory already exists`);
    }
    throw new Error(`mkdir: ${dirName}: ${error.message}`);
  }
}

// Execute RM command
async function executeRM(currentPath, fileName) {
  const targetPath = combinePaths(currentPath, fileName);
  const fullPath = getFullPath(targetPath);

  try {
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      // Move directory to trash
      const safeBase = sanitizeName(path.basename(targetPath) || fileName);
      const trashPath = path.join(STORAGE_BASE, 'trash', `${safeBase}_${Date.now()}`);
      await fs.rename(fullPath, trashPath);
      return `Directory removed: ${safeBase}`;
    } else {
      // Move file to trash
      const safeBase = sanitizeName(path.basename(targetPath) || fileName);
      const trashPath = path.join(STORAGE_BASE, 'trash', `${safeBase}_${Date.now()}`);
      await fs.rename(fullPath, trashPath);
      return `File removed: ${safeBase}`;
    }
  } catch (error) {
    throw new Error(`rm: ${fileName}: ${error.code === 'ENOENT' ? 'No such file or directory' : error.message}`);
  }
}

// Get help text
function getHelpText() {
  return `Available Commands:
─────────────────────────────────────────────
File System:
  ls, dir               List files in current directory
  cd <path>            Change directory
  pwd                  Show current directory
  cat, type <file>     Display file contents
  mkdir <name>         Create new directory
  rm, delete <file>    Remove file or directory

System:
  help                 Show this help message
  clear, cls           Clear screen
  echo <text>          Display message
  date                 Show current date and time
  about                About this system
  version              Show version information
─────────────────────────────────────────────`;
}

// Get about text
function getAboutText() {
  return `
╔═══════════════════════════════════════════╗
║                                           ║
║      WebOS Amiga Workbench v2.0.0        ║
║                                           ║
║    A retro web-based operating system    ║
║    inspired by Amiga Workbench 3.1       ║
║                                           ║
║    Built with Vue 3 + Express.js         ║
║                                           ║
║    "Only Amiga makes it possible!"       ║
║                                           ║
╚═══════════════════════════════════════════╝
`;
}

module.exports = router;
