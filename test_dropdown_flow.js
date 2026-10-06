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

  // Step 5: Click combobox-trigger
  const trigger = page.locator('button[data-qa*="combobox-trigger"], button:has-text("Type or select an option")').first();
  console.log('Trigger visible:', await trigger.isVisible());
  await trigger.click({ force: true });
  await page.waitForTimeout(400);

  // Type Nepal
  await page.keyboard.type('Nepal', { delay: 50 });
  await page.waitForTimeout(400);

  const options = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter(el => el.innerText && el.innerText.toLowerCase().includes('nepal') && el.children.length === 0)
      .map(el => ({ tag: el.tagName, text: el.innerText.trim(), qa: el.getAttribute('data-qa') }));
  });
  console.log('Filtered options:', options);

  // Press Enter or click the text
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);

  const okBtn = page.locator('button[data-qa*="ok-button"]').first();
  if (await okBtn.isVisible()) await okBtn.click();

  await page.waitForTimeout(1000);

  const activeAfter = await page.evaluate(() => {
    const counter = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => el.innerText ? el.innerText.trim() : '')
      .filter(Boolean);
    return counter;
  });
  console.log('Active counters after Step 5:', activeAfter);

  await browser.close();
})();
