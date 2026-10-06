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

  // Answer 1 to 21
  const steps = [
    { target: "Yes, I consent" },
    { target: "Yes" },
    { target: "22–25" },
    { target: "Man" },
    { type: 'dd', target: "Nepal" },
    { type: 'dd', target: "Nepal" },
    { target: "Full-time student" },
    { target: "Bachelor's" },
    { target: "STEM" },
    { target: "Yes, actively" },
    { target: "Mid-sized city" },
    { target: "No, but I plan to" },
    { type: 'break' },
    { type: 'rating', target: "4" },
    { type: 'rating', target: "3" },
    { type: 'ranking', target: ["Self-taught", "Hands-on", "Formal"] },
    { type: 'multi', target: ["Creative problem-solving", "Resilience", "Cross-cultural"] },
    { target: "Daily" },
    { type: 'rating', target: "5" },
    { type: 'rating', target: "3" },
    { target: "No" }
  ];

  for (const s of steps) {
    await page.waitForTimeout(400);
    if (s.type === 'break') {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('continue'));
        if (btn) btn.click();
      });
      await page.keyboard.press('Enter');
    } else if (s.type === 'dd') {
      await page.evaluate(() => {
        const trig = document.querySelector('button[data-qa*="combobox-trigger"]');
        if (trig) trig.click();
      });
      await page.waitForTimeout(200);
      await page.keyboard.type(s.target);
      await page.waitForTimeout(300);
      await page.evaluate((val) => {
        const opts = Array.from(document.querySelectorAll('[role="option"], li'));
        const m = opts.find(o => (o.innerText || '').toLowerCase().includes(val.toLowerCase()));
        if (m) m.click();
      }, s.target);
      await page.keyboard.press('Enter');
    } else if (s.type === 'rating') {
      await page.evaluate((val) => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
        const m = btns.find(b => (b.innerText || '').trim() === val);
        if (m) m.click();
      }, s.target);
      await page.keyboard.press(s.target);
    } else if (s.type === 'ranking' || s.type === 'multi') {
      await page.evaluate((parts) => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"], div[data-qa*="choice"]'));
        for (const p of parts) {
          const m = btns.find(b => (b.innerText || '').toLowerCase().includes(p.toLowerCase()));
          if (m) m.click();
        }
        const ok = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('ok'));
        if (ok) ok.click();
      }, s.target);
      await page.keyboard.press('Enter');
    } else {
      await page.evaluate((val) => {
        const btns = Array.from(document.querySelectorAll('button, [role="radio"], [role="button"], label'));
        const m = btns.find(b => (b.innerText || '').toLowerCase().includes(val.toLowerCase()));
        if (m) m.click();
      }, s.target);
    }
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(1000);
  console.log('\n================ NOW ON QUESTION ================');
  const details = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));

    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const title = activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText || '';

    const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label, div[data-qa*="choice"]')).map(b => ({
      text: clean(b.innerText),
      role: b.getAttribute('role'),
      qa: b.getAttribute('data-qa'),
      tag: b.tagName
    }));

    return {
      counter: counters[0]?.text,
      title: clean(title),
      fullText: clean(activeBlock.innerText),
      buttons
    };
  });

  console.log('Counter:', details.counter);
  console.log('Title:', details.title);
  console.log('Full Text:\n', details.fullText);
  console.log('\nButtons:\n', JSON.stringify(details.buttons, null, 2));

  await browser.close();
})();
