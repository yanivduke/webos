// WebOS Script Runner
// Executes shell scripts and JavaScript scripts

export interface ScriptResult {
  output: string;
  exitCode: number;
  error?: string;
}

export interface ScriptHistoryEntry {
  path: string;
  timestamp: Date;
  exitCode: number;
  duration: number;
}

export interface ScriptProcess {
  id: number;
  name: string;
  command: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startTime: Date;
  output: string[];
  exitCode?: number;
}

class ScriptRunner {
  private history: ScriptHistoryEntry[] = [];
  private maxHistorySize = 20;
  private processes: Map<number, ScriptProcess> = new Map();
  private processIdCounter = 1;

  async runScript(path: string, shellInterpreter?: any): Promise<ScriptResult> {
    const startTime = Date.now();
    const ext = path.split('.').pop()?.toLowerCase();

    try {
      // Read script file
      const response = await fetch('/api/files/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      if (!response.ok) {
        return {
          output: '',
          exitCode: 1,
          error: `Cannot read script file: ${path}`
        };
      }

      const data = await response.json();
      const scriptContent = data.content;

      let result: ScriptResult;

      if (ext === 'sh' || ext === 'bash') {
        // Shell script
        result = await this.runShellScript(scriptContent, shellInterpreter);
      } else if (ext === 'js') {
        // JavaScript script
        result = await this.runJavaScript(scriptContent);
      } else {
        return {
          output: '',
          exitCode: 1,
          error: `Unsupported script type: ${ext}`
        };
      }

      // Add to history
      const duration = Date.now() - startTime;
      this.addToHistory(path, result.exitCode, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addToHistory(path, 1, duration);

      return {
        output: '',
        exitCode: 1,
        error: `Script execution failed: ${error}`
      };
    }
  }

  private async runShellScript(content: string, shellInterpreter?: any): Promise<ScriptResult> {
    if (!shellInterpreter) {
      return {
        output: '',
        exitCode: 1,
        error: 'Shell interpreter not available'
      };
    }

    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    let output = '';
    let lastExitCode = 0;

    for (const line of lines) {
      // Handle basic control flow
      if (line.startsWith('if ') || line.startsWith('for ') || line.startsWith('while ')) {
        output += `Control flow not yet supported: ${line}\n`;
        continue;
      }

      // Variable assignment
      if (line.match(/^\w+=.+$/)) {
        const [varName, varValue] = line.split('=');
        shellInterpreter.getContext().environment[varName.trim()] = varValue.trim();
        continue;
      }

      // Execute command
      const result = await shellInterpreter.execute(line);
      if (result.output) {
        output += result.output + '\n';
      }
      if (result.error) {
        output += result.error + '\n';
      }
      lastExitCode = result.exitCode;

      // Stop on error (unless line ends with ||)
      if (result.exitCode !== 0 && !line.endsWith('||')) {
        break;
      }
    }

    return {
      output: output.trimEnd(),
      exitCode: lastExitCode
    };
  }

  private async runJavaScript(content: string): Promise<ScriptResult> {
    let output = '';
    let exitCode = 0;

    // Create sandboxed context
    const sandbox = {
      console: {
        log: (_args) => {
          output += args.join(' ') + '\n';
        },
        error: (_args) => {
          output += 'ERROR: ' + args.join(' ') + '\n';
        },
        warn: (_args) => {
          output += 'WARN: ' + args.join(' ') + '\n';
        }
      },
      fetch: undefined, // Disable fetch for security
      window: undefined,
      document: undefined,
      eval: undefined,
      Function: undefined,
      // Provide safe utilities
      Math,
      Date,
      JSON,
      String,
      Number,
      Boolean,
      Array,
      Object
    };

    try {
      // Create function with sandbox as context
      const func = new Function(
        ...Object.keys(sandbox),
        `"use strict";\n${content}\nreturn 0;`
      );

      // Execute in sandbox
      const result = func(...Object.values(sandbox));
      exitCode = typeof result === 'number' ? result : 0;
    } catch (error) {
      output += `\nScript error: ${error}\n`;
      exitCode = 1;
    }

    return {
      output: output.trimEnd(),
      exitCode
    };
  }

  async runInBackground(path: string, shellInterpreter?: any): Promise<number> {
    const processId = this.processIdCounter++;
    const fileName = path.split('/').pop() || 'script';

    const process: ScriptProcess = {
      id: processId,
      name: fileName,
      command: path,
      status: 'running',
      startTime: new Date(),
      output: []
    };

    this.processes.set(processId, process);

    // Run script asynchronously
    this.runScript(path, shellInterpreter).then(result => {
      const proc = this.processes.get(processId);
      if (proc) {
        proc.status = result.exitCode === 0 ? 'completed' : 'failed';
        proc.exitCode = result.exitCode;
        proc.output.push(result.output);
      }
    }).catch(error => {
      const proc = this.processes.get(processId);
      if (proc) {
        proc.status = 'failed';
        proc.exitCode = 1;
        proc.output.push(`Error: ${error}`);
      }
    });

    return processId;
  }

  stopScript(id: number): boolean {
    const process = this.processes.get(id);
    if (process && process.status === 'running') {
      process.status = 'stopped';
      return true;
    }
    return false;
  }

  getProcess(id: number): ScriptProcess | undefined {
    return this.processes.get(id);
  }

  getProcesses(): ScriptProcess[] {
    return Array.from(this.processes.values());
  }

  clearProcess(id: number) {
    this.processes.delete(id);
  }

  clearCompletedProcesses() {
    for (const [id, process] of this.processes.entries()) {
      if (process.status === 'completed' || process.status === 'failed' || process.status === 'stopped') {
        this.processes.delete(id);
      }
    }
  }

  getHistory(): ScriptHistoryEntry[] {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
  }

  private addToHistory(path: string, exitCode: number, duration: number) {
    this.history.unshift({
      path,
      timestamp: new Date(),
      exitCode,
      duration
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }

  // Script templates for quick creation
  getTemplates(): Record<string, string> {
    return {
      'hello.sh': `#!/bin/sh
# Simple hello world script
echo "Hello, WebOS!"
date
pwd
ls`,

      'backup.sh': `#!/bin/sh
# Backup script example
echo "Starting backup..."
mkdir backup
cp important.txt backup/
echo "Backup complete!"`,

      'info.sh': `#!/bin/sh
# System information script
echo "=== System Information ==="
date
echo ""
echo "Current directory:"
pwd
echo ""
echo "Disk space:"
df
echo ""
echo "Environment:"
env`,

      'test.js': `// JavaScript test script
console.log("JavaScript in WebOS!");
console.log("Current time: " + new Date().toLocaleString());

// Math calculation
const result = Math.PI * 10;
console.log("PI * 10 = " + result);

// Array operations
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log("Sum of " + numbers.join(", ") + " = " + sum);`,

      'loop.sh': `#!/bin/sh
# Simple loop example
echo "Counting to 5..."
# Note: Full loop support coming soon
echo "1"
echo "2"
echo "3"
echo "4"
echo "5"
echo "Done!"`,

      'search.sh': `#!/bin/sh
# Search for files
echo "Searching for text files..."
find dh0 txt
echo "Search complete!"`
    };
  }

  createTemplateScript(templateName: string, destinationPath: string): Promise<boolean> {
    const templates = this.getTemplates();
    const content = templates[templateName];

    if (!content) {
      return Promise.resolve(false);
    }

    return fetch('/api/files/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: destinationPath,
        name: templateName,
        type: 'file',
        content
      })
    })
      .then(response => response.ok)
      .catch(() => false);
  }
}

export default ScriptRunner;
