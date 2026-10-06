const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 40 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
  }

  async function getActiveBlock() {
    return await page.evaluate(() => {
      const clean = str => (str || '').replace(/\s+/g, ' ').trim();
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText) };
        })
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);

      if (counters.length > 0) {
        counters.sort((a, b) => a.dist - b.dist);
        const activeCounter = counters[0];
        const blockEl = activeCounter.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || activeCounter.el.parentElement.parentElement;
        const titleEl = blockEl.querySelector('[data-qa*="block-title"], legend, h1, h2, h3');
        return {
          type: 'question',
          counter: activeCounter.text,
          title: `Q${activeCounter.text}: ${titleEl ? clean(titleEl.innerText) : ''}`,
          text: clean(blockEl.innerText).slice(0, 150)
        };
      }
      return { type: 'fallback', counter: 'none', title: clean(document.body.innerText).slice(0, 60), text: '' };
    });
  }

  async function waitForActiveBlockToChange(oldTitle, maxWaitMs = 4000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await page.waitForTimeout(100);
      const cur = await getActiveBlock();
      if (cur.title && cur.title !== oldTitle) {
        return cur;
      }
    }
    return await getActiveBlock();
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
    { id: 22, type: 'dropdown_or_choice', target: "Finding a first job" },
    { id: 23, type: 'radio', target: "No, but I want to" },
    { id: 24, type: 'multiselect', target: "My education covers it, Lack of time, I don't know what skills I" },
    { id: 25, type: 'rating', target: "3" },
    { id: 26, type: 'text', target: "Get more Practical Learning" },
    { id: 27, type: 'break', target: "Continue" },
    { id: 28, type: 'ranking', target: "Formal authority, Inspirational, Peer" },
    { id: 29, type: 'radio', target: "Once" },
    { id: 30, type: 'dropdown_or_choice', target: "Systemic: Lack of networks," },
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
    { id: 49, type: 'rating', target: "2" },
    { id: 50, type: 'matrix', target: "3, 3" }
  ];

  for (const item of items) {
    await page.waitForTimeout(500);
    const before = await getActiveBlock();
    console.log(`\n[STEP ${item.id}] Starting on: "${before.title}"`);

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
      await page.waitForTimeout(200);
      await page.keyboard.press(item.target);
      await page.waitForTimeout(300);
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
    } else if (item.type === 'matrix') {
      console.log(`Processing matrix Q16...`);
      // Extract coordinates of all choices in each row and click via mouse!
      const clickCoords = await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        // Find all radio groups or row containers in this active block
        const rowGroups = Array.from(activeBlock.querySelectorAll('fieldset, [role="radiogroup"], [data-qa*="matrix-row"], [data-qa*="row"]'));
        const coords = [];

        if (rowGroups.length >= 2) {
          rowGroups.forEach(row => {
            const buttons = Array.from(row.querySelectorAll('button, [role="radio"], [role="button"], label'));
            // Pick a middle option (index 2 or 3)
            const targetBtn = buttons[Math.min(2, buttons.length - 1)];
            if (targetBtn) {
              const r = targetBtn.getBoundingClientRect();
              coords.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
            }
          });
        } else {
          // Fallback find all buttons that are radio/choice
          const allRadios = Array.from(activeBlock.querySelectorAll('[role="radio"], button:not([data-qa*="ok-button"])'));
          if (allRadios.length >= 2) {
            const first = allRadios[0].getBoundingClientRect();
            const second = allRadios[Math.floor(allRadios.length / 2)].getBoundingClientRect();
            coords.push({ x: first.left + first.width / 2, y: first.top + first.height / 2 });
            coords.push({ x: second.left + second.width / 2, y: second.top + second.height / 2 });
          }
        }

        // Get OK button coordinate
        const okBtn = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
        });
        let okCoord = null;
        if (okBtn) {
          const r = okBtn.getBoundingClientRect();
          okCoord = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }

        return { coords, okCoord };
      });

      console.log('Matrix Click Coords:', clickCoords);
      for (const c of clickCoords.coords) {
        await page.mouse.click(c.x, c.y);
        await page.waitForTimeout(300);
      }
      if (clickCoords.okCoord) {
        await page.mouse.click(clickCoords.okCoord.x, clickCoords.okCoord.y);
      }
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

    const after = await waitForActiveBlockToChange(before.title);
    console.log(`[STEP ${item.id}] Result Screen After: "${after.title}"`);
  }

  await page.waitForTimeout(1000);
  const finalScreen = await getActiveBlock();
  console.log('\nFINAL SCREEN AFTER STEP 50:', finalScreen);

  await browser.close();
})();
