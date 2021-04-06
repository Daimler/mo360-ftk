// SPDX-License-Identifier: MIT
// Copyright (c) 2020 Daimler TSS GmbH

const base = require('./base'),
  merge = require('webpack-merge'),
  path = require('path'),
  faviconsWebpackPlugin = require('favicons-webpack-plugin'),
  terserPlugin = require('terser-webpack-plugin'),
  optimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'),
  packageJson = require(path.resolve(process.cwd(), 'package.json')),
  SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin'),
  sourceMapGeneration =
    process.env.sourceMap === 'true'
      ? 'source-map'
      : process.env.sourceMap === 'false'
      ? false
      : process.env.sourceMap
      ? process.env.sourceMap
      : false;

const prodConfig = {
  name: 'ProdConfig',
  mode: 'production',
  devtool: sourceMapGeneration,
  output: {
    publicPath: packageJson.config.publicPath || '',
  },
  module: {
    rules: [
      {
        test: process.env.ie ? /\.(ts|js)x?$/ : /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(process.cwd(), 'tsconfig.json'),
            },
          },
        ],
        exclude: process.env.ie
          ? [
              path.resolve(process.cwd(), 'stories'),
              path.resolve(process.cwd(), 'test'),
              /node_modules\/(?!(@daimler|react-intl)\/).*/,
            ]
          : [path.resolve(process.cwd(), 'stories'), path.resolve(process.cwd(), 'test')],
      },
    ],
  },
  plugins: [
    new SimpleProgressWebpackPlugin({
      format: process.env.verbose === 'true' ? 'expanded' : 'compact',
    }),
    new faviconsWebpackPlugin({
      logo: packageJson.config.AppIcon,
      prefix: (packageJson.config.publicPath || '') + 'webapp/',
      inject: 'force',
      favicons: {
        start_url: '../',
      },
    }),
  ],
  optimization: {
    minimizer: [
      new terserPlugin({
        extractComments: true,
        cache: true,
        parallel: true,
        sourceMap: true,
        terserOptions: {
          safari10: true,
        },
      }),
      new optimizeCSSAssetsPlugin({}),
    ],
  },
  stats: process.env.verbose === 'true' ? 'normal' : 'errors-only',
};

module.exports = merge(base, prodConfig);
