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
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Yes, I consent'));
    if (b) b.click();
  });
  await page.waitForTimeout(600);

  // Step 2: Qualifier
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Yes'));
    if (b) b.click();
  });
  await page.waitForTimeout(600);

  // Step 3: Age
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('22–25'));
    if (b) b.click();
  });
  await page.waitForTimeout(600);

  // Step 4: Gender
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(el => el.innerText.includes('Man'));
    if (b) b.click();
  });
  await page.waitForTimeout(1000);

  // Now inspect Step 5 (Country)
  const dropdownElements = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top < window.innerHeight;
      })
      .map(el => ({
        tag: el.tagName,
        qa: el.getAttribute('data-qa'),
        role: el.getAttribute('role'),
        placeholder: el.getAttribute('placeholder'),
        tabIndex: el.getAttribute('tabindex'),
        text: el.innerText ? el.innerText.trim().replace(/\s+/g, ' ') : '',
        classes: el.className
      }))
      .filter(el => el.text.includes('Type or select') || el.role || el.qa || el.placeholder);
    return elements;
  });

  console.log('Step 5 Elements:');
  console.log(JSON.stringify(dropdownElements, null, 2));

  // Let's test clicking the trigger and typing Nepal
  const trigger = page.locator('div:has-text("Type or select an option"), [data-qa*="dropdown"], [role="combobox"], input').filter({ hasText: /Type or select/ }).first();
  console.log('Found trigger count:', await trigger.count());
  if (await trigger.count() > 0) {
    await trigger.click({ force: true });
    await page.waitForTimeout(300);
    console.log('Typing Nepal...');
    await page.keyboard.type('Nepal', { delay: 50 });
    await page.waitForTimeout(500);

    const listboxOptions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[role="option"], div[data-qa*="option"], div[role="listbox"] div'))
        .map(el => el.innerText.trim())
        .filter(Boolean);
    });
    console.log('Listbox options after typing Nepal:', listboxOptions);

    const nepalOption = page.locator('[role="option"]:has-text("Nepal"), div:has-text("Nepal")').last();
    await nepalOption.click({ force: true });
    await page.waitForTimeout(500);
    console.log('Clicked Nepal option!');
  }

  await page.waitForTimeout(1000);
  const nextCard = await page.evaluate(() => document.body.innerText.slice(0, 200));
  console.log('After country selection body text:\n', nextCard);

  await browser.close();
})();
