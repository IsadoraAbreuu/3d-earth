import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import restart from 'vite-plugin-restart';

export default defineConfig({
  plugins: [
    glsl(),
    restart({
      restart: ['public/**']
    })
  ],
  server: {
    host: true,
    open: false
  }
});

