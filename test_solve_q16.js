const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'domcontentloaded' });
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
    await page.waitForTimeout(300);
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
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"]'));
        const match = buttons.find(b => (b.innerText || '').trim() === val) || buttons[Math.min(parseInt(val) - 1, buttons.length - 1)];
        if (match) match.click();
      }, item.target);
      await page.waitForTimeout(200);
      await page.keyboard.press(item.target);
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
            const btnClean = clean(raw);
            return btnClean.includes(cleanPart) || cleanPart.includes(btnClean);
          });
          if (match) match.click();
        }
        const ok = activeBlock.querySelector('button[data-qa*="ok-button"], button[data-qa*="partial-submission-button"]');
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
        const input = activeBlock.querySelector('textarea, input[type="text"]');
        if (input) {
          input.focus();
          input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      }, item.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else {
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
            const btnClean = clean(raw);
            return btnClean === cleanT || btnClean.includes(cleanT);
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
  console.log('\n=== REACHED SCREEN ===');

  const curScreen = await page.evaluate(() => {
    const clean = str => (str || '').replace(/\s+/g, ' ').trim();
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return {
      counter: counters[0]?.text,
      title: clean(activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText),
      text: clean(activeBlock.innerText).slice(0, 300)
    };
  });
  console.log('Current Screen:', JSON.stringify(curScreen, null, 2));
  await page.screenshot({ path: 'test_q16_reach.png' });


  // TEST: Click the sortable items in Aspect 0 and Aspect 1
  console.log('\nTesting clicking each sortable item...');
  const clickRes = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('[data-qa="block"]'));
    const results = [];
    blocks.forEach((block, bIdx) => {
      const sortables = Array.from(block.querySelectorAll('[aria-roledescription="sortable"], li div[role="button"]'));
      results.push(`Block ${bIdx} has ${sortables.length} sortables`);
      sortables.forEach((item, sIdx) => {
        item.click();
      });
    });
    return results;
  });
  console.log('Click Results:', clickRes);
  await page.waitForTimeout(1000);

  // Check combobox states after clicking sortables
  const afterComboboxes = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('[data-qa="block"]'));
    return blocks.map((b, i) => {
      return Array.from(b.querySelectorAll('button[role="combobox"]')).map(el => el.innerText.trim());
    });
  });
  console.log('Combobox values after clicking sortables:', JSON.stringify(afterComboboxes));

  // If comboboxes are still "-", let's test clicking combobox and picking an option!
  if (afterComboboxes && afterComboboxes[0] && afterComboboxes[0].some(v => v === '-')) {
    console.log('\nComboboxes still "-", testing Radix dropdown selection...');
    // Try clicking first combobox button
    await page.evaluate(() => {
      const firstCombo = document.querySelector('[data-qa="block"] button[role="combobox"]');
      if (firstCombo) firstCombo.click();
    });
    await page.waitForTimeout(500);

    const popperOptions = await page.evaluate(() => {
      const popper = document.querySelector('[data-radix-popper-content-wrapper], [role="listbox"]');
      if (!popper) return { found: false };
      const items = Array.from(popper.querySelectorAll('[role="option"], div, span')).map(el => el.innerText.trim()).filter(Boolean);
      return { found: true, items, html: popper.outerHTML.slice(0, 300) };
    });
    console.log('Popper options:', popperOptions);
  }


  // Also test drag/keyboard space bar
  console.log('\nTesting space bar rank assignment...');
  await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('[data-qa="block"]'));
    blocks.forEach(b => {
      const sortables = Array.from(b.querySelectorAll('[aria-roledescription="sortable"]'));
      sortables.forEach(s => {
        s.focus();
        s.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
        s.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true }));
      });
    });
  });
  await page.waitForTimeout(1000);

  const afterSpace = await page.evaluate(() => {
    const blocks = Array.from(document.querySelectorAll('[data-qa="block"]'));
    return blocks.map((b, i) => {
      return Array.from(b.querySelectorAll('button[role="combobox"]')).map(el => el.innerText.trim());
    });
  });
  console.log('Combobox values after space test:', JSON.stringify(afterSpace));

  await browser.close();
})();
