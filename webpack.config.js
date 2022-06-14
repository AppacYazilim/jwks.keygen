/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = () => {
  let mode = "development";
  if (process.env.NODE_ENV === "production") {
    console.warn("Production mode");
    mode = "production";
  }
  return {
    mode: mode,
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    entry: "./dist/index.js",
    output: {
      path: path.join(__dirname, "dist"),
      publicPath: "/",
      filename: "server.js"
    },
    target: "node",
    node: {
      // Need this when working with express, otherwise the build fails
      __dirname: false,   // if you don't put this is, __dirname
      __filename: false,  // and __filename return blank or /
    },
    optimization: {
      minimize: true,
      mangleExports: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false, // To avoid separate file with licenses.
          terserOptions: {
            mangle: true,
            sourceMap: false,
            keep_classnames: false,
            keep_fnames: false,
            toplevel: true,
          },
        }),
        new UglifyJsPlugin({
          cache: false,
          parallel: true,
          sourceMap: false // set to true if you want JS source maps
        }),
      ]
    },
    externals: [nodeExternals()], // Need this to avoid error when working with Express
    module: {
      rules: [
        {
          // Transpiles ES6-8 into ES5
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader"
          }
        },
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(mode),
      })
    ]
  };
};