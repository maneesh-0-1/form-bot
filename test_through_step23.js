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

  async function waitForActiveBlockToChange(oldTitle, maxWaitMs = 3500) {
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

  async function executeUniversalStep(item) {
    await page.waitForTimeout(450);
    const before = await getActiveBlock();
    console.log(`\n[STEP ${item.id}] "${item.key}" | Target: "${item.target}" | Before: "${before.title}"`);

    const hasCombobox = await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      return !!activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]');
    });

    if (item.type === 'break') {
      const clicked = await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const btn = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const txt = (b.innerText || '').trim().toLowerCase();
          return txt.includes('continue') || (b.getAttribute('data-qa') || '').includes('ok-button');
        }) || activeBlock.querySelector('button');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (!clicked) await page.keyboard.press('Enter');
    } else if (item.type === 'dropdown' || hasCombobox) {
      console.log(`Executing dropdown/combobox for "${item.target}"`);
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
      const query = item.target.split(':')[0].split(',')[0].trim();
      await page.keyboard.type(query, { delay: 40 });
      await page.waitForTimeout(400);

      const clicked = await page.evaluate((val) => {
        const v = val.toLowerCase().trim();
        const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], [data-radix-collection-item], span'));
        let match = options.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === v);
        if (!match) match = options.find(el => (el.innerText || el.textContent || '').trim().toLowerCase().startsWith(v));
        if (!match) match = options.find(el => (el.innerText || el.textContent || '').trim().toLowerCase().includes(v));
        if (match) {
          match.click();
          return match.innerText || match.textContent;
        }
        return null;
      }, query);

      console.log(`Dropdown selection result: "${clicked || 'Enter'}"`);
      if (!clicked) {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
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
    } else if (item.type === 'rating' || (/^[0-9]$/.test(item.target) && item.type !== 'radio')) {
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
    } else {
      // Radio
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
            return;
          }
        }
      }, { targets: item.altTargets ? [item.target, ...item.altTargets] : [item.target] });
    }

    const after = await waitForActiveBlockToChange(before.title);
    console.log(`[STEP ${item.id}] After: "${after.title}"`);
    return after.title !== before.title;
  }

  const items = [
    { id: 1, type: 'radio', key: "Consent", target: "Yes, I consent" },
    { id: 2, type: 'radio', key: "Confirmation / Qualifier", target: "Yes" },
    { id: 3, type: 'radio', key: "Age Bracket", target: "22–25", altTargets: ["22-25", "–25", "-25", "25", "Under 25", "18–25"] },
    { id: 4, type: 'radio', key: "Gender", target: "Man" },
    { id: 5, type: 'dropdown', key: "Country of Origin / Residence", target: "Nepal" },
    { id: 6, type: 'dropdown', key: "Current Location / Country", target: "Nepal" },
    { id: 7, type: 'radio', key: "Employment / Student Status", target: "Full-time student" },
    { id: 8, type: 'radio', key: "Education Level", target: "Bachelor's", altTargets: ["Bachelor", "Bachelor's degree"] },
    { id: 9, type: 'radio', key: "Field of Study", target: "STEM" },
    { id: 10, type: 'radio', key: "Job Search Status", target: "Yes, actively", altTargets: ["Yes", "actively"] },
    { id: 11, type: 'radio', key: "Location / Setting", target: "Mid-sized city" },
    { id: 12, type: 'radio', key: "Relocation / Next Plan", target: "No, but I plan to", altTargets: ["No, but I plan"] },
    { id: 13, type: 'break', key: "Section Break 1", target: "Continue" },
    { id: 14, type: 'rating', key: "How prepared do you feel for...", target: "4" },
    { id: 15, type: 'rating', key: "To what extent does your...", target: "3" },
    { id: 16, type: 'ranking', key: "Question c. of 22 (Rank / Priority)", target: "Self-taught learning (Online), Hands-on experience (Previous)" },
    { id: 17, type: 'multiselect', key: 'Question d. of 22 ("Which human...")', target: "Creative problem-solving, Resilience, Cross-cultural collaboration" },
    { id: 18, type: 'radio', key: "Frequency / AI or Tool usage", target: "Daily" },
    { id: 19, type: 'rating', key: "How concerned are you about...", target: "5" },
    { id: 20, type: 'rating', key: "How strongly do you agree: Traditional employment", target: "3" },
    { id: 21, type: 'radio', key: "Qualifier question", target: "No" },
    { id: 22, type: 'dropdown_or_choice', key: "Key Challenge / Goal", target: "Finding a first job", altTargets: ["Finding a first job", "Finding a job"] },
    { id: 23, type: 'radio', key: "Skill / Training interest", target: "No, but I want to" },
    { id: 24, type: 'multiselect', key: 'Question k. of 56 ("What is the...")', target: "My education covers it, Lack of time, I don't know what skills I" },
    { id: 25, type: 'rating', key: "Scale / Score", target: "3" },
    { id: 26, type: 'text', key: 'Question m. of 56 ("To secure...")', target: "Get more Practical Learning" }
  ];

  for (const item of items) {
    const success = await executeUniversalStep(item);
    if (!success) {
      console.log(`Failed at step ${item.id}`);
      break;
    }
  }

  await browser.close();
})();
