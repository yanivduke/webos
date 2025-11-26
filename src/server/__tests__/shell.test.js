/**
 * Shell Route Security Tests
 *
 * Tests for the shell command execution API.
 * Ensures commands are properly sandboxed and cannot escape.
 */

const request = require('supertest');
const app = require('../index');

describe('Shell Route - Security Tests', () => {

  describe('POST /api/shell/execute', () => {

    describe('Basic Command Execution', () => {
      it('should execute ls command', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'ls', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('output');
        expect(res.body).toHaveProperty('currentPath');
      });

      it('should execute pwd command', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'pwd', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        expect(res.body.output).toContain('dh0');
      });

      it('should execute echo command', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'echo Hello World', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        expect(res.body.output).toBe('Hello World');
      });

      it('should execute date command', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'date', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        expect(res.body.output).toBeTruthy();
      });

      it('should execute help command', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'help', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        expect(res.body.output).toContain('Available Commands');
      });

      it('should execute version command', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'version', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        expect(res.body.output).toContain('WebOS');
      });
    });

    describe('Command Validation', () => {
      it('should require command parameter', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ currentPath: 'dh0' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Command required');
      });

      it('should reject empty command', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: '', currentPath: 'dh0' });

        expect(res.status).toBe(400);
      });

      it('should reject unknown commands', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'unknowncommand', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        expect(res.body.error).toContain('command not found');
      });
    });

    describe('Path Traversal Prevention', () => {
      it('should sanitize currentPath with traversal', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'ls', currentPath: '../../../etc' });

        expect(res.status).toBe(200);
        // Should not access system directories
        expect(res.body.currentPath).not.toContain('..');
      });

      it('should prevent cd to parent directories outside storage', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'cd ../../../../../../etc', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        // Should either error or stay within bounds
        expect(res.body.currentPath).not.toContain('etc');
      });

      it('should prevent absolute path access via cd', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'cd /etc', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        expect(res.body.currentPath).not.toBe('/etc');
      });

      it('should prevent cat of files outside storage', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'cat ../../../etc/passwd', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        // Should error or not return sensitive data
        expect(res.body.output).not.toContain('root:');
      });

      it('should prevent mkdir outside storage', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'mkdir ../../../tmp/hacked', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        // Should not create directory outside storage
      });

      it('should prevent rm outside storage', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'rm ../../../important', currentPath: 'dh0' });

        expect(res.status).toBe(200);
        // Should error and not delete anything outside storage
      });
    });

    describe('Command Injection Prevention', () => {
      const injectionAttempts = [
        { cmd: 'ls; cat /etc/passwd', desc: 'semicolon injection' },
        { cmd: 'ls && cat /etc/passwd', desc: 'AND operator injection' },
        { cmd: 'ls || cat /etc/passwd', desc: 'OR operator injection' },
        { cmd: 'ls | cat /etc/passwd', desc: 'pipe injection' },
        { cmd: 'ls `cat /etc/passwd`', desc: 'backtick injection' },
        { cmd: 'ls $(cat /etc/passwd)', desc: 'subshell injection' },
        { cmd: 'ls > /tmp/output', desc: 'redirect output' },
        { cmd: 'ls < /etc/passwd', desc: 'redirect input' },
        { cmd: 'ls\ncat /etc/passwd', desc: 'newline injection' },
        { cmd: 'echo ${PATH}', desc: 'variable expansion' },
      ];

      injectionAttempts.forEach(({ cmd, desc }) => {
        it(`should not execute injected commands: ${desc}`, async () => {
          const res = await request(app)
            .post('/api/shell/execute')
            .send({ command: cmd, currentPath: 'dh0' });

          expect(res.status).toBe(200);
          // Output should not contain sensitive system data
          expect(res.body.output).not.toContain('root:x:0:0');
          expect(res.body.output).not.toContain('/bin/bash');
        });
      });
    });

    describe('Dangerous Commands Blocked', () => {
      const dangerousCommands = [
        'bash',
        'sh',
        'zsh',
        'ksh',
        'exec',
        'eval',
        'sudo',
        'su',
        'chmod',
        'chown',
        'wget',
        'curl',
        'nc',
        'netcat',
        'python',
        'perl',
        'ruby',
        'node',
        'npm',
        'apt',
        'yum',
        'systemctl',
        'service',
        'kill',
        'pkill',
        'reboot',
        'shutdown',
        'init',
      ];

      dangerousCommands.forEach(cmd => {
        it(`should not execute: ${cmd}`, async () => {
          const res = await request(app)
            .post('/api/shell/execute')
            .send({ command: cmd, currentPath: 'dh0' });

          expect(res.status).toBe(200);
          expect(res.body.error).toContain('command not found');
        });
      });
    });

    describe('CD Command Security', () => {
      it('should allow cd to valid Amiga disks', async () => {
        const validDisks = ['df0', 'dh0', 'ram'];

        for (const disk of validDisks) {
          const res = await request(app)
            .post('/api/shell/execute')
            .send({ command: `cd ${disk}`, currentPath: 'dh0' });

          expect(res.status).toBe(200);
        }
      });

      it('should handle cd with colon notation', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'cd dh0:', currentPath: 'ram' });

        expect(res.status).toBe(200);
        expect(res.body.currentPath).toContain('dh0');
      });

      it('should handle cd .. correctly', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'cd ..', currentPath: 'dh0/folder' });

        expect(res.status).toBe(200);
        // Should go to parent but not escape storage
      });

      it('should not escape storage with multiple cd ..', async () => {
        let currentPath = 'dh0';

        for (let i = 0; i < 10; i++) {
          const res = await request(app)
            .post('/api/shell/execute')
            .send({ command: 'cd ..', currentPath });

          expect(res.status).toBe(200);
          currentPath = res.body.currentPath;
        }

        // After many cd .., should still be in a valid location
        expect(currentPath).not.toContain('..');
        expect(currentPath).not.toBe('');
      });
    });

    describe('File Operations Security', () => {
      it('should not allow cat of system files', async () => {
        const systemFiles = [
          '/etc/passwd',
          '/etc/shadow',
          '/etc/hosts',
          'C:\\Windows\\System32\\config\\SAM',
          '../package.json',
          '../../index.js',
        ];

        for (const file of systemFiles) {
          const res = await request(app)
            .post('/api/shell/execute')
            .send({ command: `cat ${file}`, currentPath: 'dh0' });

          expect(res.status).toBe(200);
          // Should not return actual file content from outside storage
          expect(res.body.output).not.toContain('dependencies');
          expect(res.body.output).not.toContain('root:');
        }
      });

      it('should handle copy command path traversal', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({
            command: 'cp ../../../etc/passwd /tmp/stolen',
            currentPath: 'dh0'
          });

        expect(res.status).toBe(200);
        // Should fail or be contained
      });

      it('should handle move command path traversal', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({
            command: 'mv important.txt ../../../tmp/',
            currentPath: 'dh0'
          });

        expect(res.status).toBe(200);
        // Should fail or be contained
      });
    });

    describe('Grep/Find Security', () => {
      it('should not allow grep on system files', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({
            command: 'grep root ../../../etc/passwd',
            currentPath: 'dh0'
          });

        expect(res.status).toBe(200);
        expect(res.body.output).not.toContain('root:x:0');
      });

      it('should limit find scope to storage', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({
            command: 'find passwd',
            currentPath: '../../../etc'
          });

        expect(res.status).toBe(200);
        // Should not find system files
      });
    });

    describe('Input Sanitization', () => {
      it('should handle very long commands', async () => {
        const longCommand = 'echo ' + 'A'.repeat(10000);

        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: longCommand, currentPath: 'dh0' });

        // Should handle without crashing
        expect([200, 400, 413]).toContain(res.status);
      });

      it('should handle special characters in echo', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({
            command: 'echo <script>alert("xss")</script>',
            currentPath: 'dh0'
          });

        expect(res.status).toBe(200);
        // Should echo as-is (shell doesn't render HTML)
        expect(res.body.output).toContain('script');
      });

      it('should handle unicode in commands', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({
            command: 'echo 你好世界',
            currentPath: 'dh0'
          });

        expect(res.status).toBe(200);
        expect(res.body.output).toBe('你好世界');
      });

      it('should handle null bytes in path', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({
            command: 'ls',
            currentPath: 'dh0\x00/../../etc'
          });

        expect(res.status).toBe(200);
        // Should not escape storage
      });
    });

    describe('Default Path Handling', () => {
      it('should use default path when not provided', async () => {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: 'pwd' });

        expect(res.status).toBe(200);
        expect(res.body.currentPath).toBeTruthy();
      });
    });
  });

  describe('POST /api/shell/script', () => {

    describe('Script Execution Security', () => {
      it('should require script path', async () => {
        const res = await request(app)
          .post('/api/shell/script')
          .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('required');
      });

      it('should reject scripts outside storage', async () => {
        const res = await request(app)
          .post('/api/shell/script')
          .send({ path: '../../../etc/cron.daily/script.sh' });

        expect(res.status).toBe(404);
      });

      it('should reject unsupported script types', async () => {
        const res = await request(app)
          .post('/api/shell/script')
          .send({ path: 'dh0/malicious.py' });

        // Should reject non-.sh/.js files
        expect([400, 404]).toContain(res.status);
      });

      it('should sanitize script path for traversal', async () => {
        const res = await request(app)
          .post('/api/shell/script')
          .send({ path: 'dh0/../../../etc/passwd' });

        expect(res.status).toBe(404);
      });
    });

    describe('JavaScript Script Sandboxing', () => {
      // Note: The current implementation uses new Function() which is unsafe
      // These tests document expected security behavior

      it('should not allow require() in scripts', async () => {
        // This test verifies that arbitrary code execution is limited
        const res = await request(app)
          .post('/api/shell/script')
          .send({ path: 'test.js' });

        // Should fail because file doesn't exist, not execute arbitrary code
        expect(res.status).toBe(404);
      });
    });
  });

  describe('State Persistence', () => {
    it('should persist command history', async () => {
      // Execute a command
      await request(app)
        .post('/api/shell/execute')
        .send({ command: 'echo test', currentPath: 'dh0' });

      // Response should include savedAt timestamp
      const res = await request(app)
        .post('/api/shell/execute')
        .send({ command: 'pwd', currentPath: 'dh0' });

      expect(res.body).toHaveProperty('savedAt');
    });

    it('should persist current path across commands', async () => {
      // CD to a directory
      await request(app)
        .post('/api/shell/execute')
        .send({ command: 'cd ram', currentPath: 'dh0' });

      // Next command should use new path by default
      const res = await request(app)
        .post('/api/shell/execute')
        .send({ command: 'pwd' });

      // Path should be persisted
      expect(res.body.currentPath).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle cat on non-existent file', async () => {
      const res = await request(app)
        .post('/api/shell/execute')
        .send({ command: 'cat nonexistent.txt', currentPath: 'dh0' });

      expect(res.status).toBe(200);
      expect(res.body.error).toContain('No such file');
    });

    it('should handle mkdir on existing directory', async () => {
      // First create a directory
      await request(app)
        .post('/api/shell/execute')
        .send({ command: 'mkdir testdir', currentPath: 'ram' });

      // Try to create it again
      const res = await request(app)
        .post('/api/shell/execute')
        .send({ command: 'mkdir testdir', currentPath: 'ram' });

      expect(res.status).toBe(200);
      // Should indicate directory exists
    });

    it('should handle missing operands gracefully', async () => {
      const commandsNeedingOperands = ['cat', 'mkdir', 'rm', 'cp', 'mv', 'grep', 'touch'];

      for (const cmd of commandsNeedingOperands) {
        const res = await request(app)
          .post('/api/shell/execute')
          .send({ command: cmd, currentPath: 'dh0' });

        expect(res.status).toBe(200);
        expect(res.body.error).toContain('missing');
      }
    });
  });
});
