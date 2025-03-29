import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pathToExtension = path.join(__dirname, '.output/chrome-mv3');
const userDataDir = path.join(__dirname, 'user-data-dir');

async function globalSetup(config: FullConfig) {
  console.log('globalSetup');
  const { storageState } = config.projects[0].use;
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
  });
  await context.storageState({ path: storageState as string });
  // await context.close(); // close context instead of browser
}

export default globalSetup;
