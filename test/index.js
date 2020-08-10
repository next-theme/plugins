const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { spawnSync } = require('child_process');
const decache = require('decache');

const vendorsFile = fs.readFileSync(path.join(path.dirname(require.resolve('hexo-theme-next')), '_vendors.yml'));
const dependencies = yaml.safeLoad(vendorsFile);

const newPlugins = require('../package.json').dependencies;
spawnSync('git', ['checkout', 'master']);
decache('../package.json');
const oldPlugins = require('../package.json').dependencies;

const diff = [];
Object.keys(newPlugins).forEach(key => {
  if (!(key in oldPlugins) || newPlugins[key] !== oldPlugins[key]) {
    diff.push(key);
  }
});
if (diff.length === 0) {
  process.exit(0);
}

console.log('The following packages are updated in the Pull Request.');
console.log(diff.map(item => '- ' + item).join('\n'));
console.log('\nThe affected CDN links are listed below.');
for (const [key, value] of Object.entries(dependencies)) {
  const { name, file, alias, unavailable } = value;
  if (!diff.includes(name)) continue;
  const version = newPlugins[name];
  const links = {
    jsdelivr: `//cdn.jsdelivr.net/npm/${name}@${version}/${file}`,
    unpkg   : `//unpkg.com/${name}@${version}/${file}`,
    cdnjs   : `//cdnjs.cloudflare.com/ajax/libs/${alias || name}/${version}/${file.replace(/^(dist|lib|)\/(browser\/|)/, '')}`
  };
  console.log(format(key, links));
}

function format(name, links) {
  const content = Object.entries(links).map(([key, value]) => {
    return `| ${key} | https:${value} |`;
  }).join('\n');
  return `
## ${name}

| CDN Provider | CDN Link |
| - | - |
${content}
`;
}
