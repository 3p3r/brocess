import fs from "fs";
import path from "path";
import chalk from "chalk";
import webpack from "webpack";
import download from "download";
import { execSync } from "child_process";
import HtmlWebpackPlugin from "html-webpack-plugin";
import ShellPlugin from "webpack-shell-plugin-next";

const isProduction = process.env.NODE_ENV == "production";
const arch = process.env.ARCH || "amd64"; // can be arm64
const version = process.env.VERSION || "v0.6.3"; // https://github.com/ktock/container2wasm/releases
const url = `https://github.com/ktock/container2wasm/releases/download/${version}/container2wasm-${version}-linux-${arch}.tar.gz`;
const container = "debian:bookworm-slim";

const config: webpack.Configuration = {
  entry: "./src/index.ts",
  output: {
    clean: true,
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    open: true,
    host: "localhost",
  },
  bail: isProduction,
  plugins: [
    new HtmlWebpackPlugin(),
    new ShellPlugin({
      safe: true,
      onBeforeBuild: {
        blocking: true,
        parallel: false,
        scripts: [
          async () => {
            if (fs.existsSync("bin/c2w")) return;
            console.log(chalk.bgYellowBright(`Downloading ${url}`));
            await fs.promises.mkdir("bin", { recursive: true });
            await download(url, "bin", { extract: true });
          },
          () => {
            if (fs.existsSync("bin/brocess.wasm")) return;
            console.log(chalk.bgYellowBright(`Generating brocess.wasm from ${container}`));
            execSync("./bin/c2w --version");
            execSync(`./bin/c2w ${container} bin/brocess.wasm`);
          },
        ],
      },
    }),
  ],
  experiments: {
    futureDefaults: true,
    syncWebAssembly: true,
    asyncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
        options: {
          transpileOnly: true,
        },
      },
      {
        test: /\.wasm$/i,
        type: "webassembly/async",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },
  externals: {
    wasi_snapshot_preview1: "WASI",
  },
  performance: {
    hints: false,
  },
};

module.exports = () => ({
  mode: isProduction ? "production" : "development",
  ...config,
});
