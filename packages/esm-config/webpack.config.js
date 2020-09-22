const { resolve } = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin;
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  entry: [resolve(__dirname, "src/index.ts")],
  devtool: "sourcemap",
  output: {
    filename: "openmrs-esm-module-config.js",
    path: resolve(__dirname, "dist"),
    libraryTarget: "system",
    jsonpFunction: "webpackJsonp_openmrs_esm_module_config",
  },
  module: {
    rules: [
      {
        parser: {
          system: false,
        },
      },
      {
        test: /\.m?(js|ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: "babel-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".tsx", ".jsx"],
  },
  externals: ["react", "react-dom", "single-spa", /^@openmrs\/esm.*/],
  plugins: [new CleanWebpackPlugin(), new ForkTsCheckerWebpackPlugin()],
  devServer: {
    disableHostCheck: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
};
