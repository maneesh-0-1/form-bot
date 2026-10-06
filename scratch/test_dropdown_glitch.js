const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
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

  console.log('=== AT Q5 (Dropdown) ===');
  // Inspect Q5 trigger
  const trig = page.locator('button[data-qa*="combobox-trigger"], [role="combobox"]').first();
  await trig.click();
  await page.waitForTimeout(400);

  // Inspect poppers or listboxes
  let openPoppers = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"], [data-state="open"]'))
      .map(el => ({ tag: el.tagName, role: el.getAttribute('role'), qa: el.getAttribute('data-qa'), text: el.innerText.slice(0, 50) }));
  });
  console.log('Open poppers after trigger click:', openPoppers);

  await page.keyboard.type('Nepal', { delay: 50 });
  await page.waitForTimeout(400);

  // Click nepal
  const nepalOpt = page.locator('[role="option"]:has-text("Nepal")').first();
  console.log('Nepal option found:', await nepalOpt.count());
  await nepalOpt.click();
  await page.waitForTimeout(400);

  let popperAfterOptClick = await page.evaluate(() => {
    const p = document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"]');
    return Array.from(p).map(el => ({
      visible: el.getBoundingClientRect().height > 0,
      rect: el.getBoundingClientRect(),
      text: el.innerText.slice(0, 50)
    }));
  });
  console.log('Poppers after selecting option:', popperAfterOptClick);

  // Click OK on Q5
  const ok5 = page.locator('button[data-qa*="ok-button"]').first();
  await ok5.click();
  await page.waitForTimeout(800);

  console.log('=== AT Q6 (Dropdown 2) ===');
  const trig6 = page.locator('button[data-qa*="combobox-trigger"], [role="combobox"]').first();
  await trig6.click();
  await page.waitForTimeout(400);
  await page.keyboard.type('Nepal', { delay: 50 });
  await page.waitForTimeout(400);
  const nepalOpt6 = page.locator('[role="option"]:has-text("Nepal")').first();
  await nepalOpt6.click();
  await page.waitForTimeout(400);

  // What happens in autonomous_runner.js:
  // It pressed ArrowDown and Enter!
  // Let's see what happens if we simulate that:
  console.log('Simulating autonomous_runner previous logic (ArrowDown + Enter):');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  const ok6 = page.locator('button[data-qa*="ok-button"]').first();
  if (await ok6.isVisible()) await ok6.click();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);

  console.log('=== AT Q7 (Button choose) ===');
  let poppersAtQ7 = await page.evaluate(() => {
    const p = document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"], [data-state="open"]');
    return Array.from(p).map(el => ({
      qa: el.getAttribute('data-qa'),
      rect: el.getBoundingClientRect(),
      text: el.innerText.slice(0, 100)
    })).filter(x => x.rect.height > 0);
  });
  console.log('Poppers still visible at Q7:', JSON.stringify(poppersAtQ7, null, 2));

  await browser.close();
})();
