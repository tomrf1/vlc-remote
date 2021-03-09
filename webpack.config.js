const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  //client
  {
    mode: 'development',
    entry: './src/client/index.ts',
    devtool: 'inline-source-map',
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html"),
        inject: true
      }),
    ],
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist/client'),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    }
  },
  //server
  {
    mode: 'development',
    entry: './src/server/app.ts',
    target: 'node',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist/server'),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    }
  }
];