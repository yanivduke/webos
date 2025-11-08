// WebOS Shell Command Interpreter
// Implements Amiga-style CLI with Unix-like commands

export interface ShellCommand {
  name: string;
  description: string;
  usage: string;
  aliases?: string[];
  execute: (_args) => Promise<CommandResult>;
}

export interface ShellContext {
  currentPath: string;
  environment: Record<string, string>;
  history: string[];
  processes: ShellProcess[];
  outputCallback?: (output: string, type?: 'stdout' | 'stderr') => void;
}

export interface CommandResult {
  output: string;
  exitCode: number;
  error?: string;
  newPath?: string;
}

export interface ShellProcess {
  id: number;
  name: string;
  command: string;
  status: 'running' | 'stopped' | 'zombie';
  startTime: Date;
  output: string[];
}

class ShellInterpreter {
  private commands: Map<string, ShellCommand> = new Map();
  private context: ShellContext;
  private processIdCounter = 1;

  constructor(initialPath: string = 'dh0') {
    this.context = {
      currentPath: initialPath,
      environment: {
        PATH: '/dh0/C:/dh0/System/Utilities',
        USER: 'Workbench',
        SHELL: 'AmigaShell',
        HOME: 'dh0',
        TERM: 'amiga',
        VERSION: 'WebOS 2.0',
      },
      history: [],
      processes: [],
    };

    this.registerBuiltinCommands();
  }

  private registerBuiltinCommands() {
    // ls - List directory contents
    this.registerCommand({
      name: 'ls',
      description: 'List directory contents',
      usage: 'ls [path] [-l] [-a]',
      aliases: ['dir', 'list'],
      execute: async (_args) => {
        const longFormat = args.includes('-l');
        const showHidden = args.includes('-a');
        const path = args.find(a => !a.startsWith('-')) || ctx.currentPath;

        try {
          const response = await fetch(`/api/files/list?path=${encodeURIComponent(path)}`);
          if (!response.ok) {
            return { output: '', exitCode: 1, error: `ls: cannot access '${path}': No such file or directory` };
          }

          const data = await response.json();
          let output = '';

          if (data.items && data.items.length > 0) {
            const items = showHidden ? data.items : data.items.filter((i: any) => !i.name.startsWith('.'));

            if (longFormat) {
              output = items.map((item: any) => {
                const type = item.type === 'folder' ? 'd' : '-';
                const size = item.size || '0';
                const date = item.modified ? new Date(item.modified).toLocaleDateString() : 'Unknown';
                return `${type}rw-r--r--  1 user  ${size.padStart(8)}  ${date}  ${item.name}`;
              }).join('\n');
            } else {
              // Grid format
              const names = items.map((i: any) => i.type === 'folder' ? `${i.name}/` : i.name);
              output = names.join('  ');
            }
          } else {
            output = '';
          }

          return { output, exitCode: 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `ls: error reading directory: ${error}` };
        }
      }
    });

    // cd - Change directory
    this.registerCommand({
      name: 'cd',
      description: 'Change directory',
      usage: 'cd <path>',
      execute: async (_args) => {
        if (_args) {
          return { output: ctx.environment.HOME || 'dh0', exitCode: 0, newPath: ctx.environment.HOME || 'dh0' };
        }

        let newPath = args[0];

        // Handle special paths
        if (newPath === '..') {
          const parts = ctx.currentPath.split('/');
          parts.pop();
          newPath = parts.join('/') || parts[0] || 'dh0';
        } else if (newPath === '.') {
          newPath = ctx.currentPath;
        } else if (newPath === '~') {
          newPath = ctx.environment.HOME || 'dh0';
        } else if (!newPath.includes('/') && !newPath.includes(':')) {
          // Relative path
          newPath = `${ctx.currentPath}/${newPath}`;
        }

        // Verify path exists
        try {
          const response = await fetch(`/api/files/list?path=${encodeURIComponent(newPath)}`);
          if (!response.ok) {
            return { output: '', exitCode: 1, error: `cd: ${newPath}: No such file or directory` };
          }
          return { output: '', exitCode: 0, newPath };
        } catch (error) {
          return { output: '', exitCode: 1, error: `cd: ${newPath}: No such file or directory` };
        }
      }
    });

    // pwd - Print working directory
    this.registerCommand({
      name: 'pwd',
      description: 'Print working directory',
      usage: 'pwd',
      execute: async (_args) => {
        return { output: ctx.currentPath, exitCode: 0 };
      }
    });

    // cat - Display file contents
    this.registerCommand({
      name: 'cat',
      description: 'Display file contents',
      usage: 'cat <file> [file2 ...]',
      aliases: ['type'],
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'cat: missing file operand' };
        }

        let output = '';
        for (const file of args) {
          const path = file.includes('/') ? file : `${ctx.currentPath}/${file}`;

          try {
            const response = await fetch('/api/files/read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path })
            });

            if (!response.ok) {
              output += `cat: ${file}: No such file or directory\n`;
              continue;
            }

            const data = await response.json();
            output += data.content + (_args);
          } catch (error) {
            output += `cat: ${file}: Error reading file\n`;
          }
        }

