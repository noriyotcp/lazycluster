// global-setup.ts
import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pathToExtension = path.join(__dirname, '.output/chrome-mv3');
const userDataDir = path.join(__dirname, 'user-data-dir'); // userDataDir を定義

async function globalSetup(config: FullConfig) {
  console.log('globalSetup');
  const { storageState } = config.projects[0].use; // config を使う
  const context = await chromium.launchPersistentContext(userDataDir, {
    // userDataDir を渡す
    headless: false,
    // permissions: ['storage', activeTab', scripting'], // ここで permissions を指定するのは間違い
    args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
  });
  // const context: BrowserContext = await browser.newContext({ // newContext は不要
  //   permissions: ['storage', activeTab', scripting'],
  //   baseURL: baseURL,
  //   storageState: storageState as string,
  // });
  // Save the storage state somewhere useful such as disk.
  await context.storageState({ path: storageState as string }); // config.storageState を使う
  await context.close(); // browser ではなく context を close する
}

export default globalSetup;
