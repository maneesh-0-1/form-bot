const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(1000);

  // Step 1: Click Yes, I consent
  const btn1 = page.locator('button:visible:has-text("Yes, I consent")').first();
  console.log('Step 1 button visible:', await btn1.isVisible());
  await btn1.click({ force: true });
  await page.waitForTimeout(1000);

  // Step 2: Check visible buttons
  const visibleButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="radio"], [role="button"], [role="option"]'))
      .map(b => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.innerText ? b.innerText.trim().replace(/\s+/g, ' ') : '',
          role: b.getAttribute('role'),
          top: Math.round(rect.top),
          height: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top < window.innerHeight
        };
      })
      .filter(b => b.visible);
  });
  console.log('Visible buttons on Step 2:', visibleButtons);

  // Click "Yes" on Step 2
  // We want to match text "Yes" (or "Y Yes"), not substring of another thing
  const yesBtn = page.locator('button:visible, [role="radio"]:visible').filter({ hasText: /^([A-Z]\s+)?Yes$/i }).first();
  console.log('Yes button count with regex:', await yesBtn.count());
  if (await yesBtn.count() > 0) {
    await yesBtn.click();
    console.log('Clicked Yes button!');
  }

  await page.waitForTimeout(1000);

  const step3Buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="radio"], [role="button"], [role="option"]'))
      .map(b => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.innerText ? b.innerText.trim().replace(/\s+/g, ' ') : '',
          top: Math.round(rect.top),
          visible: rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top < window.innerHeight
        };
      })
      .filter(b => b.visible);
  });
  console.log('Visible buttons on Step 3:', step3Buttons);

  await browser.close();
})();
