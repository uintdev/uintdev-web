import { rspack, type Compilation, type Compiler, type Configuration, type RspackPluginInstance } from "@rspack/core";
import { minify as htmlMinify, type Options as HtmlMinifyOptions } from "html-minifier-terser";
import path from "path";
import { optimize as svgOptimize } from "svgo";
import { fileURLToPath } from "url";
import { getErrorPageTemplateData, getTemplateData } from "./src/views/template-data";

const __dirname: string = path.dirname(fileURLToPath(import.meta.url));
const browserTargets: string[] = ["chrome >= 120", "firefox >= 120", "safari >= 17"];
const htmlMinifyOptions: HtmlMinifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeEmptyAttributes: true,
  removeOptionalTags: true,
  minifyCSS: true,
  minifyJS: true,
};

// Strip editor export metadata from SVGs, then URL-encode rather than base64, as it compresses better
function svgDataUrl(content: Buffer): string {
  const svg: string = svgOptimize(content.toString(), { multipass: true }).data;
  const encoded: string = encodeURIComponent(svg).replace(/[!'()*]/g, (c: string): string => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `data:image/svg+xml,${encoded}`;
}

type HtmlHooks = ReturnType<typeof rspack.HtmlRspackPlugin.getCompilationHooks>;
type HtmlBeforeEmitData = Parameters<Parameters<HtmlHooks["beforeEmit"]["tapPromise"]>[1]>[0];

const HtmlMinifyPlugin: RspackPluginInstance = {
  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap("HtmlMinifyPlugin", (compilation: Compilation): void => {
      const hooks: HtmlHooks = rspack.HtmlRspackPlugin.getCompilationHooks(compilation);
      hooks.beforeEmit.tapPromise("HtmlMinifyPlugin", async (data: HtmlBeforeEmitData): Promise<HtmlBeforeEmitData> => {
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
    filename: "static/[name].[contenthash:8].js",
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
        test: /\.svg$/,
        type: "asset/inline",
        generator: { dataUrl: svgDataUrl },
      },
      {
        test: /\.(woff|woff2|eot|ttf)$/,
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
    new rspack.HtmlRspackPlugin({
      template: "./src/views/404.ejs",
      filename: "./404.html",
      inject: false,
      templateParameters: getErrorPageTemplateData,
    }),
    new rspack.CssExtractRspackPlugin({ filename: "static/[name].[contenthash:8].css" }),
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
