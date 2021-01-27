const fs = require('fs');
const path = require('path');
const https = require('https');
const yaml = require('js-yaml');
const { spawnSync } = require('child_process');
const decache = require('decache');
const ssri = require('ssri');

const vendorsFile = fs.readFileSync(path.join(path.dirname(require.resolve('hexo-theme-next')), '_vendors.yml'));
const dependencies = yaml.load(vendorsFile);

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
} else {
  console.log('No packages are updated in the Pull Request.');
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

async function checkIntegrity(url) {
  const fileName = ".tmp";
  const file = fs.createWriteStream(fileName);
  return new Promise((resolve, reject) => {
    const req = https.get(url, function (response) {
      response.pipe(file).on("close", function () {
        ssri.fromStream(fs.createReadStream(fileName), { algorithms: ["sha256"] })
            .then((sri) => { resolve(sri) });
      });
    });
    req.on("error", function (error) {
      fs.unlink(file);
      reject(error.status);
    });
  });
}

async function format(name, links) {
  let content = '';
  for (const [key, value] of Object.entries(links)) {
    const url = 'https:' + value;
    const statusCode = await request(url);
    const integrity = (statusCode === 200) ? await checkIntegrity(url) : '❌';
    content += `| [${key}](${url}) | ${statusCode === 200 ? '✅ 200' : '❌ ' + statusCode} | ${integrity} |\n`;
  }
  return `
## ${name}

| CDN Provider | Status | Integrity |
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
