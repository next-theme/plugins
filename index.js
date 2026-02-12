const { readFileSync, statSync, readdirSync } = require('fs');
const crypto = require('crypto');
const { join, relative } = require('path');

function walk(dir, callback) {
  readdirSync(dir).forEach(file => {
    const filepath = join(dir, file);
    const stats = statSync(filepath);
    if (stats.isDirectory()) {
      walk(filepath, callback);
    } else if (stats.isFile()) {
      callback(filepath);
    }
  });
}

function calculateIntegrity(data) {
  // Calculate SHA-256 hash and return in base64 format (SRI format)
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return 'sha256-' + hash.digest('base64');
}

// Store integrity hashes for files we process
// This will be exported so the theme can access it
const localIntegrityMap = {};

function readFile(plugin_dir, value) {
  let { name, file, dir } = value;
  if (!file) file = dir;
  const data = [];
  const base = `${plugin_dir}/${name}`;
  try {
    statSync(base);
  } catch (err) {
    return {
      error: err.message
    };
  }
  const origin = `${base}/${file}`;
  const dist = `lib/${name}/${file}`;
  let stats;
  try {
    stats = statSync(origin);
  } catch (err) {
    return {
      error: err.message
    };
  }
  if (stats.isDirectory()) {
    walk(origin, path => {
      const fileData = readFileSync(path);
      const dist_path = join(dist, relative(origin, path));
      data.push({
        path: dist_path,
        data: fileData
      });
      localIntegrityMap[dist_path] = calculateIntegrity(fileData);
    });
  } else if (stats.isFile()) {
    const fileData = readFileSync(origin);
    data.push({
      path: dist,
      data: fileData
    });
    localIntegrityMap[dist] = calculateIntegrity(fileData);
  }
  return {
    data
  };
}

function pluginMain(hexo, vendors) {
  let generator = [];
  let errors = [];
  vendors.fontawesome_font = {
    name: '@fortawesome/fontawesome-free',
    file: 'webfonts'
  };
  vendors.katex_font = {
    name: 'katex',
    file: 'dist/fonts'
  };
  vendors.mathjax_font = {
    name: 'mathjax',
    file: 'es5/output/chtml/fonts'
  };
  for (const value of Object.values(vendors)) {
    const { data, error } = readFile(hexo.plugin_dir, value);
    if (data) generator = generator.concat(data);
    if (error) errors.push(error);
  }
  if (errors.length) {
    errors = [...new Set(errors)];
    hexo.log.warn('The following packages are not found by `@next-theme/plugins`.');
    errors.forEach(error => {
      hexo.log.warn(error);
    });
    hexo.log.warn('Maybe you can find the solution here: https://github.com/next-theme/plugins#debug');
  }
  hexo.extend.generator.register('next_vendors', () => generator);

  // Register a helper to access local integrity hashes
  hexo.extend.helper.register('next_vendor_integrity', function(path) {
    // Normalize path to match our map keys
    const normalizedPath = path.replace(/^\//, '');
    return localIntegrityMap[normalizedPath];
  });

  // Log integrity hashes for debugging
  hexo.log.info('[next-theme/plugins] Calculated integrity hashes for local files');
  if (Object.keys(localIntegrityMap).length > 0) {
    hexo.log.debug(`  Total files with integrity hashes: ${Object.keys(localIntegrityMap).length}`);
  }
}

// Export both the main function and a method to get integrity hashes
module.exports = pluginMain;
module.exports.getLocalIntegrity = function(path) {
  const normalizedPath = path.replace(/^\//, '');
  return localIntegrityMap[normalizedPath];
};
