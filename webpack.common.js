const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const client =
  {
    entry: './src/client/index.ts',
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
          test: /\.(ts|tsx)?$/,
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
  };
const server = 
  {
    entry: './src/server/app.ts',
    target: 'node',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist/server'),
      library: {
        type: 'commonjs2'
      }
    },
    externals: {
      'bufferutil': 'commonjs bufferutil',
      'utf-8-validate': 'commonjs utf-8-validate'
    },
    externalsPresets: {
      node: true
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
    },
    ignoreWarnings: [
      {
        module: /node_modules\/bufferutil/,
      },
      {
        module: /node_modules\/utf-8-validate/,
      },
    ]
  };

  module.exports = {
    client: client,
    server: server,
  }
  