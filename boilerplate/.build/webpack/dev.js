// SPDX-License-Identifier: MIT
// Copyright (c) 2020 Daimler TSS GmbH

const base = require('./base'),
  merge = require('webpack-merge'),
  webpack = require('webpack'),
  forkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin'),
  friendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin'),
  path = require('path'),
  packageJson = require(path.resolve(process.cwd(), 'package.json'));

const devServerConfig = {
  hot: true,
  host: packageJson.config.devServer.host
    ? packageJson.config.devServer.host === 'localhost'
      ? '0.0.0.0'
      : packageJson.config.devServer.host
    : 'localhost',
  port: packageJson.config.devServer.port || '8080',
  historyApiFallback: true,
  https: packageJson.config.devServer.https || false,
  stats: process.env.verbose === 'true' ? 'normal' : 'errors-only',
  publicPath: packageJson.config.devServer.publicPath || '/',
  open: packageJson.config.devServer.open || true,
  quiet: true,
};
if (devServerConfig.host === '0.0.0.0') {
  devServerConfig.openPage = `http://localhost:${devServerConfig.port}${devServerConfig.publicPath}`;
}

const devConfig = {
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: process.env.ie ? /\.(ts|js)x?$/ : /\.tsx?$/,
        exclude: process.env.ie && /node_modules\/(?!(@daimler|react-intl)\/).*/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: true,
              plugins: ['react-hot-loader/babel'],
            },
          },
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: path.resolve(process.cwd(), 'tsconfig.dev.json'),
            },
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      'react-dom': '@hot-loader/react-dom',
    },
  },
  plugins: [
    new forkTsCheckerWebpackPlugin({
      tsconfig: path.resolve(process.cwd(), 'tsconfig.dev.json'),
      eslint: true,
      watch: [path.resolve(process.cwd(), 'src')],
    }),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new friendlyErrorsWebpackPlugin(),
  ],
  devServer: devServerConfig,
};

module.exports = merge(base, devConfig);
