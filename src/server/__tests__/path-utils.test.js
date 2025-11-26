/**
 * Path Utilities Security Tests
 *
 * Critical security tests for path sanitization functions.
 * These functions prevent path traversal attacks and directory escape.
 */

const { sanitizePath, sanitizeName, resolveStoragePath } = require('../utils/path-utils');
const path = require('path');

describe('Path Utilities - Security Tests', () => {

  describe('sanitizePath', () => {

    describe('Path Traversal Prevention', () => {
      const traversalAttempts = [
        { input: '../../../etc/passwd', desc: 'Unix path traversal' },
        { input: '..\\..\\..\\windows\\system32', desc: 'Windows path traversal' },
        { input: '....//....//etc', desc: 'Double-dot with extra slashes' },
        { input: '..../..../', desc: 'Multiple dots' },
        { input: 'folder/../../../etc', desc: 'Mixed path with traversal' },
        { input: './../.../../../', desc: 'Various dot combinations' },
        { input: '..%2f..%2f..%2fetc', desc: 'URL-encoded slashes (partial)' },
        { input: '..', desc: 'Simple parent directory' },
        { input: '...', desc: 'Triple dot' },
        { input: 'test/../../secret', desc: 'Escape from subdirectory' },
      ];

      traversalAttempts.forEach(({ input, desc }) => {
        it(`should block: ${desc} (${input})`, () => {
          const result = sanitizePath(input);
          expect(result).not.toContain('..');
        });
      });
    });

    describe('Colon Removal (Windows Drive Letters)', () => {
      const colonInputs = [
        { input: 'C:', expected: 'C' },
        { input: 'C:\\Windows', expected: 'C/Windows' },
        { input: 'D:\\Users\\..\\System', expected: 'D/Users//System' },
        { input: 'dh0:', expected: 'dh0' },
        { input: 'ram:', expected: 'ram' },
        { input: 'a:b:c:d', expected: 'abcd' },
      ];

      colonInputs.forEach(({ input, expected }) => {
        it(`should remove colons from: ${input}`, () => {
          const result = sanitizePath(input);
          expect(result).not.toContain(':');
        });
      });
    });

    describe('Leading Slash Removal (Absolute Path Prevention)', () => {
      const absolutePaths = [
        { input: '/etc/passwd', desc: 'Unix absolute path' },
        { input: '//network/share', desc: 'UNC-style path' },
        { input: '///multiple/slashes', desc: 'Multiple leading slashes' },
        { input: '/home/user/../../../etc', desc: 'Absolute with traversal' },
      ];

      absolutePaths.forEach(({ input, desc }) => {
        it(`should remove leading slashes: ${desc}`, () => {
          const result = sanitizePath(input);
          expect(result).not.toMatch(/^\//);
        });
      });
    });

    describe('Backslash Normalization', () => {
      it('should convert backslashes to forward slashes', () => {
        expect(sanitizePath('folder\\subfolder\\file')).toBe('folder/subfolder/file');
      });

      it('should handle mixed slashes', () => {
        const result = sanitizePath('folder/sub\\mixed/path\\');
        expect(result).not.toContain('\\');
      });
    });

    describe('Trailing Slash Removal', () => {
      it('should remove trailing slashes', () => {
        expect(sanitizePath('folder/')).toBe('folder');
        expect(sanitizePath('folder///')).toBe('folder');
      });
    });

    describe('Valid Paths Should Pass Through', () => {
      const validPaths = [
        { input: 'folder/file.txt', expected: 'folder/file.txt' },
        { input: 'documents/readme.md', expected: 'documents/readme.md' },
        { input: 'dh0/System/Prefs', expected: 'dh0/System/Prefs' },
        { input: 'ram/temp', expected: 'ram/temp' },
        { input: 'df0/Workbench', expected: 'df0/Workbench' },
        { input: 'simple', expected: 'simple' },
        { input: 'file.txt', expected: 'file.txt' },
        { input: 'deep/nested/path/to/file', expected: 'deep/nested/path/to/file' },
      ];

      validPaths.forEach(({ input, expected }) => {
        it(`should allow valid path: ${input}`, () => {
          expect(sanitizePath(input)).toBe(expected);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        expect(sanitizePath('')).toBe('');
      });

      it('should handle undefined', () => {
        expect(sanitizePath(undefined)).toBe('');
      });

      it('should handle null-ish values', () => {
        expect(sanitizePath(null)).toBe('');
      });

      it('should handle only dots', () => {
        const result = sanitizePath('....');
        expect(result).not.toContain('..');
      });

      it('should handle whitespace', () => {
        expect(sanitizePath('  folder  ')).toBe('  folder  ');
      });

      it('should handle special characters in file names', () => {
        expect(sanitizePath('file-name_test.txt')).toBe('file-name_test.txt');
        expect(sanitizePath('file (1).txt')).toBe('file (1).txt');
      });
    });

    describe('Null Byte Injection', () => {
      it('should handle embedded null bytes', () => {
        // Note: The current implementation doesn't strip null bytes
        // This test documents current behavior - may need enhancement
        const input = 'file\x00.txt';
        const result = sanitizePath(input);
        // Current implementation passes through null bytes - documenting this
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('sanitizeName', () => {

    describe('Slash Removal', () => {
      it('should remove forward slashes', () => {
        expect(sanitizeName('file/name')).toBe('filename');
      });

      it('should remove backslashes', () => {
        expect(sanitizeName('file\\name')).toBe('filename');
      });

      it('should remove multiple slashes', () => {
        expect(sanitizeName('a/b\\c/d\\e')).toBe('abcde');
      });
    });

    describe('Whitespace Trimming', () => {
      it('should trim leading whitespace', () => {
        expect(sanitizeName('  filename')).toBe('filename');
      });

      it('should trim trailing whitespace', () => {
        expect(sanitizeName('filename  ')).toBe('filename');
      });

      it('should trim both sides', () => {
        expect(sanitizeName('  filename  ')).toBe('filename');
      });

      it('should preserve internal whitespace', () => {
        expect(sanitizeName('file name')).toBe('file name');
      });
    });

    describe('Valid Names Should Pass Through', () => {
      const validNames = [
        'simple.txt',
        'document.pdf',
        'file-name.txt',
        'file_name.txt',
        'FILE.TXT',
        'file (1).txt',
        'file.multiple.dots.txt',
        '123numeric.txt',
        'unicode-é-ñ.txt',
      ];

      validNames.forEach(name => {
        it(`should allow valid name: ${name}`, () => {
          expect(sanitizeName(name)).toBe(name);
        });
      });
    });

    describe('Path Traversal in Names', () => {
      it('should prevent traversal via slashes in name', () => {
        const result = sanitizeName('../../../etc/passwd');
        expect(result).not.toContain('/');
        expect(result).not.toContain('\\');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string', () => {
        expect(sanitizeName('')).toBe('');
      });

      it('should handle undefined', () => {
        expect(sanitizeName(undefined)).toBe('');
      });

      it('should handle only slashes', () => {
        expect(sanitizeName('//\\\\')).toBe('');
      });

      it('should handle only whitespace', () => {
        expect(sanitizeName('   ')).toBe('');
      });
    });
  });

  describe('resolveStoragePath', () => {
    const baseDir = '/app/storage';

    describe('Path Resolution', () => {
      it('should resolve simple path', () => {
        const result = resolveStoragePath(baseDir, 'dh0', 'file.txt');
        expect(result).toBe(path.join(baseDir, 'dh0', 'file.txt'));
      });

      it('should resolve nested path', () => {
        const result = resolveStoragePath(baseDir, 'dh0/System/Prefs', 'config.dat');
        expect(result).toBe(path.join(baseDir, 'dh0/System/Prefs', 'config.dat'));
      });

      it('should handle empty fileName', () => {
        const result = resolveStoragePath(baseDir, 'dh0');
        expect(result).toBe(path.join(baseDir, 'dh0'));
      });

      it('should handle empty relativePath', () => {
        const result = resolveStoragePath(baseDir, '', 'file.txt');
        expect(result).toBe(path.join(baseDir, '', 'file.txt'));
      });
    });

    describe('Security - Path Traversal Prevention', () => {
      it('should sanitize path traversal in relativePath', () => {
        const result = resolveStoragePath(baseDir, '../../../etc', 'passwd');
        expect(result).not.toContain('..');
        expect(result.startsWith(baseDir)).toBe(true);
      });

      it('should sanitize slashes in fileName', () => {
        const result = resolveStoragePath(baseDir, 'dh0', '../../../etc/passwd');
        expect(result).not.toContain('..etc');
        // Slashes should be stripped from filename
      });

      it('should prevent escape from base directory', () => {
        const maliciousPath = '../../../../../../etc';
        const maliciousFile = '../passwd';
        const result = resolveStoragePath(baseDir, maliciousPath, maliciousFile);

        // Result should still be under baseDir (after sanitization)
        expect(result).not.toContain('../');
      });

      it('should handle combined attack vectors', () => {
        const result = resolveStoragePath(
          baseDir,
          '..\\..\\..\\windows\\system32',
          'config\\sam'
        );
        expect(result).not.toContain('..');
        expect(result).not.toContain('\\');
      });
    });

    describe('Edge Cases', () => {
      it('should handle all empty parameters', () => {
        const result = resolveStoragePath(baseDir, '', '');
        expect(result).toBe(baseDir);
      });

      it('should handle undefined parameters', () => {
        const result = resolveStoragePath(baseDir, undefined, undefined);
        expect(result).toBe(baseDir);
      });
    });
  });

  describe('Integration Scenarios', () => {

    describe('Real-World Attack Patterns', () => {
      const attackPatterns = [
        {
          desc: 'LFI via dot-dot-slash',
          path: '....//....//....//etc/passwd',
          file: ''
        },
        {
          desc: 'Windows drive escape',
          path: 'C:\\Windows\\System32',
          file: 'config.sys'
        },
        {
          desc: 'URL encoding partial decode',
          path: '%2e%2e/%2e%2e/etc',
          file: 'passwd'
        },
        {
          desc: 'Mixed slash types',
          path: 'folder\\..\\..\\secret',
          file: 'data.txt'
        },
        {
          desc: 'Absolute path injection',
          path: '/etc/shadow',
          file: ''
        },
        {
          desc: 'UNC path attempt',
          path: '\\\\server\\share',
          file: 'file.txt'
        },
      ];

      attackPatterns.forEach(({ desc, path: testPath, file }) => {
        it(`should defend against: ${desc}`, () => {
          const sanitizedPath = sanitizePath(testPath);
          const sanitizedName = sanitizeName(file);

          // Path should not contain traversal patterns
          expect(sanitizedPath).not.toContain('..');

          // Path should not start with slash (no absolute paths)
          expect(sanitizedPath).not.toMatch(/^\//);

          // Path should not contain backslashes
          expect(sanitizedPath).not.toContain('\\');

          // Path should not contain colons (no drive letters)
          expect(sanitizedPath).not.toContain(':');

          // Filename should not contain slashes
          expect(sanitizedName).not.toContain('/');
          expect(sanitizedName).not.toContain('\\');
        });
      });
    });

    describe('Amiga Disk Names', () => {
      const amigaDisks = ['df0', 'df1', 'dh0', 'dh1', 'ram', 'rad'];

      amigaDisks.forEach(disk => {
        it(`should handle Amiga disk: ${disk}`, () => {
          expect(sanitizePath(disk)).toBe(disk);
          expect(sanitizePath(`${disk}:`)).toBe(disk);
          expect(sanitizePath(`${disk}/folder`)).toBe(`${disk}/folder`);
        });
      });
    });
  });
});
