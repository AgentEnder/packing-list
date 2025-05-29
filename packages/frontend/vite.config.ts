import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import vike from 'vike/plugin';

export default defineConfig({
  plugins: [tailwindcss(), vike(), react({})],
  build: {
    target: 'es2022',
  },
});
