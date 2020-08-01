const { readFileSync, statSync, readdirSync } = require('fs');
const { dirname, join } = require('path');

function readFile(name, file) {
  const data = [];
  let base;
  try {
    base = dirname(require.resolve(`${name}/package.json`));
  } catch (err) {
    console.error(err.message);
    return data;
  }
  const origin = `${base}/${file}`;
  const dist = `lib/${name}/${file}`;
  let stats;
  try {
    stats = statSync(origin);
  } catch (err) {
    console.error(err.message);
    return data;
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
  return data;
}

module.exports = function(hexo, vendors) {
  let generator = [];
  vendors.fontawesome_font = {
    name: '@fortawesome/fontawesome-free',
    file: 'webfont'
  };
  for (const value of Object.values(vendors)) {
    const { name, file } = value;
    const data = readFile(name, file);
    if (data.length) {
      generator = generator.concat(data);
    }
  }
  hexo.extend.generator.register('next_vendors', () => generator);
};
