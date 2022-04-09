/* eslint-disable  */
const webpack = require('webpack');
const path = require('path');
const output = require('single-line-log').stdout;

module.exports = {
  target: 'node',
  entry: {
    vm: `./src/project.ts`,
    'vm-browser': `./src/browser/index.ts`,
  },
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].js',
  },
  externals: {
    ws: 'commonjs2 ws',
  },
  mode: "production", /**development */
  plugins: [
    new webpack.ProgressPlugin({
      entries: true,
      modules: true,
      modulesCount: 100,
      profile: true,
      handler: (percentage, message, ...args) => {
        output(`${Math.ceil(percentage * 100)}% ${message}`);
      },
    }),
    new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
  ],
  module: {
    rules: [
      {
        test: /\.ts[x]?$/,
        loader: "ts-loader"
      },
      {
        enforce: "pre",
        test: /\.ts[x]$/,
        loader: "source-map-loader"
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(glsl|grag|vert)$/,
        loader: 'webpack-glsl'
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
};