const { merge } = require('webpack-merge');
const { client, server } = require('./webpack.common.js');

module.exports = [
  merge(client, {
    mode: 'development',
    devtool: 'inline-source-map',
  }),
  merge(server, {
    mode: 'development',
  })
];
