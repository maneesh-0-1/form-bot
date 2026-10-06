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

  async function clickActiveElement(selectorFn, ...args) {
    const coords = await page.evaluate(selectorFn, ...args);
    if (coords && coords.x && coords.y) {
      await page.mouse.click(coords.x, coords.y);
      return true;
    }
    return false;
  }

  // Answer 1 to 15
  const quickItems = [
    { id: 1, type: 'radio', target: "Yes, I consent" },
    { id: 2, type: 'radio', target: "Yes" },
    { id: 3, type: 'radio', target: "22–25", altTargets: ["22-25", "25", "–25"] },
    { id: 4, type: 'radio', target: "Man" },
    { id: 5, type: 'dropdown', target: "Nepal" },
    { id: 6, type: 'dropdown', target: "Nepal" },
    { id: 7, type: 'radio', target: "Full-time student" },
    { id: 8, type: 'radio', target: "Bachelor's" },
    { id: 9, type: 'radio', target: "STEM" },
    { id: 10, type: 'radio', target: "Yes, actively" },
    { id: 11, type: 'radio', target: "Mid-sized city" },
    { id: 12, type: 'radio', target: "No, but I plan to" },
    { id: 13, type: 'break', target: "Continue" },
    { id: 14, type: 'rating', target: "4" },
    { id: 15, type: 'rating', target: "3" },
    { id: 16, type: 'ranking', target: "Self-taught learning, Hands-on experience, Formal education" }
  ];

  for (const item of quickItems) {
    await page.waitForTimeout(500);
    if (item.type === 'break') {
      await clickActiveElement(() => {
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
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (item.type === 'dropdown') {
      await clickActiveElement(() => {
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
      await page.waitForTimeout(300);
      await page.keyboard.type(item.target, { delay: 40 });
      await page.waitForTimeout(400);
      await page.evaluate((val) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanV = clean(val);
        const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [data-radix-popper-content-wrapper] [role="option"], [data-radix-popper-content-wrapper] li, [data-qa*="combobox-item"], [role="option"], li'));
        const match = options.find(el => {
          const txt = clean(el.innerText || el.textContent || '');
          return txt === cleanV || txt.startsWith(cleanV) || txt.includes(cleanV);
        });
        if (match) match.click();
      }, item.target);
      await page.waitForTimeout(300);
      await clickActiveElement(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
        if (!ok) return null;
        const r = ok.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    } else if (item.type === 'rating') {
      await clickActiveElement((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
        const match = buttons.find(b => (b.innerText || '').trim() === val || (b.innerText || '').trim().startsWith(val));
        if (!match) return null;
        const r = match.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, item.target);
      await page.waitForTimeout(300);
      await clickActiveElement(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('ok') || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (!ok) return null;
        const r = ok.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    } else if (item.type === 'ranking') {
      const parts = item.target.split(',').map(s => s.trim()).filter(Boolean);
      for (const part of parts) {
        await clickActiveElement((targetStr) => {
          const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanT = clean(targetStr);
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
          const elements = Array.from(activeBlock.querySelectorAll('[role="button"], button, div[data-qa*="choice"], [role="checkbox"], label'));
          const match = elements.find(el => {
            const raw = el.innerText.trim();
            const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
            const btnClean = clean(withoutBadge);
            return btnClean.includes(cleanT) || cleanT.includes(btnClean);
          });
          if (!match) return null;
          const r = match.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }, part);
        await page.waitForTimeout(250);
      }
      await page.waitForTimeout(200);
      await clickActiveElement(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('ok') || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (!ok) return null;
        const r = ok.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      await page.keyboard.press('Enter');
    } else {
      // radio
      await clickActiveElement(({ targets }) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label'));
        for (const t of targets) {
          const cleanT = clean(t);
          const match = buttons.find(b => {
            const raw = b.innerText.trim();
            const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
            const btnClean = clean(withoutBadge);
            return btnClean === cleanT || btnClean.startsWith(cleanT) || btnClean.includes(cleanT) || cleanT.includes(btnClean);
          });
          if (match) {
            const r = match.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
        }
        return null;
      }, { targets: item.altTargets ? [item.target, ...item.altTargets] : [item.target] });
    }
  }

  await page.waitForTimeout(1500);

  // Now on Qd!
  console.log('\n--- EXAMINING Qd ---');
  const qdInfo = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return {
      counter: counters[0]?.text,
      title: activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText,
      allButtons: Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="checkbox"], [role="radio"], label, div[data-qa*="choice"]')).map(b => ({
        tag: b.tagName,
        text: (b.innerText || '').trim(),
        role: b.getAttribute('role'),
        qa: b.getAttribute('data-qa'),
        rect: b.getBoundingClientRect()
      }))
    };
  });
  console.log('Qd info:', JSON.stringify(qdInfo, null, 2));

  // Test multiselect on Qd
  console.log('Selecting options on Qd...');
  const qdTargets = ["Creative problem-solving", "Resilience", "Cross-cultural collaboration"];
  for (const t of qdTargets) {
    const clicked = await clickActiveElement((targetStr) => {
      const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanT = clean(targetStr);
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const elements = Array.from(activeBlock.querySelectorAll('[role="button"], button, div[data-qa*="choice"], [role="checkbox"], label'));
      const match = elements.find(el => {
        const raw = el.innerText.trim();
        const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
        const btnClean = clean(withoutBadge);
        return btnClean.includes(cleanT) || cleanT.includes(btnClean);
      });
      if (!match) return null;
      const r = match.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, t);
    console.log(`Clicked target "${t}": ${clicked}`);
    await page.waitForTimeout(300);
  }

  // Click OK on Qd
  console.log('Clicking OK on Qd...');
  await clickActiveElement(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('ok') || (b.getAttribute('data-qa') || '').includes('ok-button'));
    if (!ok) return null;
    const r = ok.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  await page.waitForTimeout(1500);
  const afterQd = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return {
      counter: counters[0]?.text,
      title: activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText
    };
  });
  console.log('Screen after clicking OK on Qd:', afterQd);

  await browser.close();
})();
