const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 40 });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }

  // Answer Q1 through Q12
  for (let i = 1; i <= 12; i++) {
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const b = activeBlock.querySelector('button, [role="radio"]');
      if (b) b.click();
      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }

  // Break 1
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);

  // Qa through Qg
  for (let i = 1; i <= 7; i++) {
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const b = activeBlock.querySelector('button, [role="radio"]');
      if (b) b.click();
      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }

  // Answer Qh (No)
  await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const btns = Array.from(activeBlock.querySelectorAll('button, [role="radio"], label'));
    const noBtn = btns.find(b => b.innerText.trim().startsWith('No')) || btns[1];
    if (noBtn) noBtn.click();
    const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
    if (ok) ok.click();
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  const diag = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]')).map(el => {
      const rect = el.getBoundingClientRect();
      const block = el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]');
      const title = block?.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText || '';
      return {
        counterText: el.innerText,
        title: title.slice(0, 40),
        top: Math.round(rect.top),
        height: Math.round(rect.height),
        blockAriaHidden: block?.getAttribute('aria-hidden') || block?.closest('[aria-hidden="true"]') !== null,
        blockDisplay: window.getComputedStyle(block || el).display,
        blockVisibility: window.getComputedStyle(block || el).visibility,
        blockOpacity: window.getComputedStyle(block || el).opacity,
        inViewport: rect.top >= -50 && rect.top < window.innerHeight
      };
    });
  });

  console.log('All counters on screen:', JSON.stringify(diag, null, 2));
  await browser.close();
})();
