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
  await page.waitForTimeout(300);

  // Type Nepal
  await page.keyboard.type('Nepal', { delay: 40 });
  await page.waitForTimeout(300);

  // Dump elements inside radix popper
  const popperHTML = await page.evaluate(() => {
    const popper = document.querySelector('[data-radix-popper-content-wrapper]');
    return popper ? popper.innerHTML : 'No popper found';
  });
  console.log('Popper HTML:\n', popperHTML);

  // Click the option inside popper
  const nepalOption = page.locator('[data-radix-popper-content-wrapper] [role="option"], [data-radix-popper-content-wrapper] div').filter({ hasText: /^Nepal$/i }).first();
  console.log('Nepal option count:', await nepalOption.count());
  if (await nepalOption.count() > 0) {
    await nepalOption.click({ force: true });
    console.log('Clicked Nepal option inside popper!');
  } else {
    // Click any element with text Nepal in popper
    await page.locator('[data-radix-popper-content-wrapper] :text("Nepal")').first().click({ force: true });
    console.log('Clicked text Nepal');
  }

  await page.waitForTimeout(500);

  // Now check if OK button is visible and click it
  const okBtn = page.locator('button[data-qa*="ok-button"]').first();
  if (await okBtn.isVisible()) {
    console.log('Clicking OK button...');
    await okBtn.click({ force: true });
  }

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
