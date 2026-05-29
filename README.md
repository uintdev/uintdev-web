# uintdev web

This is the source code of a JavaScript application behind bundling assets for the website [uint.dev](https://uint.dev/).

This website is hosted using Cloudflare Workers.

## Setup

### CLI

This mainly uses the Bun runtime.
In the case of Cloudflare Workers, it offers a Node compatibility layer that effectively acts like Node.js down to the name.

```bash
bun update
bun run build
```

### Web server

For the web server of your choice, point the document root for the virtual host to the `dist/` directory (or its results) that was created from the build process.

## Licensing

The [MIT license](LICENSE) is used for this project. The font is under [OFL](src/assets/sass/fonts/OFL.txt) -- more details can be found [here](https://fonts.google.com/specimen/Nunito).
