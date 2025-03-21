import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  imports: {
    eslintrc: {
      enabled: 9,
    },
  },
  manifest: {
    permissions: ['tabs'],
    description: 'Organize Chrome tabs & windows. Enjoy comfortable browsing & boost productivity.',
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
