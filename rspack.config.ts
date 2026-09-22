import { rspack, type Compiler, type Configuration } from "@rspack/core";
import { minify as htmlMinify } from "html-minifier-terser";
import path from "path";
import { fileURLToPath } from "url";
import { getTemplateData } from "./src/views/template-data";

const __dirname: string = path.dirname(fileURLToPath(import.meta.url));
const browserTargets: string[] = ["chrome >= 120", "firefox >= 120", "safari >= 17"];
const htmlMinifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: true,
  removeOptionalTags: true,
  minifyCSS: true,
  minifyJS: true,
};

const HtmlMinifyPlugin = {
  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap("HtmlMinifyPlugin", (compilation: any): void => {
      const hooks = rspack.HtmlRspackPlugin.getCompilationHooks(compilation);
      hooks.beforeEmit.tapPromise("HtmlMinifyPlugin", async (data) => {
        data.html = await htmlMinify(data.html, htmlMinifyOptions);
        return data;
      });
    });
  },
};

const configBuild: Configuration = {
  entry: {
    main: "./src/index.ts",
  },
  resolve: {
    extensions: [".ts"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "[name].js",
    assetModuleFilename: "assets/[name][ext]",
    clean: true,
  },
  mode: "production",
  target: "web",
  optimization: {
    minimize: true,
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin({
        minimizerOptions: { targets: browserTargets },
      }),
    ],
  },
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
              },
            },
            env: {
              targets: browserTargets,
            },
          },
        },
        include: [path.resolve(__dirname, "src")],
      },
      {
        test: /\.(svg|woff|woff2|eot|ttf)$/,
        type: "asset/inline",
      },
      {
        test: /\.s?css$/,
        use: [rspack.CssExtractRspackPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: "./src/views/index.ejs",
      filename: "./index.html",
      inject: false,
      templateParameters: getTemplateData,
    }),
    new rspack.CssExtractRspackPlugin({ filename: "[name].css" }),
    new rspack.CopyRspackPlugin({
      patterns: [
        { from: "src/assets/data", to: "data/", globOptions: { ignore: ["**/.DS_Store"] } },
        { from: "src/assets/pages", to: "./" },
        { from: "src/assets/img/main/favicon.png", to: "assets/" },
      ],
    }),
    HtmlMinifyPlugin,
  ],
};

export default configBuild;
