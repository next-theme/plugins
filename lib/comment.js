const fs = require('fs');
const path = require('path');
const https = require('https');
const yaml = require('js-yaml');
const { spawnSync } = require('child_process');
const ssri = require('ssri');
const { getVendors } = require('hexo-theme-next/scripts/events/lib/utils');

const vendorsFile = fs.readFileSync(
  path.join(path.dirname(require.resolve('hexo-theme-next')), '_vendors.yml')
);
const dependencies = yaml.load(vendorsFile);

const newPlugins = require('../package.json').dependencies;
const oldPlugins = JSON.parse(spawnSync('curl', ['https://raw.githubusercontent.com/next-theme/plugins/main/package.json']).stdout).dependencies;

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
  printCDNTable();
} else {
  console.log('No packages are updated in the Pull Request.');
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, response => {
      resolve(response.statusCode);
    });
    req.on('error', error => {
      reject(error.status);
    });
  });
}

async function checkIntegrity(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, response => {
      ssri.fromStream(response, { algorithms: ['sha256'] })
        .then(resolve);
    });
    req.on('error', error => {
      reject(error.status);
    });
  });
}

async function formatTable(name, links, groundTruth) {
  let content = '';
  for (const [key, url] of Object.entries(links)) {
    if (!['jsdelivr', 'unpkg', 'cdnjs'].includes(key)) continue;
    const statusCode = await request(url);
    const integrity = (statusCode === 200) ? await checkIntegrity(url) : '❌';
    content += `| [${key}](${url}) | ${statusCode === 200 ? '✅ 200' : '❌ ' + statusCode} | ${integrity === groundTruth ? '✅' : '❌'} |\n`;
  }
  console.log(`
## ${name}

| CDN Provider | Status | Integrity |
| - | - | - |
${content}`);
}

async function printCDNTable() {
  for (const [key, value] of Object.entries(dependencies)) {
    const { name, file } = value;
    if (!diff.includes(name) || !file) continue;
    const version = newPlugins[name];
    const links = getVendors({ ...value, version, minified: file });
    const integrity = await ssri
      .fromStream(fs.createReadStream(`./node_modules/${name}/${file}`), { algorithms: ['sha256'] })
      .toString();
    await formatTable(key, links, integrity);
  }
}
