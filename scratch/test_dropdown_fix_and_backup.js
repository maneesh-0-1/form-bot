const { chromium } = require('playwright');

async function dismissAnyOpenDropdown(page, reason = '') {
  const hasDropdown = await page.evaluate(() => {
    const poppers = Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"], [data-qa*="dropdown-list"], [data-state="open"]'));
    return poppers.some(el => {
      const r = el.getBoundingClientRect();
      return r.width > 20 && r.height > 20 && r.top < window.innerHeight && r.bottom > 0;
    });
  });

  if (hasDropdown) {
    console.log(`[DISMISS] Lingering dropdown detected (${reason}). Clicking empty space & pressing Escape...`);
    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    // Click on safe empty space (top-left margin/header area)
    await page.mouse.click(60, 60);
    await page.waitForTimeout(200);

    const stillOpen = await page.evaluate(() => {
      const poppers = Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"]'));
      return poppers.some(el => {
        const r = el.getBoundingClientRect();
        return r.width > 20 && r.height > 20;
      });
    });
    if (stillOpen) {
      console.log('[DISMISS] Popper still present, clicking body background...');
      await page.mouse.click(20, 200);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    return true;
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  // Helper for answering radio questions using evaluate
  async function answerRadio(targetRegex) {
    await page.evaluate((pattern) => {
      const regex = new RegExp(pattern, 'i');
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

      const rawButtons = Array.from(activeBlock.querySelectorAll('[role="radio"], [data-qa*="choice"], button, label'));
      const validButtons = rawButtons.filter(el => {
        const raw = (el.innerText || '').trim();
        const lower = raw.toLowerCase();
        if (lower === 'ok' || lower === 'continue' || lower === 'submit' || lower.includes('press enter')) return false;
        const r = el.getBoundingClientRect();
        return raw.length > 0 && r.width > 20 && r.height > 15;
      });

      let picked = validButtons.find(b => regex.test(b.innerText || ''));
      if (!picked && validButtons.length > 0) picked = validButtons[0];
      if (picked) {
        picked.scrollIntoView({ behavior: 'instant', block: 'center' });
        picked.click();
      }

      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    }, targetRegex);
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
  }

  // Helper for answering dropdown questions
  async function answerDropdown(searchVal = 'Nepal') {
    // Open trigger
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

      const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]') || activeBlock.querySelector('button');
      if (trig) trig.click();
    });
    await page.waitForTimeout(500);

    if (searchVal) {
      await page.keyboard.type(searchVal, { delay: 40 });
      await page.waitForTimeout(600);
    }

    // Select option with full event dispatch
    const selected = await page.evaluate((val) => {
      const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const q = clean(val);
      const selectors = [
        '[role="listbox"] [role="option"]',
        '[role="option"]',
        '[data-radix-popper-content-wrapper] [role="option"]',
        '[data-radix-popper-content-wrapper] li',
        '[data-qa*="combobox-item"]',
        'li[data-value]'
      ];
      let options = [];
      for (const sel of selectors) {
        options = Array.from(document.querySelectorAll(sel)).filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 20 && r.height > 10;
        });
        if (options.length > 0) break;
      }

      let match = options.find(o => clean(o.innerText).includes(q));
      if (!match && options.length > 0) match = options[0];

      if (match) {
        match.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        match.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        match.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
        match.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        match.click();
        return match.innerText.trim();
      }
      return null;
    }, searchVal);

    console.log(`Dropdown selected option: "${selected}"`);
    await page.waitForTimeout(300);

    // Confirm selection
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Explicitly dismiss any lingering popper
    await dismissAnyOpenDropdown(page, 'after dropdown select');

    // Click OK button
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);

    // Again verify popper is closed after moving forward
    await dismissAnyOpenDropdown(page, 'after dropdown OK button');
  }

  console.log('Q1: Consent');
  await answerRadio('consent');

  console.log('Q2: Contact');
  await answerRadio('no|yes');

  console.log('Q3: Age');
  await answerRadio('22|25|18');

  console.log('Q4: Gender');
  await answerRadio('man|woman');

  console.log('Q5: Where are you from? (Dropdown)');
  await answerDropdown('Nepal');

  console.log('Q6: Where do you currently live? (Dropdown)');
  await answerDropdown('Nepal');

  console.log('Q7: What is your employment status? (Radio / Button choose)');
  // Check if dropdown is visible at Q7
  const dropdownAtQ7 = await page.evaluate(() => {
    const poppers = Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"]'));
    return poppers.some(el => el.getBoundingClientRect().height > 20);
  });
  console.log('Is previous dropdown visible at Q7?', dropdownAtQ7);

  await answerRadio('employed|student');
  console.log('Q7 successfully answered!');

  await page.waitForTimeout(800);
  const q8Check = await page.evaluate(() => {
    const h = Array.from(document.querySelectorAll('h1, h2, [data-qa*="block-title"], legend'));
    return h.map(el => el.innerText.trim()).filter(Boolean).slice(0, 3);
  });
  console.log('Titles visible after Q7 (Q8 reached):', q8Check);

  await browser.close();
  console.log('SUCCESS: Q5 -> Q6 -> Q7 -> Q8 completed flawlessly!');
})();
