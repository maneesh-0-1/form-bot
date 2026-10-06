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

  // Step 5: Country Dropdown
  async function selectDropdown(target) {
    const trigger = page.locator('button[data-qa*="combobox-trigger"], [role="combobox"], [data-qa*="dropdown"], button:has-text("Type or select")').first();
    console.log('Trigger visible:', await trigger.isVisible());
    await trigger.click({ force: true });
    await page.waitForTimeout(300);

    // Type query
    console.log('Typing query:', target);
    await page.keyboard.type(target, { delay: 40 });
    await page.waitForTimeout(400);

    const clicked = await page.evaluate((val) => {
      const options = Array.from(document.querySelectorAll('li[role="option"], li[data-qa*="combobox-item"], [role="option"], li, span'));
      const match = options.find(el => {
        const text = (el.innerText || el.textContent || '').trim();
        return text === val || text.toLowerCase() === val.toLowerCase();
      });
      if (match) {
        match.click();
        return match.innerText || match.textContent;
      }
      return null;
    }, target);

    console.log('Clicked option:', clicked);
    await page.waitForTimeout(300);

    // Click OK
    const ok = page.locator('button[data-qa*="ok-button"], button:has-text("OK")').first();
    if (await ok.isVisible({ timeout: 500 })) {
      console.log('Clicking OK button');
      await ok.click({ force: true });
    }
  }

  await selectDropdown('Nepal');
  await page.waitForTimeout(800);

  console.log('Now at Step 6...');
  await selectDropdown('Nepal');
  await page.waitForTimeout(800);

  console.log('Now at Step 7...');
  // Step 7: Employment / Student Status ("Full-time student")
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, label'));
    const match = btns.find(b => b.innerText && b.innerText.includes('Full-time student'));
    if (match) match.click();
  });
  await page.waitForTimeout(400);
  const ok7 = page.locator('button[data-qa*="ok-button"], button:has-text("OK")').first();
  if (await ok7.isVisible({ timeout: 500 })) await ok7.click({ force: true });
  await page.waitForTimeout(800);

  console.log('Now at Step 8...');
  const step8Text = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('Step 8 text:\n', step8Text);

  await browser.close();
})();
