const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

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

      const statements = Array.from(document.querySelectorAll('[data-qa*="statement"], [data-qa*="blocktype-statement"], [data-qa*="block-title"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText) };
        })
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);

      if (statements.length > 0) {
        statements.sort((a, b) => a.dist - b.dist);
        return {
          type: 'statement',
          counter: 'statement',
          title: statements[0].text.slice(0, 80),
          text: statements[0].text.slice(0, 150)
        };
      }

      return { type: 'fallback', counter: 'none', title: '', text: '' };
    });
  }

  async function step(item) {
    const before = await getActiveBlock();
    console.log(`\n--> [${item.type.toUpperCase()}] ${item.key} | Target: "${item.target}"`);
    console.log(`    Before: ${before.title}`);

    // Section break
    if (item.type === 'break') {
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector('button[data-qa*="ok-button"], button[data-qa*="continue"], button');
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (!clicked) await page.keyboard.press('Enter');
    }
    // Dropdown
    else if (item.type === 'dropdown' || item.type === 'dropdown_or_choice') {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const trigger = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
        if (trigger) trigger.click();
      });
      await page.waitForTimeout(300);
      await page.keyboard.type(item.target, { delay: 40 });
      await page.waitForTimeout(400);

      await page.evaluate((val) => {
        const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
        const match = options.find(el => (el.innerText || el.textContent || '').trim() === val);
        if (match) match.click();
      }, item.target);
      await page.waitForTimeout(300);

      // Click OK for dropdown
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
    }
    // All other question types
    else {
      const domAction = await page.evaluate(async ({ itemType, targetVal }) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        // Rating
        if (itemType === 'rating' || /^[0-9]$/.test(targetVal)) {
          const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [data-qa*="rating"]'));
          const match = buttons.find(b => {
            const txt = b.innerText.trim();
            return txt === targetVal || txt.startsWith(targetVal + '\n') || b.getAttribute('data-qa')?.includes(`rating-${targetVal}`);
          });
          if (match) {
            match.click();
            const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
            if (ok) ok.click();
            return { action: 'clicked_rating' };
          }
          return { action: 'press_key', key: targetVal };
        }

        // Multi-select / Ranking
        if (itemType === 'ranking' || itemType === 'multiselect') {
          const parts = targetVal.split(',').map(s => s.trim()).filter(Boolean);
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
          const ok = activeBlock.querySelector('button[data-qa*="ok-button"], button[data-qa*="continue"]');
          if (ok) ok.click();
          return { action: 'multiselect' };
        }

        // Radio
        if (itemType === 'radio' || itemType === 'choice_or_rating' || itemType === 'text_or_choice') {
          const cleanT = clean(targetVal);
          const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label'));
          const match = buttons.find(b => {
            const raw = b.innerText.trim();
            const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
            const btnClean = clean(withoutBadge);
            return btnClean === cleanT || btnClean.startsWith(cleanT) || btnClean.includes(cleanT) || cleanT.includes(btnClean);
          });
          if (match) {
            match.click();
            return { action: 'clicked_radio', text: match.innerText };
          }
        }

        // Text
        const input = activeBlock.querySelector('textarea, input[type="text"], input:not([type="hidden"])');
        if (input) {
          return { action: 'fill_text' };
        }

        return { action: 'no_match' };
      }, { itemType: item.type, targetVal: item.target });

      if (domAction.action === 'press_key') {
        await page.keyboard.press(domAction.key);
      } else if (domAction.action === 'fill_text') {
        const input = page.locator('textarea:visible, input[type="text"]:visible, input:not([type="hidden"]):visible').first();
        if (await input.isVisible({ timeout: 500 })) {
          await input.fill(item.target);
          await page.waitForTimeout(150);
          await page.keyboard.press('Enter');
        }
      }
    }

    // Wait for screen advance
    for (let i = 0; i < 25; i++) {
      await page.waitForTimeout(100);
      const after = await getActiveBlock();
      if (after.title !== before.title && after.title.length > 0) {
        console.log(`    After:  ${after.title} (Advanced in ${(i+1)*100}ms)`);
        await page.waitForTimeout(300);
        return true;
      }
    }

    // If lingered, try recovery
    console.log(`    Lingering, clicking OK/Enter recovery...`);
    const ok = page.locator('button[data-qa*="ok-button"], button:has-text("OK")').first();
    if (await ok.isVisible({ timeout: 400 })) {
      await ok.click({ force: true });
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(500);
    const finalAfter = await getActiveBlock();
    console.log(`    After recovery: ${finalAfter.title}`);
    return finalAfter.title !== before.title;
  }

  // Run first 20 items to verify
  const itemsToTest = [
    { id: 1, type: 'radio', key: "Consent", target: "Yes, I consent" },
    { id: 2, type: 'radio', key: "Confirmation / Qualifier", target: "Yes" },
    { id: 3, type: 'radio', key: "Age Bracket", target: "22–25" },
    { id: 4, type: 'radio', key: "Gender", target: "Man" },
    { id: 5, type: 'dropdown', key: "Country of Origin / Residence", target: "Nepal" },
    { id: 6, type: 'dropdown', key: "Current Location / Country", target: "Nepal" },
    { id: 7, type: 'radio', key: "Employment / Student Status", target: "Full-time student" },
    { id: 8, type: 'radio', key: "Education Level", target: "Bachelor's" },
    { id: 9, type: 'radio', key: "Field of Study", target: "STEM" },
    { id: 10, type: 'radio', key: "Job Search Status", target: "Yes, actively" },
    { id: 11, type: 'radio', key: "Location / Setting", target: "Mid-sized city" },
    { id: 12, type: 'radio', key: "Relocation / Next Plan", target: "No, but I plan to" },
    { id: 13, type: 'break', key: "Section Break 1", target: "Continue" },
    { id: 14, type: 'rating', key: "How prepared do you feel for...", target: "4" },
    { id: 15, type: 'rating', key: "To what extent does your...", target: "3" },
    { id: 16, type: 'ranking', key: "Question c. of 22 (Rank / Priority)", target: "Self-taught learning (Online), Hands-on experience (Previous)" },
    { id: 17, type: 'multiselect', key: 'Question d. of 22 ("Which human...")', target: "Creative problem-solving, Resilience, Cross-cultural collaboration" },
    { id: 18, type: 'radio', key: "Frequency / AI or Tool usage", target: "Daily" },
    { id: 19, type: 'rating', key: "How concerned are you about...", target: "5" },
    { id: 20, type: 'rating', key: "How strongly do you agree: Traditional employment", target: "3" }
  ];

  for (const it of itemsToTest) {
    await step(it);
  }

  await page.waitForTimeout(2000);
  await browser.close();
})();
