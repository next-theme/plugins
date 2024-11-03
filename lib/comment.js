const fs = require('fs');
const path = require('path');
const https = require('https');
const yaml = require('js-yaml');
const { spawnSync } = require('child_process');
const ssri = require('ssri');
const { getVendors } = require('hexo-theme-next/scripts/events/lib/utils');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('diff', {
    describe: 'Enable diff mode',
    type: 'boolean',
    default: false
  })
  .argv;

const vendorsFile = fs.readFileSync(
  path.join(path.dirname(require.resolve('hexo-theme-next')), '_vendors.yml')
);
const dependencies = yaml.load(vendorsFile);

const newPlugins = require('../package.json').dependencies;

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
        .then(integrity => integrity.toString())
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
    let integrityMatch;
    if (statusCode === 200) {
      const integrity = await checkIntegrity(url);
      integrityMatch = integrity === groundTruth ? '✅' : '❌';
    } else {
      integrityMatch = '❌';
    }
    content += `| [${key}](${url}) | ${statusCode === 200 ? '✅' : '❌'} ${statusCode} | ${integrityMatch} |\n`;
  }
  console.log(`
## ${name}

| CDN Provider | Status | Integrity |
| - | - | - |
${content}`);
}

async function printCDNTable(names) {
  for (const [key, value] of Object.entries(dependencies)) {
    const { name, file } = value;
    if (!names.includes(name) || !file) continue;
    const version = newPlugins[name];
    const links = getVendors({ ...value, version, minified: file });
    const path = `./node_modules/${name}/${file}`;
    const fileExists = fs.existsSync(path);
    if (!fileExists) {
      console.log(`
## ${name}

The file \`${file}\` does not exist.`);
      continue;
    }
    const integrity = await ssri
      .fromStream(fs.createReadStream(path), { algorithms: ['sha256'] });
    await formatTable(key, links, integrity.toString());
  }
}

async function printDiff() {
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
    printCDNTable(diff);
  } else {
    console.log('No packages are updated in the Pull Request.');
  }
}

async function printAll() {
  const names = Object.keys(dependencies).map(key => dependencies[key].name);
  printCDNTable(names);
}

if (argv.diff) {
  printDiff();
} else {
  printAll();
}
