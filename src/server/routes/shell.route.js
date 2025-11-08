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

        case 'cp':
        case 'copy':
          if (args.length < 2) {
            error = 'cp: missing operands';
          } else {
            output = await executeCP(activePath, args[0], args[1]);
          }
          break;

        case 'mv':
        case 'move':
        case 'rename':
          if (args.length < 2) {
            error = 'mv: missing operands';
          } else {
            output = await executeMV(activePath, args[0], args[1]);
          }
          break;

        case 'grep':
        case 'search':
          if (args.length < 2) {
            error = 'grep: missing operands';
          } else {
            output = await executeGREP(activePath, args[0], args[1]);
          }
          break;

        case 'find':
          if (args.length < 1) {
            error = 'find: missing operand';
          } else {
            output = await executeFIND(activePath, args[0]);
          }
          break;

        case 'df':
          output = await executeDF();
          break;

        case 'du':
          output = await executeDU(activePath, args[0]);
          break;

        case 'env':
          output = getEnvironment();
          break;

        case 'ps':
          output = getProcesses();
          break;

        case 'touch':
          if (!args[0]) {
            error = 'touch: missing operand';
          } else {
            output = await executeTOUCH(activePath, args[0]);
          }
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

// Execute CP (copy) command
async function executeCP(currentPath, source, dest) {
  const sourcePath = combinePaths(currentPath, source);
  const fullSourcePath = getFullPath(sourcePath);

  // Determine destination path
  let destPath;
  if (dest.match(/^(df|dh|ram)\d*:?/i)) {
    destPath = sanitizePath(dest.replace(':', ''));
  } else {
    destPath = combinePaths(currentPath, dest);
  }

  const fullDestPath = getFullPath(destPath);

  try {
    const stats = await fs.stat(fullSourcePath);
    const fileName = path.basename(fullSourcePath);

    if (stats.isDirectory()) {
      // Copy directory recursively
      const targetDir = path.join(fullDestPath, fileName);
      await copyDirectory(fullSourcePath, targetDir);
      return `Directory copied: ${source} -> ${dest}`;
    } else {
      // Copy file
      const targetFile = path.join(fullDestPath, fileName);
      await fs.copyFile(fullSourcePath, targetFile);
      return `File copied: ${source} -> ${dest}`;
    }
  } catch (error) {
    throw new Error(`cp: ${error.code === 'ENOENT' ? 'No such file or directory' : error.message}`);
  }
}

// Helper: Copy directory recursively
async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Execute MV (move/rename) command
async function executeMV(currentPath, source, dest) {
  const sourcePath = combinePaths(currentPath, source);
  const fullSourcePath = getFullPath(sourcePath);

  // For simple rename (same directory)
  if (!dest.includes('/') && !dest.match(/^(df|dh|ram)\d*:?/i)) {
    const destPath = path.join(path.dirname(fullSourcePath), sanitizeName(dest));
    await fs.rename(fullSourcePath, destPath);
    return `Renamed: ${source} -> ${dest}`;
  }

  // For move to different directory
  let destPath;
  if (dest.match(/^(df|dh|ram)\d*:?/i)) {
    destPath = sanitizePath(dest.replace(':', ''));
  } else {
    destPath = combinePaths(currentPath, dest);
  }

  const fullDestPath = getFullPath(destPath);
  const fileName = path.basename(fullSourcePath);
  const targetPath = path.join(fullDestPath, fileName);

  await fs.rename(fullSourcePath, targetPath);
  return `Moved: ${source} -> ${dest}`;
}

// Execute GREP command
async function executeGREP(currentPath, pattern, fileName) {
  const filePath = combinePaths(currentPath, fileName);
  const fullPath = getFullPath(filePath);

  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    const lines = content.split('\n');
    const regex = new RegExp(pattern, 'i');
    const matches = lines.filter(line => regex.test(line));

    if (matches.length === 0) {
      return `grep: no matches found for '${pattern}'`;
    }

    return matches.join('\n');
  } catch (error) {
    throw new Error(`grep: ${fileName}: ${error.code === 'ENOENT' ? 'No such file' : error.message}`);
  }
}

