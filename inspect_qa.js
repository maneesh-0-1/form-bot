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

  // Answer Q1 - Q12
  const simpleTargets = [
    "Yes, I consent", "Yes", "22–25", "Man", "Nepal", "Nepal",
    "Full-time student", "Bachelor's", "STEM", "Yes, actively",
    "Mid-sized city", "No, but I plan to"
  ];

  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(400);
    if (i === 4 || i === 5) {
      // dropdown
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
      await page.evaluate((target) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanT = clean(target);
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label'));
        const match = buttons.find(b => clean(b.innerText).includes(cleanT) || cleanT.includes(clean(b.innerText)));
        if (match) match.click();
      }, simpleTargets[i]);
    }
    await page.waitForTimeout(400);
  }

  // Now test handling items 13 to 28
  const testItems = [
    { id: 13, type: 'break', key: "Section Break 1", target: "Continue" },
    { id: 14, type: 'rating', key: "How prepared do you feel for...", target: "4" },
    { id: 15, type: 'rating', key: "To what extent does your...", target: "3" },
    { id: 16, type: 'ranking', key: "Question c. of 22 (Rank / Priority)", target: "Self-taught learning (Online), Hands-on experience (Previous)" },
    { id: 17, type: 'multiselect', key: 'Question d. of 22 ("Which human...")', target: "Creative problem-solving, Resilience, Cross-cultural collaboration" },
    { id: 18, type: 'radio', key: "Frequency / AI or Tool usage", target: "Daily" },
    { id: 19, type: 'rating', key: "How concerned are you about...", target: "5" },
    { id: 20, type: 'rating', key: "How strongly do you agree: Traditional employment", target: "3" },
    { id: 21, type: 'radio', key: "Qualifier question", target: "No" },
    { id: 22, type: 'dropdown_or_choice', key: "Key Challenge / Goal", target: "Finding a first job" },
    { id: 23, type: 'radio', key: "Skill / Training interest", target: "No, but I want to" },
    { id: 24, type: 'multiselect', key: 'Question k. of 56 ("What is the...")', target: "My education covers it, Lack of time, I don't know what skills I" },
    { id: 25, type: 'rating', key: "Scale / Score", target: "3" },
    { id: 26, type: 'text', key: 'Question m. of 56 ("To secure...")', target: "Get more Practical Learning" },
    { id: 27, type: 'break', key: "Section Break 2", target: "Continue" },
    { id: 28, type: 'ranking', key: 'Question a. of 56 ("Rank the...")', target: "Formal authority: Holding a" }
  ];

  async function clickActiveElement(selectorFn, ...args) {
    const coords = await page.evaluate(selectorFn, ...args);
    if (coords && coords.x && coords.y) {
      await page.mouse.click(coords.x, coords.y);
      return true;
    }
    return false;
  }

  for (const item of testItems) {
    await page.waitForTimeout(600);
    const before = await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const titleEl = activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3');
      return { counter: counters[0]?.text || 'none', title: titleEl ? titleEl.innerText.trim() : '' };
    });

    console.log(`\n[STEP ${item.id}] [${item.type.toUpperCase()}] "${item.key}" | Target: "${item.target}"`);
    console.log(`    Before: [${before.counter}] "${before.title}"`);

    if (item.type === 'break') {
      const clicked = await clickActiveElement(() => {
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
      console.log(`    Break button clicked: ${clicked}`);
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
    } else if (item.type === 'rating') {
      const clicked = await clickActiveElement((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
        const match = buttons.find(b => (b.innerText || '').trim() === val || (b.innerText || '').trim().startsWith(val));
        if (!match) return null;
        const r = match.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, item.target);
      console.log(`    Rating button clicked: ${clicked}`);
      await page.waitForTimeout(200);
      await page.keyboard.press(item.target);
      await page.waitForTimeout(200);
      // Click OK in active block if present
      await clickActiveElement(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').trim().toLowerCase() === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (!ok) return null;
        const r = ok.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    } else if (item.type === 'ranking' || item.type === 'multiselect') {
      await page.evaluate((val) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
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
      }, item.target);
      await page.waitForTimeout(300);
      await clickActiveElement(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').trim().toLowerCase() === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (!ok) return null;
        const r = ok.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      await page.keyboard.press('Enter');
    } else if (item.type === 'text') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const input = activeBlock.querySelector('textarea, input[type="text"], input:not([type="hidden"])');
        if (input) {
          input.focus();
          input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, item.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else {
      // Radio / Choice
      await clickActiveElement((targetVal) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanT = clean(targetVal);
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]');
        if (trig) {
          const r = trig.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }

        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label'));
        const match = buttons.find(b => {
          const raw = b.innerText.trim();
          const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
          const btnClean = clean(withoutBadge);
          return btnClean === cleanT || btnClean.startsWith(cleanT) || btnClean.includes(cleanT) || cleanT.includes(btnClean);
        });
        if (!match) return null;
        const r = match.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, item.target);
    }
    await page.waitForTimeout(500);
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
