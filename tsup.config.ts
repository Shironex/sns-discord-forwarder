import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: {
    resolve: true,
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  minify: true,
  treeshake: true,
  external: ['express', 'axios', 'body-parser', 'chalk', 'crypto', 'dotenv', 'express-rate-limit'],
  noExternal: [],
}); 