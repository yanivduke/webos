const path = require('path');

const sanitizePath = (value = '') => {
  return value
    .replace(/\.\./g, '')
    .replace(/:/g, '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
    .replace(/\/+$/, '');
};

const sanitizeName = (value = '') => {
  return value.replace(/[\\/]/g, '').trim();
};

const resolveStoragePath = (baseDir, relativePath = '', fileName = '') => {
  const safeRelative = sanitizePath(relativePath);
  const safeName = sanitizeName(fileName);
  return path.join(baseDir, safeRelative, safeName);
};

module.exports = {
  sanitizePath,
  sanitizeName,
  resolveStoragePath
};
