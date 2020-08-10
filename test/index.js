const fs = require('fs');
const path = require('path');
const https = require('https');
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
if (diff.length > 0) {
  console.log('The following packages are updated in the Pull Request.');
  console.log(diff.map(item => '- ' + item).join('\n'));
  console.log('\nThe affected CDN links are listed below.');
  main();
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, function(response) {
      resolve(response.statusCode);
    });
    req.on('error', function(error) {
      reject(error.status);
    });
  });
}

async function format(name, links) {
  let content = '';
  for (const [key, value] of Object.entries(links)) {
    const url = 'https:' + value;
    const result = await request(url);
    content += `| ${key} | ${url} | ${result === 200 ? '✅ 200' : '❌ ' + result} |\n`;
  }
  return `
## ${name}

| CDN Provider | CDN Link | Status |
| - | - | - |
${content}`;
}

async function main() {
  for (const [key, value] of Object.entries(dependencies)) {
    const { name, file, alias, unavailable } = value;
    if (!diff.includes(name)) continue;
    const version = newPlugins[name];
    const links = {
      jsdelivr: `//cdn.jsdelivr.net/npm/${name}@${version}/${file}`,
      unpkg   : `//unpkg.com/${name}@${version}/${file}`,
      cdnjs   : `//cdnjs.cloudflare.com/ajax/libs/${alias || name}/${version}/${file.replace(/^(dist|lib|)\/(browser\/|)/, '')}`
    };
    const table = await format(key, links);
    console.log(table);
  }
}
