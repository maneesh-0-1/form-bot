const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(1000);
  }

  async function getActiveCard() {
    return await page.evaluate(() => {
      const clean = str => (str || '').replace(/\s+/g, ' ').trim();
      // Find all blocks/counters
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
          counter: activeCounter.text,
          title: `Q${activeCounter.text}: ${titleEl ? clean(titleEl.innerText) : ''}`,
          text: clean(blockEl.innerText).slice(0, 150)
        };
      }

      // Statement screens
      const statements = Array.from(document.querySelectorAll('[data-qa*="statement"], [data-qa*="blocktype-statement"], [data-qa*="block-title"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText) };
        })
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);

      if (statements.length > 0) {
        statements.sort((a, b) => a.dist - b.dist);
        return {
          counter: 'statement',
          title: statements[0].text.slice(0, 80),
          text: statements[0].text.slice(0, 150)
        };
      }

      return { counter: 'none', title: clean(document.body.innerText).slice(0, 60), text: '' };
    });
  }

  async function executeCard(item) {
    const before = await getActiveCard();
    console.log(`\n========================================`);
    console.log(`Step ${item.id}: [${item.type.toUpperCase()}] "${item.key}" -> Target: "${item.target}"`);
    console.log(`  Active before: ${before.title}`);

    if (item.type === 'break') {
      const contBtn = page.locator('button[data-qa*="continue"], button[data-qa*="ok-button"], button:has-text("Continue"), button:has-text("Next")').first();
      if (await contBtn.isVisible({ timeout: 1000 })) {
        await contBtn.click({ force: true });
      } else {
        await page.keyboard.press('Enter');
      }
    } else if (item.type === 'dropdown') {
      // Find combobox trigger in active block
      let triggerFound = false;
      for (let retries = 0; retries < 5; retries++) {
        triggerFound = await page.evaluate(() => {
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
          const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
          if (trig) {
            trig.click();
            return true;
          }
          return false;
        });
        if (triggerFound) break;
        await page.waitForTimeout(200);
      }

      console.log('  Trigger opened:', triggerFound);
      await page.waitForTimeout(300);
      await page.keyboard.type(item.target, { delay: 40 });
      await page.waitForTimeout(400);

      // Select option
      const selected = await page.evaluate((val) => {
        const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
        const match = options.find(el => (el.innerText || el.textContent || '').trim() === val);
        if (match) {
          match.click();
          return match.innerText || match.textContent;
        }
        return null;
      }, item.target);
      console.log('  Option clicked:', selected);
      await page.waitForTimeout(300);

      // Click OK in active block
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
    } else {
      // Radio, Rating, Ranking, Multi-select, Text
      let actionResult = null;
      for (let retries = 0; retries < 8; retries++) {
        actionResult = await page.evaluate(async ({ itemType, targetVal, targets }) => {
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
              return { action: 'clicked_rating', text: match.innerText };
            }
            return { action: 'press_key', key: targetVal };
          }

          // Multiselect / Ranking
          if (itemType === 'ranking' || itemType === 'multiselect') {
            const parts = targetVal.split(',').map(s => s.trim()).filter(Boolean);
            const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="checkbox"], [role="button"], label'));
            let anyMatch = false;
            for (const part of parts) {
              const cleanPart = clean(part);
              const match = buttons.find(b => {
                const raw = b.innerText.trim();
                const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
                const btnClean = clean(withoutBadge);
                return btnClean.includes(cleanPart) || cleanPart.includes(btnClean) || btnClean.includes(cleanPart.slice(0, 10));
              });
              if (match) {
                match.click();
                anyMatch = true;
              }
            }
            if (anyMatch) {
              const ok = activeBlock.querySelector('button[data-qa*="ok-button"], button[data-qa*="continue"]');
              if (ok) ok.click();
              return { action: 'multiselect_clicked' };
            }
            return null;
          }

          // Radio
          if (itemType === 'radio' || itemType === 'choice_or_rating' || itemType === 'text_or_choice' || itemType === 'dropdown_or_choice') {
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
                return { action: 'clicked_radio', text: match.innerText };
              }
            }
            return null;
          }

          // Text
          const input = activeBlock.querySelector('textarea, input[type="text"], input:not([type="hidden"])');
          if (input) {
            return { action: 'fill_text' };
          }

          return null;
        }, { itemType: item.type, targetVal: item.target, targets: item.altTargets ? [item.target, ...item.altTargets] : [item.target] });

        if (actionResult) break;
        await page.waitForTimeout(200);
      }

      console.log('  Action result:', actionResult);

      if (actionResult?.action === 'press_key') {
        await page.keyboard.press(actionResult.key);
      } else if (actionResult?.action === 'fill_text') {
        const input = page.locator('textarea:visible, input[type="text"]:visible, input:not([type="hidden"]):visible').first();
        if (await input.isVisible({ timeout: 500 })) {
          await input.fill(item.target);
          await page.waitForTimeout(150);
          await page.keyboard.press('Enter');
        }
      }
    }

    // Wait for screen to advance and settle
    for (let i = 0; i < 25; i++) {
      await page.waitForTimeout(100);
      const after = await getActiveCard();
      if (after.title !== before.title && after.title.length > 0) {
        console.log(`  Advanced to: ${after.title} (in ${(i+1)*100}ms)`);
        await page.waitForTimeout(300);
        return true;
      }
    }

    // Recovery if needed
    console.log(`  Lingering, attempting recovery...`);
    const ok = page.locator('button[data-qa*="ok-button"], button:has-text("OK"), button:has-text("Continue")').first();
    if (await ok.isVisible({ timeout: 400 })) {
      const txt = (await ok.innerText()).toLowerCase();
      if (!txt.includes('submit')) await ok.click({ force: true });
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(600);
    const afterRec = await getActiveCard();
    console.log(`  After recovery: ${afterRec.title}`);
    return afterRec.title !== before.title;
  }

  // Run first 26 items (Section 1 and Section 2)
  const items = [
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
    { id: 20, type: 'rating', key: "How strongly do you agree: Traditional employment", target: "3" },
    { id: 21, type: 'radio', key: "Qualifier question", target: "No" },
    { id: 22, type: 'text_or_choice', key: "Key Challenge / Goal", target: "Finding a first job" },
    { id: 23, type: 'radio', key: "Skill / Training interest", target: "No, but I want to" },
    { id: 24, type: 'multiselect', key: 'Question k. of 56 ("What is the...")', target: "My education covers it, Lack of time, I don't know what skills I" },
    { id: 25, type: 'rating', key: "Scale / Score", target: "3" },
    { id: 26, type: 'text', key: 'Question m. of 56 ("To secure...")', target: "Get more Practical Learning" },
    { id: 27, type: 'break', key: "Section Break 2", target: "Continue" }
  ];

  for (const it of items) {
    await executeCard(it);
  }

  await browser.close();
})();
