const path = require("path");

module.exports = {
  entry: {
    getProductsList: "./lib/lambdas/getProductsList/handler.ts",
    getProductById: "./lib/lambdas/getProductById/handler.ts",
    createProduct: "./lib/lambdas/createProduct/handler.ts",
  },
  target: "node",
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "[name]/handler.js",
    path: path.resolve(__dirname, "dist/lambdas"),
    libraryTarget: "commonjs2",
  },
};