// Execute FIND command
async function executeFIND(currentPath, pattern) {
  const fullPath = getFullPath(currentPath);
  const results = [];

  async function searchDirectory(dir, prefix = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        const displayPath = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
          results.push(displayPath);
        }

        if (entry.isDirectory() && results.length < 100) {
          await searchDirectory(entryPath, displayPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await searchDirectory(fullPath);

  if (results.length === 0) {
    return `find: no files found matching '${pattern}'`;
  }

  return results.join('\n');
}

// Execute DF (disk free) command
async function executeDF() {
  const disks = ['df0', 'dh0', 'dh1', 'ram'];
  let output = 'Filesystem     Size   Used  Avail  Use%\n';

  for (const disk of disks) {
    try {
      const diskPath = getFullPath(disk);
      const stats = await getDiskUsage(diskPath);

      const total = stats.total > 0 ? stats.total : 10 * 1024 * 1024; // Default 10MB
      const used = stats.used;
      const avail = total - used;
      const pct = Math.round((used / total) * 100);

      output += `${disk.padEnd(15)}${formatSize(total).padEnd(7)}${formatSize(used).padEnd(6)}${formatSize(avail).padEnd(7)}${pct}%\n`;
    } catch (error) {
      output += `${disk.padEnd(15)}N/A\n`;
    }
  }

  return output;
}

// Helper: Get disk usage
async function getDiskUsage(diskPath) {
  let totalSize = 0;

  async function calculateSize(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            await calculateSize(entryPath);
          } else {
            const stats = await fs.stat(entryPath);
            totalSize += stats.size;
          }
        } catch (error) {
          // Skip inaccessible files
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }
  }

  await calculateSize(diskPath);

  return {
    total: 100 * 1024 * 1024, // Mock 100MB total
    used: totalSize
  };
}

// Helper: Format size
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}K`;
  return `${Math.round(bytes / (1024 * 1024))}M`;
}

// Execute DU (disk usage) command
async function executeDU(currentPath, target) {
  const targetPath = target ? combinePaths(currentPath, target) : currentPath;
  const fullPath = getFullPath(targetPath);

  let totalSize = 0;

  async function calculateSize(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            await calculateSize(entryPath);
          } else {
            const stats = await fs.stat(entryPath);
            totalSize += stats.size;
          }
        } catch (error) {
          // Skip inaccessible files
        }
      }
    } catch (error) {
      throw new Error(`du: cannot access '${target || currentPath}': ${error.message}`);
    }
  }

  await calculateSize(fullPath);

  return `${formatSize(totalSize)}\t${target || currentPath}`;
}

// Get environment variables
function getEnvironment() {
  return `PATH=/dh0/C:/dh0/System/Utilities
USER=Workbench
SHELL=AmigaShell
HOME=dh0
TERM=amiga
VERSION=WebOS 2.0`;
}

// Get processes (mock)
function getProcesses() {
  return `  PID  STATUS    START TIME           COMMAND
    1  running   ${new Date().toLocaleTimeString().padEnd(20)} AmigaShell
    2  running   ${new Date().toLocaleTimeString().padEnd(20)} Workbench`;
}

// Execute TOUCH command
async function executeTOUCH(currentPath, fileName) {
  const filePath = combinePaths(currentPath, fileName);
  const fullPath = getFullPath(filePath);

  try {
    // Check if file exists
    await fs.access(fullPath);
    // File exists, update timestamp
    const now = new Date();
    await fs.utimes(fullPath, now, now);
    return `Updated timestamp: ${fileName}`;
  } catch (error) {
    // File doesn't exist, create it
    await fs.writeFile(fullPath, '', 'utf-8');
    return `Created file: ${fileName}`;
  }
}

// POST /api/shell/script - Execute script file
router.post('/script', async (req, res) => {
  try {
    const { path: scriptPath, args = [] } = req.body;

    if (!scriptPath) {
      return res.status(400).json({
        error: 'Script path is required',
        exitCode: 1
      });
    }

    const safePath = sanitizePath(scriptPath);
    const fullPath = getFullPath(safePath);

    // Read script file
    let content;
    try {
      content = await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      return res.status(404).json({
        error: `Script not found: ${scriptPath}`,
        exitCode: 1
      });
    }

    // Determine script type
    const ext = path.extname(fullPath).toLowerCase();

    let output = '';
    let exitCode = 0;

    if (ext === '.sh' || ext === '.bash') {
      // Execute shell script line by line
      const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const cmdArgs = parts.slice(1);

        let currentPath = 'dh0';

        switch (cmd) {
          case 'echo':
            output += cmdArgs.join(' ') + '\n';
            break;
          case 'ls':
            output += await executeLS(currentPath) + '\n';
            break;
          case 'pwd':
            output += currentPath + ':\n';
            break;
          case 'date':
            output += new Date().toString() + '\n';
            break;
          default:
            output += `${cmd}: command not supported in scripts\n`;
        }
      }
    } else if (ext === '.js') {
      // Limited JavaScript execution
      const console_output = [];
      const mockConsole = {
        log: (...args) => console_output.push(args.join(' ')),
        error: (...args) => console_output.push('ERROR: ' + args.join(' '))
      };

      try {
        const func = new Function('console', 'args', content);
        func(mockConsole, args);
        output = console_output.join('\n');
      } catch (error) {
        output = `Script error: ${error.message}`;
        exitCode = 1;
      }
    } else {
      return res.status(400).json({
        error: `Unsupported script type: ${ext}`,
        exitCode: 1
      });
    }

    res.json({
      output,
      exitCode
    });
  } catch (error) {
    console.error('Script execution error:', error);
    res.status(500).json({
      error: 'Script execution failed',
      message: error.message,
      exitCode: 1
    });
  }
});

module.exports = router;
