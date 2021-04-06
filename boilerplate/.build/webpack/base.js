// SPDX-License-Identifier: MIT
// Copyright (c) 2020 Daimler TSS GmbH

const path = require('path'),
  fs = require('fs'),
  htmlWebpackPlugin = require('html-webpack-plugin'),
  camelCase = require('camelcase'),
  packageJson = require(path.resolve(process.cwd(), 'package.json')),
  webpack = require('webpack'),
  miniCssExtractPlugin = require('mini-css-extract-plugin'),
  copyWebpackPlugin = require('copy-webpack-plugin'),
  duplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin'),
  devMode = process.env.build === 'dev',
  swidgetMode = process.env.swidget === 'true',
  exposedMode = process.env.exposed === 'true',
  devOrSwidgetMode = devMode || swidgetMode,
  packageName = camelCase(packageJson.name.replace(/@/, '-').replace(/\//, '-')),
  version = packageJson.version.toLowerCase().trim(),
  title = packageJson.config.title || packageName;

const base = {
  target: 'web',
  entry: {
    app: process.env.ie ? ['core-js', './src/index.tsx'] : './src/index.tsx',
  },
  output: {
    path: path.resolve(__dirname, '../../dist/app'),
    filename: devMode ? 'swidget.js' : `${packageName}_${version}_[name].js`,
  },
  module: {
    rules: [
      {
        test: /\.(ttf|eot|woff2|woff|svg|otf)/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1025,
              name: 'fonts/[name]-[hash:base64:5].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif)/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 1025,
              name: 'images/[name]-[hash:base64:5].[ext]',
            },
          },
        ],
      },
      // project css files
      {
        test: /\.(css|scss)$/,
        use: [
          {
            loader: devOrSwidgetMode ? 'style-loader' : miniCssExtractPlugin.loader,
          },
          {
            loader: 'css-modules-typescript-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                hashPrefix: 'ftk-' + Date.now(),
                localIdentName: '[name]_[local]_[hash:base64:5]',
              },
              importLoaders: 1,
              sourceMap: true,
              localsConvention: 'camelCase',
            },
          },
          {
            loader: 'postcss-loader',
          },
        ],
        include: [path.resolve(__dirname, path.join('..', '..', 'src'))],
      },
      // node_module css files
      {
        test: /\.(css|scss)$/,
        use: [
          {
            loader: swidgetMode ? 'style-loader' : miniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
          },
        ],
        exclude: [path.resolve(__dirname, path.join('..', '..', 'src'))],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.png', '.svg', '.jpg', '.gif'],
  },
  plugins: [
    new webpack.WatchIgnorePlugin([/css\.d\.ts$/]),
    new webpack.DefinePlugin({
      __CONFIG__: process.env.config ? JSON.stringify(process.env.config) : JSON.stringify('default'),
      __DEV__: devMode,
      'process.env.NODE_ENV': devMode ? JSON.stringify('development') : JSON.stringify('production'),
    }),
  ],
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    dns: 'empty',
  },
};

// copy public files
const pathPublic = path.join(process.cwd(), 'public');
function publicFolderHasFiles() {
  if (fs.existsSync(pathPublic)) {
    try {
      const listFiles = fs.readdirSync(pathPublic);
      for (let i = 0; i < listFiles.length; i += 1) {
        if (listFiles[i] !== 'README.md') {
          return true;
        }
      }
    } catch (_) {}
  }
  return false;
}
if (publicFolderHasFiles()) {
  base.plugins.push(
    new copyWebpackPlugin({
      patterns: [
        {
          from: '**/*',
          context: pathPublic,
          globOptions: { ignore: ['**/README.md'] },
        },
      ],
    }),
  );
}

// only for prod and swidget mode
if (!devMode) {
  base.plugins.push(new webpack.HashedModuleIdsPlugin(), new duplicatePackageCheckerPlugin());
}

// only for dev and prod not for swidget mode
if (!swidgetMode) {
  base.plugins.push(
    new htmlWebpackPlugin({
      prodMode: !devMode,
      inject: devMode,
      lang: 'en',
      title: (devMode ? 'DEV | ' : '') + title,
      template: path.join(__dirname, '..', '..', 'src', 'assets', 'templates', 'default.ejs'),
      appMountId: 'root',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        conservativeCollapse: false,
        minifyCSS: true,
        minifyJS: true,
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'application-name', content: packageName },
        { name: 'application-version', content: version },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, shrink-to-fit=no' },
        { content: 'ie=edge', 'http-equiv': 'x-ua-compatible' },
      ],
      chunksSortMode: function (chunk1, chunk2) {
        var orders = ['polyfill', 'app'];
        var order1 = orders.indexOf(chunk1.names[0]);
        var order2 = orders.indexOf(chunk2.names[0]);
        if (order1 > order2) {
          return 1;
        } else if (order1 < order2) {
          return -1;
        } else {
          return 0;
        }
      },
    }),
    new miniCssExtractPlugin({
      filename: `${packageName}_${version}.css`,
    }),
    //async await support in es6
    new webpack.ProvidePlugin({
      regeneratorRuntime: 'regenerator-runtime/runtime',
    }),
  );
}

if (exposedMode) {
  const { defaultExposedModules, addExposedModules } = require('./exposed.modules');
  const customExposedModules = require('../exposed.modules.custom');
  addExposedModules(base.module.rules, { ...defaultExposedModules, ...customExposedModules });
}

module.exports = base;
