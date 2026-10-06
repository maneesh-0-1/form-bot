const { chromium } = require('playwright');
const xlsx = require('xlsx');
const fs = require('fs');
const readline = require('readline');

// 1. Load Excel file
const wb = xlsx.readFile('data_ready.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);
const row = rows[0];

// Put your Typeform URL here:
const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';
const RECIPE_FILE = 'recipe.js';

// Initialize clean recipe file
fs.writeFileSync(RECIPE_FILE, 'module.exports = async function fillForm(page, row) {\n');

function askTerminal(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans.trim()); }));
}

// Global buffer to hold multiple actions per question
let currentActions = [];

async function recordQuestionSteps(page, questionKey) {
  currentActions = [];

  console.log(`\n======================================================`);
  console.log(`👉 STEP: "${questionKey}"`);
  console.log(`   Target Value from Sheet: "${row[questionKey]}"`);
  console.log(`   (Perform ALL necessary clicks / typing in the browser)`);
  console.log(`======================================================`);

  // Wait until user confirms the question is finished
  await askTerminal('Press [ENTER] in this terminal when you have fully completed this question and it has advanced: ');

  if (currentActions.length === 0) {
    console.log(`⚠️ No specific clicks detected, generating fallback text fill...`);
    const fallback = `  // ${questionKey}\n  await page.locator('input:visible, textarea:visible').first().fill(String(row['${questionKey}']));\n  await page.keyboard.press('Enter');\n  await page.waitForTimeout(800);\n\n`;
    fs.appendFileSync(RECIPE_FILE, fallback);
    return;
  }

  // Write all actions performed during this step to recipe.js
  fs.appendFileSync(RECIPE_FILE, `  // Question: ${questionKey}\n`);
  
  for (const act of currentActions) {
    let line = '';
    if (act.type === 'input') {
      if (act.placeholder) {
        line = `  await page.getByPlaceholder('${act.placeholder}').fill(String(row['${questionKey}']));\n  await page.keyboard.press('Enter');\n`;
      } else {
        line = `  await page.locator('${act.tag}:visible').first().fill(String(row['${questionKey}']));\n  await page.keyboard.press('Enter');\n`;
      }
    } else if (act.type === 'click') {
      if (act.aria) {
        line = `  await page.locator('[aria-label="${act.aria}"]').click();\n`;
      } else if (act.text) {
        // If clicking an option matching target value, use variable
        if (act.text.toLowerCase().includes(String(row[questionKey]).toLowerCase())) {
          line = `  await page.getByRole('button', { name: String(row['${questionKey}']) }).click();\n`;
        } else {
          line = `  await page.getByText('${act.text}', { exact: false }).first().click();\n`;
        }
      }
    }
    
    if (line) {
      fs.appendFileSync(RECIPE_FILE, line);
    }
  }

  fs.appendFileSync(RECIPE_FILE, `  await page.waitForTimeout(1000);\n\n`);
  console.log(`💾 Recorded ${currentActions.length} action(s) for "${questionKey}" into ${RECIPE_FILE}`);
}

async function run() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 150 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Bridge browser events to Node
  await page.exposeFunction('onFormInteraction', (action) => {
    currentActions.push(action);
    console.log(`   ↳ [Browser Event] ${action.type.toUpperCase()}: "${action.text || action.placeholder || action.aria || action.tag}"`);
  });

  // Inject listener
  await page.addInitScript(() => {
    window.addEventListener('click', (e) => {
      const target = e.target.closest('button, [role="button"], [role="option"], label, input, textarea, a') || e.target;
      const tag = target.tagName.toLowerCase();
      const aria = target.getAttribute('aria-label');
      const placeholder = target.getAttribute('placeholder');
      const text = target.innerText ? target.innerText.trim().split('\n')[0] : '';

      window.onFormInteraction({
        type: (tag === 'input' || tag === 'textarea') ? 'input' : 'click',
        tag,
        aria,
        placeholder,
        text
      });
    }, true);
  });

  console.log('Navigating to form...');
  await page.goto(FORM_URL);
  await page.waitForTimeout(2000);

  // Auto handle Welcome Screen if present
  const startBtn = page.getByRole('button', { name: /start|press enter/i });
  if (await startBtn.count() > 0 && await startBtn.first().isVisible()) {
    console.log('Welcome screen detected. Clicking Start...');
    await startBtn.first().click();
    fs.appendFileSync(RECIPE_FILE, `  // Welcome Screen\n  await page.getByRole('button', { name: /start|press enter/i }).click();\n  await page.waitForTimeout(1200);\n\n`);
    await page.waitForTimeout(1500);
  }

  const questions = Object.keys(row);
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    await recordQuestionSteps(page, question);
  }

  fs.appendFileSync(RECIPE_FILE, '};\n');
  console.log(`\n🎉 ALL DONE! Your complete multi-step script is ready in ${RECIPE_FILE}.`);
  await page.waitForTimeout(5000);
  await browser.close();
}

run();