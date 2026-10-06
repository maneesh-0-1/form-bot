const { chromium } = require('playwright');
const xlsx = require('xlsx');
const fs = require('fs');

// 1. Load data
const wb = xlsx.readFile('data_ready.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);
const row = rows[0];

const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';
const RECIPE_FILE = 'recipe.js';

// Initialize recipe file
fs.writeFileSync(RECIPE_FILE, 'module.exports = async function fillForm(page, row) {\n');

async function run() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const questions = Object.keys(row);
  let currentIndex = 0;
  let actionBuffer = [];

  // Expose bridge to receive browser clicks & input events
  await page.exposeFunction('onUserAction', (action) => {
    actionBuffer.push(action);
  });

  // Expose bridge for clicking "Section Break" directly from browser HUD
  await page.exposeFunction('onSkipSection', async () => {
    console.log(`⏩ [Section Break] Logged automatically.`);
    const sectionSnippet = `  // [Auto] Section Break / Continue\n  const continueBtn = page.getByRole('button', { name: /continue|next|press enter|ok/i });\n  if (await continueBtn.count() > 0 && await continueBtn.first().isVisible()) {\n    await continueBtn.first().click();\n    await page.waitForTimeout(1000);\n  }\n\n`;
    fs.appendFileSync(RECIPE_FILE, sectionSnippet);

    const btn = page.getByRole('button', { name: /continue|next|press enter|ok/i });
    if (await btn.count() > 0 && await btn.first().isVisible()) {
      await btn.first().click();
    } else {
      await page.keyboard.press('Enter');
    }
  });

  // Inject tracking & on-screen floating control HUD
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      // Create Floating HUD box
      const hud = document.createElement('div');
      hud.id = '__bot_hud';
      hud.style.cssText = `
        position: fixed;
        top: 15px;
        right: 15px;
        z-index: 999999;
        background: #111827;
        color: #ffffff;
        padding: 14px 18px;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
        font-size: 13px;
        max-width: 320px;
        border: 2px solid #3b82f6;
      `;
      hud.innerHTML = `
        <div style="font-weight: bold; color: #60a5fa; margin-bottom: 6px;">🤖 Form Bot Learner</div>
        <div id="__bot_status" style="margin-bottom: 8px;">Waiting to start...</div>
        <button id="__bot_skip_btn" style="
          background: #ef4444; 
          color: white; 
          border: none; 
          padding: 6px 12px; 
          border-radius: 6px; 
          cursor: pointer; 
          font-size: 11px;
          font-weight: bold;
          width: 100%;">
          ⏩ Click if this is a Section Break / Info Screen
        </button>
      `;
      document.body.appendChild(hud);

      document.getElementById('__bot_skip_btn').addEventListener('click', (e) => {
        e.stopPropagation();
        window.onSkipSection();
      });
    });

    // Capture user clicks without breaking native events
    window.addEventListener('click', (e) => {
      if (e.target.closest('#__bot_hud')) return;

      const target = e.target.closest('button, [role="button"], [role="option"], label, input, textarea, a') || e.target;
      const tag = target.tagName.toLowerCase();
      const aria = target.getAttribute('aria-label');
      const placeholder = target.getAttribute('placeholder');
      const text = target.innerText ? target.innerText.trim().split('\n')[0] : '';

      window.onUserAction({
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

  // Handle Welcome screen if present
  const startBtn = page.getByRole('button', { name: /start|press enter/i });
  if (await startBtn.count() > 0 && await startBtn.first().isVisible()) {
    console.log('Detected Welcome Screen. Clicking Start...');
    await startBtn.first().click();
    fs.appendFileSync(RECIPE_FILE, `  // Welcome Screen\n  await page.getByRole('button', { name: /start|press enter/i }).click();\n  await page.waitForTimeout(1000);\n\n`);
    await page.waitForTimeout(1500);
  }

  // Sequentially record questions
  while (currentIndex < questions.length) {
    const questionKey = questions[currentIndex];
    const targetVal = row[questionKey];
    actionBuffer = [];

    console.log(`\n👉 [${currentIndex + 1}/${questions.length}] STEP: "${questionKey}" -> Expected: "${targetVal}"`);

    // Update HUD inside the browser
    await page.evaluate(({ q, val, idx, total }) => {
      const el = document.getElementById('__bot_status');
      if (el) {
        el.innerHTML = `<b>Step ${idx}/${total}:</b><br><span style="color:#facc15">${q}</span><br>Target: <b>${val}</b>`;
      }
    }, { q: questionKey, val: targetVal, idx: currentIndex + 1, total: questions.length });

    // Wait until user performs an action on this question
    while (actionBuffer.length === 0) {
      await page.waitForTimeout(250);
    }

    // Let any chained animation / secondary selection finish
    await page.waitForTimeout(1000);

    // Save recorded steps for this question
    fs.appendFileSync(RECIPE_FILE, `  // Question: ${questionKey}\n`);
    for (const act of actionBuffer) {
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
          if (act.text.toLowerCase().includes(String(targetVal).toLowerCase())) {
            line = `  await page.getByRole('button', { name: String(row['${questionKey}']) }).click();\n`;
          } else {
            line = `  await page.getByText('${act.text}', { exact: false }).first().click();\n`;
          }
        }
      }
      if (line) fs.appendFileSync(RECIPE_FILE, line);
    }

    fs.appendFileSync(RECIPE_FILE, `  await page.waitForTimeout(1000);\n\n`);
    console.log(`💾 Recorded "${questionKey}"`);

    currentIndex++;
    await page.waitForTimeout(800);
  }

  fs.appendFileSync(RECIPE_FILE, '};\n');
  console.log(`\n🎉 ALL 56 QUESTIONS RECORDED SUCCESSFULLY IN ${RECIPE_FILE}!`);
  await page.waitForTimeout(5000);
  await browser.close();
}

run();