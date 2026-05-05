const path = require("path");

module.exports = {
  entry: {
    getProductsList: "./lib/lambdas/getProductsList.ts",
    getProductById: "./lib/lambdas/getProductById.ts",
    createProduct: "./lib/lambdas/createProduct.ts",
    importFileParser: "./lib/lambdas/importFileParser.ts",
    importProductsFile: "./lib/lambdas/importProductsFile.ts",
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
