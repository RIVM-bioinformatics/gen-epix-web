/// <reference types="vitest" />

import { resolve } from 'path';

import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import type { UserConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default {
  plugins: [
    react({ tsDecorators: true }),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    svgr(),
    libInjectCss(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
    viteStaticCopy({
      targets: [
        {
          src: [
            './src/@types/**/*.d.ts',
          ],
          dest: './',
        },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', 'i18next', 'react-i18next'],
    },
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: () => `index.js`,
      formats: ['es'],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: 'tsconfig.json',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 5000,
  },
} satisfies UserConfig;
