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

  async function clickActive(selectorFn, ...args) {
    const coords = await page.evaluate(selectorFn, ...args);
    if (coords && coords.x && coords.y) {
      await page.mouse.click(coords.x, coords.y);
      return true;
    }
    return false;
  }

  // Answer 1 to 12
  const simpleTargets = [
    "Yes, I consent", "Yes", "22–25", "Man", "Nepal", "Nepal",
    "Full-time student", "Bachelor's", "STEM", "Yes, actively",
    "Mid-sized city", "No, but I plan to"
  ];

  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(400);
    if (i === 4 || i === 5) {
      await clickActive(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
        if (!trig) return null;
        const r = trig.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      await page.waitForTimeout(200);
      await page.keyboard.type('Nepal', { delay: 30 });
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [role="option"], li'));
        const match = options.find(o => (o.innerText || '').toLowerCase().includes('nepal'));
        if (match) match.click();
      });
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else {
      await clickActive((target) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanT = clean(target);
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label'));
        const match = buttons.find(b => clean(b.innerText).includes(cleanT) || cleanT.includes(clean(b.innerText)));
        if (!match) return null;
        const r = match.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, simpleTargets[i]);
    }
    await page.waitForTimeout(400);
  }

  // Section break 1
  await page.waitForTimeout(1000);
  await clickActive(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const btn = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('continue') || (b.innerText || '').toLowerCase().includes('ok')) || activeBlock.querySelector('button');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.waitForTimeout(1000);

  // Qa (rating 4)
  await clickActive(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const btn = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').trim() === '4');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.waitForTimeout(300);
  await clickActive(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('ok'));
    if (!ok) return null;
    const r = ok.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.waitForTimeout(1000);

  // Qb (rating 3)
  await clickActive(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const btn = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').trim() === '3');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.waitForTimeout(300);
  await clickActive(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('ok'));
    if (!ok) return null;
    const r = ok.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.waitForTimeout(1500);

  // Test ranking clicks on Qc
  console.log('Clicking ranking items on Qc in order...');
  const targets = ["Self-taught learning", "Hands-on experience", "Formal education"];
  for (const t of targets) {
    const clicked = await clickActive((targetStr) => {
      const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanT = clean(targetStr);
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const elements = Array.from(activeBlock.querySelectorAll('[role="button"], button, div[data-qa*="choice"]'));
      const match = elements.find(el => clean(el.innerText).includes(cleanT));
      if (!match) return null;
      const r = match.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, t);
    console.log(`Clicked ranking target "${t}": ${clicked}`);
    await page.waitForTimeout(300);
  }

  // Click OK on Qc
  console.log('Clicking OK on Qc...');
  await clickActive(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('ok'));
    if (!ok) return null;
    const r = ok.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  await page.waitForTimeout(1500);
  const nextScreen = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return {
      counter: counters[0]?.text,
      title: activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText
    };
  });
  console.log('Screen after ranking Qc:', nextScreen);

  await browser.close();
})();
