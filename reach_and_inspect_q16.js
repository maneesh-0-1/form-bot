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

  const items = [
    { id: 1, type: 'radio', target: "Yes, I consent" },
    { id: 2, type: 'radio', target: "Yes" },
    { id: 3, type: 'radio', target: "22–25", altTargets: ["22-25", "–25", "-25", "25", "Under 25", "18–25"] },
    { id: 4, type: 'radio', target: "Man" },
    { id: 5, type: 'dropdown', target: "Nepal" },
    { id: 6, type: 'dropdown', target: "Nepal" },
    { id: 7, type: 'radio', target: "Full-time student" },
    { id: 8, type: 'radio', target: "Bachelor's", altTargets: ["Bachelor", "Bachelor's degree"] },
    { id: 9, type: 'radio', target: "STEM" },
    { id: 10, type: 'radio', target: "Yes, actively", altTargets: ["Yes", "actively"] },
    { id: 11, type: 'radio', target: "Mid-sized city" },
    { id: 12, type: 'radio', target: "No, but I plan to", altTargets: ["No, but I plan"] },
    { id: 13, type: 'break', target: "Continue" },
    { id: 14, type: 'rating', target: "4" },
    { id: 15, type: 'rating', target: "3" },
    { id: 16, type: 'ranking', target: "Self-taught learning, Hands-on experience, Formal education" },
    { id: 17, type: 'multiselect', target: "Creative problem-solving, Resilience, Cross-cultural collaboration" },
    { id: 18, type: 'radio', target: "Daily" },
    { id: 19, type: 'rating', target: "5" },
    { id: 20, type: 'rating', target: "3" },
    { id: 21, type: 'radio', target: "No" },
    { id: 22, type: 'radio', target: "Finding a first job" },
    { id: 23, type: 'radio', target: "No, but I want to" },
    { id: 24, type: 'multiselect', target: "My education covers it, Lack of time, I don't know what skills I" },
    { id: 25, type: 'rating', target: "3" },
    { id: 26, type: 'text', target: "Get more Practical Learning" },
    { id: 27, type: 'break', target: "Continue" },
    { id: 28, type: 'ranking', target: "Formal authority, Inspirational, Peer" },
    { id: 29, type: 'radio', target: "Once" },
    { id: 30, type: 'radio', target: "Systemic: Lack of networks," },
    { id: 31, type: 'rating', target: "5" },
    { id: 32, type: 'multiselect', target: "Cross-cultural communication" },
    { id: 33, type: 'rating', target: "5" },
    { id: 34, type: 'rating', target: "3" },
    { id: 35, type: 'rating', target: "4" },
    { id: 36, type: 'radio', target: "Emerging Community Leaders", altTargets: ["Emerging"] },
    { id: 37, type: 'ranking', target: "Social media, Lived experience, Institutional" },
    { id: 38, type: 'text', target: "Awarness" },
    { id: 39, type: 'break', target: "Continue" },
    { id: 40, type: 'rating', target: "4" },
    { id: 41, type: 'rating', target: "5" },
    { id: 42, type: 'rating', target: "2" },
    { id: 43, type: 'multiselect', target: "Relationships, Job market uncertainty, Climate anxiety" },
    { id: 44, type: 'rating', target: "4" },
    { id: 45, type: 'multiselect', target: "Clear protocols for deadline, On-site or subsidized free" },
    { id: 46, type: 'break', target: "Continue" },
    { id: 47, type: 'multiselect', target: "Social media, Online communities" },
    { id: 48, type: 'rating', target: "4" },
    { id: 49, type: 'rating', target: "2" }
  ];

  for (const item of items) {
    await page.waitForTimeout(400);

    if (item.type === 'break') {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const btn = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return t.includes('continue') || (b.getAttribute('data-qa') || '').includes('ok-button');
        }) || activeBlock.querySelector('button');
        if (btn) btn.click();
      });
      await page.keyboard.press('Enter');
    } else if (item.type === 'dropdown') {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
        if (trig) trig.click();
      });
      await page.waitForTimeout(200);
      await page.keyboard.type(item.target, { delay: 30 });
      await page.waitForTimeout(300);
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
      await page.waitForTimeout(200);
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
    } else if (item.type === 'rating') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
        const match = buttons.find(b => (b.innerText || '').trim() === val);
        if (match) match.click();
      }, item.target);
      await page.waitForTimeout(100);
      await page.keyboard.press(item.target);
      await page.waitForTimeout(200);
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
    } else if (item.type === 'ranking' || item.type === 'multiselect') {
      await page.evaluate((val) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        const parts = val.split(',').map(s => s.trim()).filter(Boolean);
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
      }, item.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (item.type === 'text') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const input = activeBlock.querySelector('textarea, input[type="text"], input:not([type="hidden"])');
        if (input) {
          input.focus();
          input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
        });
        if (ok) ok.click();
      }, item.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else {
      // radio
      await page.evaluate(({ targets }) => {
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
            match.click();
            break;
          }
        }
      }, { targets: item.altTargets ? [item.target, ...item.altTargets] : [item.target] });
    }
  }

  await page.waitForTimeout(1500);

  console.log('\n================ NOW ON Q16 ================');
  const details = await page.evaluate(() => {
    const clean = str => (str || '').replace(/\s+/g, ' ').trim();
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => {
        const rect = el.getBoundingClientRect();
        return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: el.innerText.trim() };
      })
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);

    counters.sort((a, b) => a.dist - b.dist);
    const activeCounter = counters[0];
    const activeBlock = activeCounter?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const titleEl = activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3');

    const allButtons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"], [role="checkbox"], label, div[data-qa*="choice"]')).map(b => ({
      text: clean(b.innerText),
      role: b.getAttribute('role'),
      qa: b.getAttribute('data-qa'),
      tag: b.tagName
    }));

    return {
      counter: activeCounter?.text,
      title: titleEl ? clean(titleEl.innerText) : '',
      fullText: clean(activeBlock.innerText),
      buttons: allButtons
    };
  });

  console.log('Counter:', details.counter);
  console.log('Title:', details.title);
  console.log('Full Text:\n', details.fullText);
  console.log('\nButtons:\n', JSON.stringify(details.buttons, null, 2));

  await page.screenshot({ path: 'debug_screenshots/q16_inspected.png' });
  await browser.close();
})();
