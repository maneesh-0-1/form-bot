const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  // Step 1: Consent
  await page.locator('button:has-text("Yes, I consent")').first().click({ force: true });
  await page.waitForTimeout(600);

  // Step 2: Qualifier
  await page.locator('button:has-text("Yes")').last().click({ force: true });
  await page.waitForTimeout(600);

  // Step 3: Age
  await page.locator('button:has-text("22–25"), button:has-text("22-25")').first().click({ force: true });
  await page.waitForTimeout(600);

  // Step 4: Gender
  await page.locator('button:has-text("Man")').first().click({ force: true });
  await page.waitForTimeout(1000);

  // Now at Step 5: Dump active card HTML
  const cardHTML = await page.evaluate(() => {
    const counter = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]')).find(el => el.innerText.trim() === '5');
    if (!counter) return 'No counter 5 found! Body: ' + document.body.innerText.slice(0, 300);
    const block = counter.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || counter.parentElement.parentElement;
    return block.outerHTML;
  });

  console.log('Step 5 Block HTML:\n', cardHTML);

  await browser.close();
})();
