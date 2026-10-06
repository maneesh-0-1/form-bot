const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  // Q1
  await page.locator('button:has-text("Yes, I consent")').first().click({ force: true });
  await page.waitForTimeout(600);
  // Q2
  await page.locator('button:has-text("Yes")').first().click({ force: true });
  await page.waitForTimeout(600);
  // Q3
  await page.locator('button:has-text("22–25"), button:has-text("22-25")').first().click({ force: true });
  await page.waitForTimeout(600);
  // Q4
  await page.locator('button:has-text("Man")').first().click({ force: true });
  await page.waitForTimeout(800);

  console.log('--- At Q5 (Country of Origin) ---');
  // Click combobox trigger
  const trigger5 = page.locator('button[data-qa*="combobox-trigger"]:visible, [role="combobox"]:visible, button:has-text("Type or select"):visible').first();
  console.log('Trigger 5 visible:', await trigger5.isVisible());
  await trigger5.click({ force: true });
  await page.waitForTimeout(400);

  // Type Nepal
  await page.keyboard.type('Nepal', { delay: 40 });
  await page.waitForTimeout(500);

  // Check what options are in the DOM
  const opts5 = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="option"], [data-qa*="combobox-item"], li, div[tabindex]'))
      .map(o => ({ text: (o.innerText || '').trim(), role: o.getAttribute('role'), qa: o.getAttribute('data-qa') }))
      .filter(o => o.text.includes('Nepal'));
  });
  console.log('Options found for Nepal:', JSON.stringify(opts5, null, 2));

  // Click Nepal option
  const optNepal = page.locator('[role="option"]:has-text("Nepal"), [data-qa*="combobox-item"]:has-text("Nepal")').first();
  if (await optNepal.isVisible({ timeout: 1000 })) {
    console.log('Clicking Nepal option in listbox...');
    await optNepal.click({ force: true });
  } else {
    console.log('Pressing Enter to select Nepal...');
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(500);

  // Click OK on Q5
  const ok5 = page.locator('button[data-qa*="ok-button"]:visible, button:has-text("OK"):visible').first();
  console.log('OK button on Q5 visible:', await ok5.isVisible());
  if (await ok5.isVisible()) {
    await ok5.click({ force: true });
  } else {
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(1000);

  console.log('--- Checking screen after Q5 ---');
  const screenAfter5 = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('Screen after Q5:\n', screenAfter5);

  // Now Q6 (Current Location)
  console.log('--- At Q6 (Current Location) ---');
  const trigger6 = page.locator('button[data-qa*="combobox-trigger"]:visible, [role="combobox"]:visible, button:has-text("Type or select"):visible').first();
  console.log('Trigger 6 visible:', await trigger6.isVisible());
  await trigger6.click({ force: true });
  await page.waitForTimeout(400);

  await page.keyboard.type('Nepal', { delay: 40 });
  await page.waitForTimeout(500);

  const optNepal6 = page.locator('[role="option"]:has-text("Nepal"), [data-qa*="combobox-item"]:has-text("Nepal")').first();
  if (await optNepal6.isVisible({ timeout: 1000 })) {
    await optNepal6.click({ force: true });
  } else {
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(500);

  const ok6 = page.locator('button[data-qa*="ok-button"]:visible, button:has-text("OK"):visible').first();
  console.log('OK button on Q6 visible:', await ok6.isVisible());
  if (await ok6.isVisible()) {
    await ok6.click({ force: true });
  } else {
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(1000);

  console.log('--- Checking screen after Q6 ---');
  const screenAfter6 = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('Screen after Q6:\n', screenAfter6);

  await browser.close();
})();
