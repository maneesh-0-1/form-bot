const { chromium } = require('playwright');
const xlsx = require('xlsx');
const fs = require('fs');

// 1. Load data
const wb = xlsx.readFile('data_ready.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

// Put your exact Typeform URL here:
const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';
const LEARNED_FILE = 'learned_steps.js';

// Setup file if it does not exist
if (!fs.existsSync(LEARNED_FILE)) {
  fs.writeFileSync(LEARNED_FILE, '// Captured custom steps\n');
}

// Global variable to store manual clicks
let lastManualClick = null;

// Manual recording helper
async function recordManualAction(page, questionKey) {
  console.log(`\n⚠️  STUCK ON: "${questionKey}"`);
  console.log(`👉 Recording mode active: Click the correct answer/button in the browser now...`);

  lastManualClick = null;

  // Add the click interceptor onto the active page
  await page.evaluate(() => {
    window.addEventListener('click', (e) => {
      const target = e.target.closest('button, [role="button"], [role="option"], label, input, span');
      let text = '';
      if (target) {
        text = target.innerText?.trim() || target.getAttribute('aria-label') || target.value || '';
      } else {
        text = e.target.innerText?.trim() || '';
      }
      window.__notifyPlaywrightClick(text);
    }, { once: true });
  });

  // Wait until you click in the browser
  while (!lastManualClick) {
    await page.waitForTimeout(300);
  }

  const clickedText = lastManualClick.split('\n')[0].trim();
  console.log(`🎯 Captured element: "${clickedText}"`);

  // Write the code snippet into learned_steps.js
  const snippet = `// Question: ${questionKey}\nawait page.getByText('${clickedText}', { exact: false }).first().click();\nawait page.waitForTimeout(800);\n\n`;
  fs.appendFileSync(LEARNED_FILE, snippet);
  console.log(`💾 Saved to ${LEARNED_FILE}!\n`);

  await page.waitForTimeout(1000);
}

async function smartFill(page, label, value) {
  if (!value) return;
  const strVal = String(value).trim();

  try {
    // 1. Button or multiple-choice card matching the answer
    const buttonOption = page.getByRole('button', { name: new RegExp(strVal.split(',')[0].trim(), 'i') });
    if (await buttonOption.count() > 0 && await buttonOption.first().isVisible()) {
      await buttonOption.first().click({ timeout: 2000 });
      return;
    }

    // 2. Visible input or textarea
    const activeInput = page.locator('input:visible, textarea:visible').first();
    if (await activeInput.count() > 0 && await activeInput.isVisible()) {
      await activeInput.fill(strVal, { timeout: 2000 });
      await page.keyboard.press('Enter');
      return;
    }

    // 3. Dropdown combobox
    const dropdown = page.locator('[data-qa*="dropdown"], [role="combobox"]').first();
    if (await dropdown.count() > 0 && await dropdown.isVisible()) {
      await dropdown.click({ timeout: 2000 });
      await page.keyboard.type(strVal);
      await page.keyboard.press('Enter');
      return;
    }

    throw new Error('Element not resolved automatically');
  } catch (err) {
    await recordManualAction(page, label);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Register callback safely ONCE at the start
  await page.exposeFunction('__notifyPlaywrightClick', (text) => {
    lastManualClick = text;
  });

  console.log('Navigating to form...');
  await page.goto(FORM_URL);
  await page.waitForTimeout(2000);

  // Auto-handle the Typeform "Start" / "Press Enter" welcome button if present
  const startBtn = page.getByRole('button', { name: /start|press enter/i });
  if (await startBtn.count() > 0 && await startBtn.first().isVisible()) {
    console.log('Detected Welcome Screen. Clicking Start...');
    await startBtn.first().click();
    await page.waitForTimeout(1500);
  }

  const testRow = rows[0];

  for (const [question, answer] of Object.entries(testRow)) {
    console.log(`Checking question: ${question}`);
    await smartFill(page, question, answer);
    await page.waitForTimeout(800);
  }

  console.log('\n🏁 Test run reached the end! Final submission skipped.');
  await page.waitForTimeout(20000);
  await browser.close();
}

run();