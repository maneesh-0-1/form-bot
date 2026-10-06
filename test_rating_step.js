const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  // Answer Q1-12
  const s1 = [
    { t: 'radio', v: 'Yes, I consent' },
    { t: 'radio', v: 'Yes' },
    { t: 'radio', v: '22–25' },
    { t: 'radio', v: 'Man' },
    { t: 'dropdown', v: 'Nepal' },
    { t: 'dropdown', v: 'Nepal' },
    { t: 'radio', v: 'Full-time student' },
    { t: 'radio', v: "Bachelor's" },
    { t: 'radio', v: 'STEM' },
    { t: 'radio', v: 'Yes, actively' },
    { t: 'radio', v: 'Mid-sized city' },
    { t: 'radio', v: 'No, but I plan to' }
  ];

  for (const it of s1) {
    if (it.t === 'radio') {
      await page.evaluate((val) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanT = clean(val);
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], label'));
        const match = buttons.find(b => {
          const raw = b.innerText.trim();
          const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
          const btnClean = clean(withoutBadge);
          return btnClean === cleanT || btnClean.startsWith(cleanT) || btnClean.includes(cleanT) || cleanT.includes(btnClean);
        });
        if (match) match.click();
      }, it.v);
      await page.waitForTimeout(600);
    } else {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const trigger = activeBlock.querySelector('button[data-qa*="combobox-trigger"], button');
        if (trigger) trigger.click();
      });
      await page.waitForTimeout(300);
      await page.keyboard.type(it.v, { delay: 40 });
      await page.waitForTimeout(400);
      await page.evaluate((val) => {
        const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
        const match = options.find(el => (el.innerText || el.textContent || '').trim() === val);
        if (match) match.click();
      }, it.v);
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
      await page.waitForTimeout(600);
    }
  }

  console.log('--- At Step 13 (Section Break 1) ---');
  await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const btn = activeBlock.querySelector('button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);

  console.log('--- At Step 14 (Rating Question a) ---');
  // Inspect rating elements
  const ratingDetails = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const allEls = Array.from(activeBlock.querySelectorAll('*')).map(el => ({
      tag: el.tagName,
      qa: el.getAttribute('data-qa'),
      role: el.getAttribute('role'),
      text: el.innerText ? el.innerText.trim().slice(0, 30) : null
    }));
    return {
      activeTitle: activeBlock.innerText.slice(0, 100),
      buttons: allEls.filter(e => ['BUTTON', 'INPUT', 'LABEL', 'SPAN'].includes(e.tag) && e.text)
    };
  });
  console.log('Rating Details:\n', JSON.stringify(ratingDetails, null, 2));

  // Let's test pressing key '4' on keyboard
  console.log('Pressing "4" via page.keyboard.press("4")...');
  await page.keyboard.press('4');
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'debug_screenshots/test_rating_after_press_4.png' });

  // Now press Enter or click OK
  console.log('Pressing Enter...');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);

  const afterEnter = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => ({ text: el.innerText.trim(), top: Math.round(el.getBoundingClientRect().top) }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return {
      counter: counters[0]?.text,
      text: activeBlock.innerText.slice(0, 100)
    };
  });
  console.log('After pressing 4 and Enter:\n', afterEnter);

  await browser.close();
})();
