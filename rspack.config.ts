import path from "path";
import { fileURLToPath } from "url";
const __dirname: string = path.dirname(fileURLToPath(import.meta.url));
import { rspack, type Configuration, type Compiler } from "@rspack/core";
import { getTemplateData, type TemplateData } from "./src/views/template-data";
import { minify as htmlMinify } from "html-minifier-terser";

const HtmlMinifyPlugin = {
  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(
      "HtmlMinifyPlugin",
      (compilation: any): void => {
        const hooks = rspack.HtmlRspackPlugin.getCompilationHooks(compilation);
        hooks.beforeEmit.tapPromise(
          "HtmlMinifyPlugin",
          async (data: any): Promise<any> => {
            data.html = await htmlMinify(data.html, {
              collapseWhitespace: true,
              removeComments: true,
              removeRedundantAttributes: true,
              removeEmptyAttributes: true,
              removeOptionalTags: true,
              minifyCSS: true,
              minifyJS: true,
            });
            return data;
          },
        );
      },
    );
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
      new rspack.LightningCssMinimizerRspackPlugin(),
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
          },
        },
        include: [path.resolve(__dirname, "src")],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: { minimize: true },
          },
        ],
      },
      {
        test: /\.(png|jpg)$/,
        type: "asset/resource",
      },
      {
        test: /\.(svg|woff|woff2|eot|ttf)$/,
        type: "asset/inline",
      },
      {
        test: /\.s?css$/,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          "css-loader",
          "sass-loader",
        ],
      },
    ],
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: "./src/views/index.ejs",
      filename: "./index.html",
      inject: false,
      templateParameters: (params: Record<string, any>): TemplateData => {
        return { ...params, ...getTemplateData() };
      },
    }),
    new rspack.CssExtractRspackPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
    new rspack.CopyRspackPlugin({
      patterns: [
        { from: "src/assets/data", to: "data/" },
        { from: "src/assets/pages", to: "./" },
      ],
    }),
    HtmlMinifyPlugin,
  ],
};

export default configBuild;
