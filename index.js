const { readFileSync } = require('fs');
const { dirname } = require('path');

function readFile(package, file) {
  const dir = dirname(require.resolve(`${package}/package.json`));
  let data;
  try {
    data = readFileSync(`${dir}/${file}`);
  } catch (err) {
    console.error(err.message);
  }
  return data;
}

const plugins = {
  prism: ['prismjs', 'components/prism-core.min.js'],
  prism_autoloader: ['prismjs', 'plugins/autoloader/prism-autoloader.min.js'],
  prism_autoloader: ['prismjs', 'plugins/line-numbers/prism-line-numbers.min.js'],
  mathjax: ['mathjax', 'es5/tex-mml-chtml.js'],
  katex: ['katex', 'dist/katex.min.css'],
  copy_tex_js: ['katex', 'dist/contrib/copy-tex.min.js'],
  copy_tex_css: ['katex', 'dist/contrib/copy-tex.min.css'],
  jquery: ['jquery', 'dist/jquery.min.js'],
  fancybox: ['@fancyapps/fancybox', 'dist/jquery.fancybox.min.js'],
  fancybox_css: ['@fancyapps/fancybox', 'dist/jquery.fancybox.min.css'],
  mediumzoom: ['medium-zoom', 'dist/medium-zoom.min.js'],
  lazyload: ['lozad', 'dist/lozad.min.js'],
  pangu: ['pangu', 'dist/browser/pangu.min.js'],
  quicklink: ['quicklink', 'dist/quicklink.umd.js'],
  disqusjs_js: ['disqusjs', 'dist/disqus.js'],
  disqusjs_css: ['disqusjs', 'dist/disqusjs.css'],
  valine: ['valine', 'dist/valine.min.js'],
  gitalk_js: ['gitalk', 'dist/gitalk.min.js'],
  gitalk_css: ['gitalk', 'dist/gitalk.css'],
  algolia_search: ['algoliasearch', 'dist/algoliasearch-lite.umd.js'],
  instant_search: ['instantsearch.js', 'dist/instantsearch.production.min.js'],
  mermaid: ['mermaid', 'dist/mermaid.min.js'],
  pace: ['pace-js', 'pace.min.js'],
  pace_css: ['pace-js', 'themes/blue/pace-theme-minimal.css'],
  canvas_ribbon: ['ribbon.js', 'dist/ribbon.min.js']
};

module.exports = function() {
  const vendors = {};
  const generator = [];
  for (const [key, item] of Object.entries(plugins)) {
    const path = 'lib/' + item.join('/');
    let data = readFile(...item);
    if (data) {
      vendors[key] = path;
      generator.push({
        path,
        data
      });
    }
  }
  return {
    vendors,
    generator
  }
}
