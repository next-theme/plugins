# NexT Plugins

[![Npm Version](https://img.shields.io/npm/v/@next-theme/plugins?style=for-the-badge)](https://npmjs.org/package/@next-theme/plugins)
[![Npm Downloads Month](https://img.shields.io/npm/dm/@next-theme/plugins?style=for-the-badge)](https://npmjs.org/package/@next-theme/plugins)
[![Npm Downloads Total](https://img.shields.io/npm/dt/@next-theme/plugins?style=for-the-badge)](https://npmjs.org/package/@next-theme/plugins)
[![License](https://img.shields.io/npm/l/@next-theme/plugins?style=for-the-badge)](https://npmjs.org/package/@next-theme/plugins)

This plugin provides the code for all optional third-party frontend libraries used by NexT. By default, NexT loads these libraries via CDN. However, in some cases, these CDNs may be unavailable (e.g., when the site is deployed in an intranet environment without internet access). In such situations, by installing this plugin and configuring the theme accordingly, Hexo can bundle the library code into the generated blog files, enabling offline deployment.

## Installation

```bash
npm install @next-theme/plugins
```

## Debug

First execute the following command in Hexo site root directory to ensure that the plugin is installed correctly.

```bash
npm install
```

If the warning persists, then the solution depends on how you installed NexT.

1. Installed NexT through npm:
    Make sure the version numbers of `@next-theme/plugins` and `hexo-theme-next` are the same.

1. Installed NexT through git:
    1. If you are using the latest master branch: **Ignore this warning**.
    1. If you are using the latest release version:
        Make sure the version numbers of `@next-theme/plugins` and `hexo-theme-next` are the same.

Feel free to raise new issues you find in this plugin.
