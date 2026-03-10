const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require('webpack');

try {
  require("fs").rmSync("./public", { recursive: true });
} catch (e) {}

module.exports = {
  mode: "production",
  cache: {
    type: "filesystem",
    allowCollectingMemory: true,
  },
  devtool: false,
  entry: {
    main: "./src/index.js",
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      name: "shared",
    },
    //minimize: false
  },
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify")
    }
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "[name].bundle.js",
  },
  watchOptions: {
    ignored: [path.resolve(__dirname, "wpstatic/version.json")], //Ignore version file.
  },
  performance: {
    hints: "warning",
    assetFilter: function (assetFilename) {
      //Ignore warnings for media assets which are typically large files.
      return assetFilename.endsWith(".js") || assetFilename.endsWith(".css");
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          {
            loader: "raw-loader",
            options: {
              esModule: false,
            },
          },
        ],
        type: "javascript/auto", // Fix for raw-loader
      },
      {
        test: /\.txt$/i,
        use: [
          {
            loader: "raw-loader",
            options: {
              esModule: false,
            },
          },
        ],
        type: "javascript/auto",
      },
      {
        test: /\.ttf$/i,
        use: [
          {
            loader: "url-loader",
          },
        ],
      },
      {
        test: /\.otf$/i,
        use: [
          {
            loader: "url-loader",
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
          filename: `index.html`,
          template: "./src/base.html",
          chunks: ["main"],
        }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./wpstatic",
          to: ".",
          noErrorOnMissing: true,
        },
      ],
    }),
	new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
};