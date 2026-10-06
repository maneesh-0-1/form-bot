const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  // Helper to click in active block
  async function answerRadio(text) {
    await page.evaluate((val) => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0].el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || counters[0].el.parentElement.parentElement;
      const btns = Array.from(activeBlock.querySelectorAll('button, label'));
      const match = btns.find(b => b.innerText.includes(val));
      if (match) match.click();
    }, text);
    await page.waitForTimeout(300);
    // Click OK in active block
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0].el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || counters[0].el.parentElement.parentElement;
      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });
    await page.waitForTimeout(600);
  }

  // Q1
  await answerRadio('Yes, I consent');
  // Q2
  await answerRadio('Yes');
  // Q3
  await answerRadio('22–25');
  // Q4
  await answerRadio('Man');

  // Now at Q5 (Dropdown)
  console.log('--- At Q5 Dropdown ---');
  // 1. Click trigger inside active block
  const triggerClicked = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0].el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || counters[0].el.parentElement.parentElement;
    const trigger = activeBlock.querySelector('button[data-qa*="combobox-trigger"], button');
    if (trigger) {
      trigger.click();
      return trigger.innerText;
    }
    return null;
  });
  console.log('Trigger clicked in active block:', triggerClicked);
  await page.waitForTimeout(400);

  // 2. Type search text
  await page.keyboard.type('Nepal', { delay: 40 });
  await page.waitForTimeout(400);

  // 3. Click matching option
  const optionClicked = await page.evaluate((val) => {
    const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span, div'));
    const match = options.find(el => {
      const txt = (el.innerText || el.textContent || '').trim();
      return txt === val;
    });
    if (match) {
      match.click();
      return match.innerText || match.textContent;
    }
    return null;
  }, 'Nepal');
  console.log('Option clicked:', optionClicked);
  await page.waitForTimeout(400);

  // 4. Click OK in active block
  await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0].el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || counters[0].el.parentElement.parentElement;
    const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
    if (ok) ok.click();
  });
  await page.waitForTimeout(800);

  const qAfter5 = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => el.innerText.trim())
      .filter(Boolean);
    return counters;
  });
  console.log('Counters after Q5:', qAfter5);

  await browser.close();
})();
