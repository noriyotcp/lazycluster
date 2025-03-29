import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'html',
  globalSetup: fileURLToPath(new URL('./global-setup', import.meta.url)), // globalSetup を指定
  projects: [
    // projects を追加
    // { // extension-setup は削除
    //   name: 'extension-setup', // setup project を定義
    //   testMatch: /global\.setup\.ts/, // global.setup.ts を testMatch に指定
    // },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        channel: 'chromium',
        launchOptions: {
          args: [],
        },
        storageState: 'storageState.json', // storageState を use に追加
      },
      // dependencies: ['extension-setup'], // dependencies は削除
    },
  ],
});
