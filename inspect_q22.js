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
    await page.waitForTimeout(1200);
  }

  async function answerRadio(val) {
    await page.waitForTimeout(400);
    await page.evaluate((v) => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const btn = Array.from(activeBlock.querySelectorAll('button, label')).find(b => b.innerText.includes(v));
      if (btn) btn.click();
    }, val);
    await page.waitForTimeout(600);
  }

  async function answerDropdown(val) {
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
      if (trig) trig.click();
    });
    await page.waitForTimeout(300);
    await page.keyboard.type(val, { delay: 40 });
    await page.waitForTimeout(400);
    await page.evaluate((v) => {
      const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
      const match = options.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === v.toLowerCase());
      if (match) match.click();
    }, val);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
  }

  async function answerRating(val) {
    await page.waitForTimeout(400);
    await page.evaluate((v) => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
      const match = buttons.find(b => (b.innerText || '').trim() === v);
      if (match) match.click();
    }, val);
    await page.waitForTimeout(200);
    await page.keyboard.press(val);
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
        const t = (b.innerText || '').trim().toLowerCase();
        return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
      });
      if (ok) ok.click();
    });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
  }

  async function answerMultiselect(val) {
    await page.waitForTimeout(400);
    await page.evaluate((v) => {
      const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const parts = v.split(',').map(s => s.trim()).filter(Boolean);
      const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="checkbox"], [role="button"], label'));
      for (const part of parts) {
        const cleanPart = clean(part);
        const match = buttons.find(b => {
          const raw = b.innerText.trim();
          const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
          const btnClean = clean(withoutBadge);
          return btnClean.includes(cleanPart) || cleanPart.includes(btnClean) || btnClean.includes(cleanPart.slice(0, 10));
        });
        if (match) match.click();
      }
      const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
        const t = (b.innerText || '').trim().toLowerCase();
        return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
      });
      if (ok) ok.click();
    }, val);
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
  }

  // 1-12
  await answerRadio('Yes, I consent');
  await answerRadio('Yes');
  await answerRadio('22–25');
  await answerRadio('Man');
  await answerDropdown('Nepal');
  await answerDropdown('Nepal');
  await answerRadio('Full-time student');
  await answerRadio("Bachelor's");
  await answerRadio('STEM');
  await answerRadio('Yes');
  await answerRadio('Mid-sized city');
  await answerRadio('No, but I plan to');

  // 13
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const btn = activeBlock.querySelector('button');
    if (btn) btn.click();
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);

  // 14-21
  await answerRating('4');
  await answerRating('3');
  await answerMultiselect('Self-taught learning (Online), Hands-on experience (Previous)');
  await answerMultiselect('Creative problem-solving, Resilience, Cross-cultural collaboration');
  await answerRadio('Daily');
  await answerRating('5');
  await answerRating('3');
  await answerRadio('No');

  console.log('--- At Question 22 ---');
  await page.waitForTimeout(800);

  // Open the combobox trigger
  await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
    if (trig) trig.click();
  });
  await page.waitForTimeout(600);

  // Dump options
  const q22Options = await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], [data-radix-collection-item]'));
    return options.map(o => ({
      tag: o.tagName,
      role: o.getAttribute('role'),
      qa: o.getAttribute('data-qa'),
      text: o.innerText.trim()
    }));
  });
  console.log('Q22 Combobox Options:\n', JSON.stringify(q22Options, null, 2));

  await browser.close();
})();
