# uintdev web

This is the source code of a TypeScript application behind bundling assets for the website [uint.dev](https://uint.dev/).

Website is hosted using Cloudflare Workers.

## Setup

### CLI

This uses the Bun runtime.

```bash
# Initial setup
bun install

# Serve results under development HTTP server with live reloading
bun run dev

# Static build output to `dist/` directory
bun run build
```

### Web server

For the web server of your choice, point the document root for the virtual host to the `dist/` directory (or its results) that was created from the build process.

## Licensing

The [MIT license](LICENSE) is used for this project. The font is under [OFL](src/assets/sass/fonts/OFL.txt) -- more details can be found [here](https://fonts.google.com/specimen/Nunito).
