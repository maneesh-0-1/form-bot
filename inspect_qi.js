const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
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
    await page.waitForTimeout(300);
  }

  // Break 1
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  // Qa through Qh (Answer Yes to Qh)
  for (let i = 1; i <= 8; i++) {
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
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(1000);
  const active = await page.evaluate(() => {
    const clean = str => (str || '').replace(/\s+/g, ' ').trim();
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => {
        const rect = el.getBoundingClientRect();
        const blockEl = el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || el.parentElement.parentElement;
        const bStyle = window.getComputedStyle(blockEl || el);
        const opacity = parseFloat(bStyle.opacity || '1');
        return { el, blockEl, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText), opacity };
      })
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text && c.opacity > 0.5);

    const block = counters[0]?.blockEl || document.body;
    return {
      counter: counters[0]?.text,
      title: block.querySelector('[data-qa*="block-title"], legend, h1, h2')?.innerText,
      innerHTML: block.innerHTML.slice(0, 500)
    };
  });
  console.log('Active question on Qi:', active);

  await page.screenshot({ path: 'debug_screenshots/qi_debug.png' });
  await browser.close();
})();
