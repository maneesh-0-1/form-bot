const { chromium } = require('playwright');
const xlsx = require('xlsx');
const readline = require('readline');

// Load test data
const wb = xlsx.readFile('data_ready.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);
const testRow = rows[0];

const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';

function waitPrompt(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

// Executes an action safely. If it fails, pauses for manual interaction without crashing.
async function safeStep(page, stepName, actionFn) {
  console.log(`\n▶️ Running Step: "${stepName}"`);
  try {
    // Attempt automated action with a 5-second window
    await actionFn();
    await page.waitForTimeout(800);
    console.log(`   ✅ Success`);
  } catch (err) {
    console.log(`   ⚠️ Failed automated execution: ${err.message.split('\n')[0]}`);
    console.log(`   👉 Fix it manually in the browser window now.`);
    await waitPrompt('   👉 Press [ENTER] in this terminal once you have clicked/fixed this step in the browser: ');
    console.log(`   ➡️ Resuming next step...`);
    await page.waitForTimeout(500);
  }
}

async function runStepByStep() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200 
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(5000);

  console.log('Navigating to form...');
  await page.goto(FORM_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  // Auto handle Welcome screen if visible
  await safeStep(page, 'Welcome / Start Screen', async () => {
    const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click({ timeout: 4000 });
    }
  });

  // Loop through every question in the Excel sheet row
  for (const [question, value] of Object.entries(testRow)) {
    const targetValue = String(value || '').trim();

    await safeStep(page, `${question} -> [${targetValue}]`, async () => {
      // 1. Check if a Section Break / Continue screen is active first
      const continueBtn = page.getByRole('button', { name: /continue|press enter/i });
      if (await continueBtn.count() > 0 && await continueBtn.first().isVisible()) {
        await continueBtn.first().click();
        await page.waitForTimeout(1000);
      }

      // 2. Try clicking matching text or button choice
      const buttonChoice = page.getByRole('button', { name: new RegExp(targetValue.split(',')[0].trim(), 'i') });
      if (await buttonChoice.count() > 0 && await buttonChoice.first().isVisible()) {
        await buttonChoice.first().click();
        return;
      }

      const textChoice = page.getByText(targetValue, { exact: false }).first();
      if (await textChoice.count() > 0 && await textChoice.isVisible()) {
        await textChoice.click();
        return;
      }

      // 3. Try visible input / textarea field
      const activeInput = page.locator('input:visible, textarea:visible').first();
      if (await activeInput.count() > 0 && await activeInput.isVisible()) {
        await activeInput.fill(targetValue);
        await page.keyboard.press('Enter');
        return;
      }

      throw new Error(`No automated selector matched "${targetValue}"`);
    });
  }

  console.log('\n======================================================');
  console.log('🎉 Form completed through all 56 steps without crashing!');
  console.log('Final submit skipped. Browser will remain open for 30s.');
  console.log('======================================================');

  await page.waitForTimeout(30000);
  await browser.close();
}

runStepByStep();