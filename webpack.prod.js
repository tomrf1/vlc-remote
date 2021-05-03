const { merge } = require('webpack-merge');
const { client, server } = require('./webpack.common.js');

module.exports = [
  merge(client, {
    mode: 'production',
  }),
  merge(server, {
    mode: 'production',
  })
];

