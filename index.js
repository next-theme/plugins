const { readFileSync, statSync, readdirSync } = require('fs');
const { dirname, join } = require('path');

function readFile(name, file) {
  const data = [];
  let base;
  try {
    base = dirname(require.resolve(`${name}/package.json`));
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
    readdirSync(origin).forEach(path => {
      data.push({
        path: join(dist, path),
        data: readFileSync(join(origin, path))
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
  vendors.creativecommons_badges_big = {
    name: '@creativecommons/vocabulary',
    file: 'assets/license_badges/big'
  };
  vendors.creativecommons_badges_small = {
    name: '@creativecommons/vocabulary',
    file: 'assets/license_badges/small'
  };
  for (const value of Object.values(vendors)) {
    const { name, file } = value;
    const { data, error } = readFile(name, file);
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
