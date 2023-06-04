const { readFileSync, statSync, readdirSync } = require('fs');
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
      data.push({
        path: join(dist, relative(origin, path)),
        data: readFileSync(path)
      });
    });
  } else if (stats.isFile()) {
    data.push({
      path: dist,
      data: readFileSync(origin)
    });
  }
  return {
    data
  };
}

module.exports = function(hexo, vendors) {
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
};