        return { output: output.trimEnd(), exitCode: 0 };
      }
    });

    // mkdir - Create directory
    this.registerCommand({
      name: 'mkdir',
      description: 'Create directory',
      usage: 'mkdir <name>',
      aliases: ['makedir'],
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'mkdir: missing operand' };
        }

        const name = args[0];
        try {
          const response = await fetch('/api/files/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: ctx.currentPath,
              name,
              type: 'folder'
            })
          });

          if (!response.ok) {
            const data = await response.json();
            return { output: '', exitCode: 1, error: `mkdir: cannot create directory '${name}': ${data.error}` };
          }

          return { output: `Directory '${name}' created`, exitCode: 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `mkdir: error creating directory: ${error}` };
        }
      }
    });

    // rm - Remove file/folder
    this.registerCommand({
      name: 'rm',
      description: 'Remove file or folder',
      usage: 'rm <name> [-r] [-f]',
      aliases: ['delete', 'del'],
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'rm: missing operand' };
        }

        const name = args.find(a => !a.startsWith('-')) || '';
        const path = name.includes('/') ? name : `${ctx.currentPath}/${name}`;

        try {
          const response = await fetch(`/api/files/delete?path=${encodeURIComponent(path)}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            return { output: '', exitCode: 1, error: `rm: cannot remove '${name}': No such file or directory` };
          }

          return { output: `Removed '${name}'`, exitCode: 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `rm: error removing file: ${error}` };
        }
      }
    });

    // cp - Copy file/folder
    this.registerCommand({
      name: 'cp',
      description: 'Copy file or folder',
      usage: 'cp <source> <dest>',
      aliases: ['copy'],
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'cp: missing file operand' };
        }

        const source = args[0].includes('/') ? args[0] : `${ctx.currentPath}/${args[0]}`;
        const dest = args[1].includes('/') ? args[1] : ctx.currentPath;

        try {
          const response = await fetch('/api/files/copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourcePath: source, destinationPath: dest })
          });

          if (!response.ok) {
            const data = await response.json();
            return { output: '', exitCode: 1, error: `cp: ${data.error}` };
          }

          return { output: `Copied '${args[0]}' to '${args[1]}'`, exitCode: 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `cp: error copying: ${error}` };
        }
      }
    });

    // mv - Move/rename file/folder
    this.registerCommand({
      name: 'mv',
      description: 'Move or rename file/folder',
      usage: 'mv <source> <dest>',
      aliases: ['rename', 'move'],
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'mv: missing file operand' };
        }

        const source = args[0].includes('/') ? args[0] : `${ctx.currentPath}/${args[0]}`;

        try {
          const response = await fetch('/api/files/rename', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(_args)
          });

          if (!response.ok) {
            const data = await response.json();
            return { output: '', exitCode: 1, error: `mv: ${data.error}` };
          }

          return { output: `Renamed '${args[0]}' to '${args[1]}'`, exitCode: 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `mv: error renaming: ${error}` };
        }
      }
    });

    // echo - Print text
    this.registerCommand({
      name: 'echo',
      description: 'Print text',
      usage: 'echo <text>',
      execute: async (_args) => {
        const text = args.join(' ');
        // Replace environment variables
        const output = text.replace(/\$(\w+)/g, (match, varName) => {
          return ctx.environment[varName] || '';
        });
        return { output, exitCode: 0 };
      }
    });

    // clear - Clear terminal
    this.registerCommand({
      name: 'clear',
      description: 'Clear terminal screen',
      usage: 'clear',
      aliases: ['cls'],
      execute: async () => {
        return { output: '\x1b[2J\x1b[H', exitCode: 0 };
      }
    });

    // help - Show help
    this.registerCommand({
      name: 'help',
      description: 'Show help information',
      usage: 'help [command]',
      aliases: ['?', 'man'],
      execute: async (_args) => {
        if (_args) {
          const cmd = this.commands.get(_args);
          if (cmd) {
            return {
              output: `${cmd.name} - ${cmd.description}\nUsage: ${cmd.usage}${cmd.aliases ? '\nAliases: ' + cmd.aliases.join(', ') : ''}`,
              exitCode: 0
            };
          }
          return { output: '', exitCode: 1, error: `help: no help topics match '${args[0]}'` };
        }

        const commandList = Array.from(this.commands.values())
          .map(cmd => `  ${cmd.name.padEnd(12)} ${cmd.description}`)
          .join('\n');

        return {
          output: `WebOS AmigaShell - Available Commands:\n\n${commandList}\n\nType 'help <command>' for detailed information.`,
          exitCode: 0
        };
      }
    });

    // history - Show command history
    this.registerCommand({
      name: 'history',
      description: 'Show command history',
      usage: 'history',
      execute: async (_args) => {
        const output = ctx.history.map((cmd, i) => `${(i + 1).toString().padStart(4)}  ${cmd}`).join('\n');
        return { output, exitCode: 0 };
      }
    });

    // grep - Search in file
    this.registerCommand({
      name: 'grep',
      description: 'Search for pattern in file',
      usage: 'grep <pattern> <file>',
      aliases: ['search'],
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'grep: missing operands' };
        }

        const pattern = args[0];
        const file = args[1];
        const path = file.includes('/') ? file : `${ctx.currentPath}/${file}`;

        try {
          const response = await fetch('/api/files/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
          });

          if (!response.ok) {
            return { output: '', exitCode: 1, error: `grep: ${file}: No such file` };
          }

          const data = await response.json();
          const lines = data.content.split('\n');
          const regex = new RegExp(pattern, 'i');
          const matches = lines.filter((line: string) => regex.test(line));

          return { output: matches.join('\n'), exitCode: matches.length > 0 ? 0 : 1 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `grep: error: ${error}` };
        }
      }
    });

    // find - Find files
    this.registerCommand({
      name: 'find',
      description: 'Find files by name',
      usage: 'find <path> <pattern>',
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'find: missing operands' };
        }

        const searchPath = args[0] || ctx.currentPath;
        const pattern = args[1] || '*';

        try {
          const response = await fetch(`/api/files/search?query=${encodeURIComponent(pattern)}&disk=${encodeURIComponent(searchPath)}`);
          if (!response.ok) {
            return { output: '', exitCode: 1, error: 'find: search failed' };
          }

          const data = await response.json();
          const output = data.results.map((r: any) => r.path).join('\n');
          return { output, exitCode: 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `find: error: ${error}` };
        }
      }
    });

    // df - Show disk space
    this.registerCommand({
      name: 'df',
      description: 'Show disk space usage',
      usage: 'df',
      execute: async () => {
        try {
          const response = await fetch('/api/system/status');
          const data = await response.json();

          let output = 'Filesystem     Size   Used  Avail  Use%\n';
          output += `df0:          720K   256K   464K   35%\n`;
          output += `dh0:          80M    42M    38M    52%\n`;
          output += `dh1:          120M   18M    102M   15%\n`;
          output += `ram:          ${data.memory?.fastMem || '512K'}   64K    448K   12%\n`;

          return { output, exitCode: 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: 'df: cannot read disk info' };
        }
      }
    });

    // du - Show directory size
    this.registerCommand({
      name: 'du',
      description: 'Show directory size',
      usage: 'du [path]',
      execute: async (_args) => {
        const path = args[0] || ctx.currentPath;

        try {
          const response = await fetch(`/api/files/list?path=${encodeURIComponent(path)}`);
          if (!response.ok) {
            return { output: '', exitCode: 1, error: `du: ${path}: No such directory` };
          }

          const data = await response.json();
          let totalSize = 0;

          if (data.items) {
            data.items.forEach((item: any) => {
              if (item.size) {
                const match = item.size.match(/^([\d.]+)([KMG]?)$/);
                if (match) {
                  let size = parseFloat(match[1]);
                  const unit = match[2];
                  if (unit === 'K') size *= 1024;
                  else if (unit === 'M') size *= 1024 * 1024;
                  else if (unit === 'G') size *= 1024 * 1024 * 1024;
                  totalSize += size;
                }
              }
            });
          }

          const formatted = totalSize > 1024 * 1024
            ? `${(totalSize / (1024 * 1024)).toFixed(1)}M`
            : totalSize > 1024
              ? `${(totalSize / 1024).toFixed(1)}K`
              : `${totalSize}`;

          return { output: `${formatted}\t${path}`, exitCode: 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `du: error: ${error}` };
        }
      }
    });

    // date - Show current date/time
    this.registerCommand({
      name: 'date',
      description: 'Display current date and time',
      usage: 'date',
      execute: async () => {
        const now = new Date();
        const output = now.toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        return { output, exitCode: 0 };
      }
    });

    // env - Show environment variables
    this.registerCommand({
      name: 'env',
      description: 'Show environment variables',
      usage: 'env',
      aliases: ['set'],
      execute: async (_args) => {
        const output = Object.entries(ctx.environment)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');
        return { output, exitCode: 0 };
      }
    });

    // export - Set environment variable
    this.registerCommand({
      name: 'export',
      description: 'Set environment variable',
      usage: 'export <var>=<value>',
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'export: missing operand' };
        }

        const arg = args.join(' ');
        const match = arg.match(/^(\w+)=(.*)$/);
        if (!match) {
          return { output: '', exitCode: 1, error: 'export: invalid syntax' };
        }

        ctx.environment[match[1]] = match[2];
        return { output: '', exitCode: 0 };
      }
    });

    // ps - List processes
    this.registerCommand({
      name: 'ps',
      description: 'List running processes',
      usage: 'ps',
      execute: async (_args) => {
        if (ctx.processes.length === 0) {
          return { output: 'No processes running', exitCode: 0 };
        }

        let output = '  PID  STATUS    START TIME           COMMAND\n';
        output += ctx.processes.map(p => {
          const time = p.startTime.toLocaleTimeString();
          return `${p.id.toString().padStart(5)}  ${p.status.padEnd(8)}  ${time.padEnd(20)} ${p.command}`;
        }).join('\n');

        return { output, exitCode: 0 };
      }
    });

    // kill - Kill process
    this.registerCommand({
      name: 'kill',
      description: 'Kill a process',
      usage: 'kill <pid>',
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'kill: missing operand' };
        }

        const pid = parseInt(_args);
        const index = ctx.processes.findIndex(p => p.id === pid);

        if (index === -1) {
          return { output: '', exitCode: 1, error: `kill: (${pid}) - No such process` };
        }

        ctx.processes[index].status = 'stopped';
        return { output: `Process ${pid} terminated`, exitCode: 0 };
      }
    });

    // exec - Execute script
    this.registerCommand({
      name: 'exec',
      description: 'Execute a script file',
      usage: 'exec <script>',
      aliases: ['run', 'execute'],
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'exec: missing script operand' };
        }

        const scriptPath = args[0].includes('/') ? args[0] : `${ctx.currentPath}/${args[0]}`;

        try {
          const response = await fetch('/api/shell/script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: scriptPath })
          });

          if (!response.ok) {
            return { output: '', exitCode: 1, error: `exec: cannot execute '${args[0]}'` };
          }

          const data = await response.json();
          return { output: data.output || '', exitCode: data.exitCode || 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `exec: error: ${error}` };
        }
      }
    });

    // touch - Create empty file
    this.registerCommand({
      name: 'touch',
      description: 'Create empty file',
      usage: 'touch <filename>',
      execute: async (_args) => {
        if (_args) {
          return { output: '', exitCode: 1, error: 'touch: missing file operand' };
        }

        try {
          const response = await fetch('/api/files/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: ctx.currentPath,
              name: args[0],
              type: 'file',
              content: ''
            })
          });

          if (!response.ok) {
            return { output: '', exitCode: 1, error: `touch: cannot create '${args[0]}'` };
          }

          return { output: '', exitCode: 0 };
        } catch (error) {
          return { output: '', exitCode: 1, error: `touch: error: ${error}` };
        }
      }
    });

    // version - Show version
    this.registerCommand({
      name: 'version',
      description: 'Show system version',
      usage: 'version',
      execute: async (ctx) => {
        return {
          output: `WebOS version 2.0 (AmigaShell)\nBased on Amiga Workbench 3.1\n${ctx.environment.VERSION}`,
          exitCode: 0
        };
      }
    });
  }

  registerCommand(command: ShellCommand) {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach(alias => {
        this.commands.set(alias, command);
      });
    }
  }

  async execute(commandLine: string): Promise<CommandResult> {
    if (!commandLine.trim()) {
      return { output: '', exitCode: 0 };
    }

    // Add to history
    this.context.history.push(commandLine);

    // Parse command and arguments
    const parts = this.parseCommandLine(commandLine);
    if (parts.length === 0) {
      return { output: '', exitCode: 0 };
    }

    const commandName = parts[0];
    const args = parts.slice(1);

    const command = this.commands.get(commandName);
    if (!command) {
      return {
        output: '',
        exitCode: 127,
        error: `${commandName}: command not found`
      };
    }

    try {
      const result = await command.execute(_args);

      // Update context if path changed
      if (result.newPath) {
        this.context.currentPath = result.newPath;
      }

      return result;
    } catch (error) {
      return {
        output: '',
        exitCode: 1,
        error: `${commandName}: ${error}`
      };
    }
  }

  private parseCommandLine(commandLine: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < commandLine.length; i++) {
      const char = commandLine[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  getContext(): ShellContext {
    return this.context;
  }

  setCurrentPath(path: string) {
    this.context.currentPath = path;
  }

  getHistory(): string[] {
    return [...this.context.history];
  }

  clearHistory() {
    this.context.history = [];
  }

  addProcess(name: string, command: string): ShellProcess {
    const process: ShellProcess = {
      id: this.processIdCounter++,
      name,
      command,
      status: 'running',
      startTime: new Date(),
      output: []
    };
    this.context.processes.push(process);
    return process;
  }

  removeProcess(id: number) {
    const index = this.context.processes.findIndex(p => p.id === id);
    if (index !== -1) {
      this.context.processes.splice(index, 1);
    }
  }

  getProcesses(): ShellProcess[] {
    return [...this.context.processes];
  }
}

export default ShellInterpreter;
