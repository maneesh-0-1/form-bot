const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  // Step 1: Consent
  await page.locator('button:has-text("Yes, I consent")').first().click();
  await page.waitForTimeout(600);
  // Step 2: Qualifier
  await page.locator('button:has-text("Yes")').first().click();
  await page.waitForTimeout(600);
  // Step 3: Age
  await page.locator('button:has-text("22–25"), button:has-text("22-25")').first().click();
  await page.waitForTimeout(600);
  // Step 4: Gender
  await page.locator('button:has-text("Man")').first().click();
  await page.waitForTimeout(800);

  // Step 5: Where are you from?
  console.log('At Step 5. Clicking trigger...');
  const trigger = page.locator('button[data-qa*="combobox-trigger"], [role="combobox"]').first();
  await trigger.click();
  await page.waitForTimeout(500);

  console.log('Typing Nepal...');
  await page.keyboard.type('Nepal', { delay: 50 });
  await page.waitForTimeout(600);

  const dump = await page.evaluate(() => {
    const popper = document.querySelector('[data-radix-popper-content-wrapper], [role="listbox"], [data-qa*="dropdown"]');
    const allOptions = Array.from(document.querySelectorAll('[role="option"], [data-radix-collection-item], div[tabindex="-1"], li'));
    return {
      hasPopper: Boolean(popper),
      popperTag: popper?.tagName,
      popperHTML: popper ? popper.outerHTML.slice(0, 1000) : '',
      optionsCount: allOptions.length,
      sampleOptions: allOptions.slice(0, 5).map(o => ({
        tag: o.tagName,
        role: o.getAttribute('role'),
        text: o.innerText.trim(),
        rect: o.getBoundingClientRect()
      }))
    };
  });
  console.log('Dump result:', JSON.stringify(dump, null, 2));

  await browser.close();
})();
