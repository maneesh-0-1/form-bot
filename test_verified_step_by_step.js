const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    console.log('Clicking Start button on Welcome screen...');
    await startBtn.click();
    await page.waitForSelector('[data-qa="question-header-counter"]', { timeout: 5000 });
    await page.waitForTimeout(800);
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

      return { type: 'fallback', counter: 'none', title: clean(document.body.innerText).slice(0, 60), text: '' };
    });
  }

  async function waitForActiveBlockToChange(oldTitle, maxWaitMs = 3000) {
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

  async function stepRadio(expectedKey, target) {
    const before = await getActiveBlock();
    console.log(`\n👉 Answering Radio "${expectedKey}" with target "${target}"`);

    let clickedText = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      clickedText = await page.evaluate((val) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanT = clean(val);
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label'));
        const match = buttons.find(b => {
          const raw = b.innerText.trim();
          const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
          const btnClean = clean(withoutBadge);
          return btnClean === cleanT || btnClean.startsWith(cleanT) || btnClean.includes(cleanT) || cleanT.includes(btnClean);
        });
        if (match) {
          match.click();
          return match.innerText.trim();
        }
        return null;
      }, target);

      if (clickedText) break;
      await page.waitForTimeout(150);
    }

    console.log(`   Clicked: "${clickedText}"`);
    const after = await waitForActiveBlockToChange(before.title);
    console.log(`   After:   ${after.title}`);
    await page.waitForTimeout(300);
  }

  async function stepDropdown(expectedKey, target) {
    const before = await getActiveBlock();
    console.log(`\n👉 Answering Dropdown "${expectedKey}" with target "${target}"`);

    // Click trigger in active block
    let triggerOpened = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      triggerOpened = await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
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
      if (triggerOpened) break;
      await page.waitForTimeout(150);
    }

    await page.waitForTimeout(300);
    await page.keyboard.type(target, { delay: 40 });
    await page.waitForTimeout(400);

    const clickedOpt = await page.evaluate((val) => {
      const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
      const match = options.find(el => (el.innerText || el.textContent || '').trim() === val);
      if (match) {
        match.click();
        return match.innerText || match.textContent;
      }
      return null;
    }, target);
    console.log(`   Option clicked: ${clickedOpt}`);
    await page.waitForTimeout(300);

    // Click OK in active block
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });

    const after = await waitForActiveBlockToChange(before.title);
    console.log(`   After:   ${after.title}`);
    await page.waitForTimeout(300);
  }

  // Execute Q1 to Q12
  await stepRadio('Consent', 'Yes, I consent');
  await stepRadio('Confirmation / Qualifier', 'Yes');
  await stepRadio('Age Bracket', '22–25');
  await stepRadio('Gender', 'Man');
  await stepDropdown('Country of Origin / Residence', 'Nepal');
  await stepDropdown('Current Location / Country', 'Nepal');
  await stepRadio('Employment / Student Status', 'Full-time student');
  await stepRadio('Education Level', "Bachelor's");
  await stepRadio('Field of Study', 'STEM');
  await stepRadio('Job Search Status', 'Yes, actively');
  await stepRadio('Location / Setting', 'Mid-sized city');
  await stepRadio('Relocation / Next Plan', 'No, but I plan to');

  console.log('\n--- Reached Q13 (Section Break 1) ---');
  const q13Details = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

    return {
      buttons: Array.from(activeBlock.querySelectorAll('button')).map(b => ({ text: b.innerText.trim(), qa: b.getAttribute('data-qa') })),
      html: activeBlock.innerHTML
    };
  });
  console.log('Q13 Details:\n', JSON.stringify(q13Details, null, 2));

  // Click continue button on Q13
  const clickedBtn = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const btn = activeBlock.querySelector('button');
    if (btn) {
      btn.click();
      return btn.innerText;
    }
    return null;
  });
  console.log('Clicked in Q13:', clickedBtn);

  await page.waitForTimeout(1000);

  const s2Start = await getActiveBlock();
  console.log('\n--- Card after Q13 ---\n', s2Start);

  await browser.close();
})();
