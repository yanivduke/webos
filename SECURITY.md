# Security Policy

## Supported Versions

WebOS is currently in active development. Security updates will be applied to the main branch and latest releases.

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of WebOS seriously. If you discover a security vulnerability, please follow these steps:

### For Security Issues

**DO NOT** open a public issue for security vulnerabilities.

Instead, please report security vulnerabilities by:

1. **Email**: Contact the maintainers directly (check GitHub profiles for contact info)
2. **GitHub Security Advisories**: Use GitHub's private vulnerability reporting feature at:
   `https://github.com/yanivduke/webos/security/advisories/new`

### What to Include

When reporting a vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: What could an attacker accomplish?
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Affected Components**: Client, server, or both?
- **Suggested Fix**: If you have ideas on how to fix it
- **Your Contact Info**: So we can follow up with questions

### What to Expect

- **Acknowledgment**: We'll acknowledge your report within 48 hours
- **Updates**: We'll keep you informed of our progress
- **Credit**: We'll credit you in the security advisory (unless you prefer to remain anonymous)
- **Timeline**: We aim to address critical vulnerabilities within 7 days

## Security Best Practices

When contributing to WebOS, please follow these security guidelines:

### Authentication & Authorization

- Never commit API keys, passwords, or secrets to the repository
- Protect all REST endpoints with authentication in production deployments
- Implement proper session management for multi-user scenarios

### Input Validation

- Always use `sanitizePath()` and `sanitizeName()` utilities for file operations (see `src/server/utils/path-utils.js`)
- Validate and sanitize all user inputs on the server side
- Never trust client-side validation alone
- Prevent path traversal attacks (e.g., `../../etc/passwd`)

### File Operations

- Restrict file operations to designated directories (e.g., `src/server/storage/`)
- Validate file types before processing uploads
- Set appropriate file permissions
- Implement file size limits to prevent DoS

### API Security

- Use HTTPS/TLS in production (terminate at reverse proxy)
- Implement rate limiting to prevent abuse
- Return appropriate HTTP status codes (avoid information leakage)
- Sanitize error messages (don't expose internal paths or stack traces)

### Dependencies

- Regularly run `npm audit` to check for vulnerable dependencies
- Keep dependencies up to date
- Review dependency licenses for compatibility

### WebAssembly Security

- AWML applications run in a sandboxed environment
- Validate AWML manifest permissions before execution
- Limit filesystem access to allowed paths only
- Never execute untrusted WASM binaries without user consent

### Client-Side Security

- Implement Content Security Policy (CSP) headers
- Sanitize user-generated content to prevent XSS
- Validate file uploads on both client and server
- Use CORS appropriately (avoid `Access-Control-Allow-Origin: *` in production)

## Common Vulnerabilities to Avoid

### Path Traversal

```javascript
// BAD - Vulnerable to path traversal
app.get('/files', (req, res) => {
  const filePath = path.join('/storage/', req.query.path);
  res.sendFile(filePath);
});

// GOOD - Uses sanitization
app.get('/files', (req, res) => {
  const safePath = sanitizePath(req.query.path);
  const filePath = path.join('/storage/', safePath);
  res.sendFile(filePath);
});
```

### Command Injection

```javascript
// BAD - Vulnerable to command injection
app.post('/shell', (req, res) => {
  exec(req.body.command, (error, stdout) => {
    res.json({ output: stdout });
  });
});

// GOOD - Whitelist allowed commands
const ALLOWED_COMMANDS = ['ls', 'pwd', 'cat', 'cd', 'mkdir'];
app.post('/shell', (req, res) => {
  const command = req.body.command.split(' ')[0];
  if (!ALLOWED_COMMANDS.includes(command)) {
    return res.status(403).json({ error: 'Command not allowed' });
  }
  // Execute with additional sanitization
});
```

### XSS Prevention

```javascript
// BAD - Renders unsanitized HTML
<div v-html="userContent"></div>

// GOOD - Use text interpolation
<div>{{ userContent }}</div>

// GOOD - Or use a sanitization library
<div v-html="sanitizeHtml(userContent)"></div>
```

## Security Checklist for Contributors

Before submitting a PR with security implications:

- [ ] All user inputs are validated and sanitized
- [ ] File operations use path sanitization utilities
- [ ] No secrets or credentials in code
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up to date (`npm audit` passes)
- [ ] Authentication is required for sensitive operations
- [ ] CORS is configured appropriately
- [ ] Rate limiting is considered for API endpoints

## Deployment Security

When deploying WebOS to production:

1. **HTTPS Only**: Use TLS/SSL certificates (Let's Encrypt is free)
2. **Environment Variables**: Store secrets in environment variables, not code
3. **Reverse Proxy**: Use nginx/Apache to terminate SSL and add security headers
4. **Firewall**: Restrict access to only necessary ports
5. **Monitoring**: Enable logging and monitor for suspicious activity
6. **Backups**: Regular backups of user data and application state
7. **Updates**: Keep Node.js and all dependencies updated

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Vue.js Security Best Practices](https://vuejs.org/guide/best-practices/security.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## Thank You

We appreciate responsible disclosure and the security research community's efforts to keep WebOS safe for everyone. Your contributions help protect all users and make this project better.
