const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  // Helper to click choice
  async function clickChoice(matchText) {
    await page.evaluate((txt) => {
      const btns = Array.from(document.querySelectorAll('button, [role="radio"], [role="button"], label'));
      const b = btns.find(el => el.innerText && el.innerText.includes(txt));
      if (b) b.click();
    }, matchText);
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
  }

  // Helper to close any open dropdown poppers
  async function closeAnyDropdownPopper() {
    const isPopperOpen = await page.evaluate(() => {
      const poppers = Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"], [data-qa*="dropdown-list"]'));
      return poppers.some(p => {
        const r = p.getBoundingClientRect();
        return r.width > 20 && r.height > 20;
      });
    });

    if (isPopperOpen) {
      console.log('Detected open dropdown popper! Clicking empty space & pressing Escape...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      await page.mouse.click(60, 60); // Click top-left empty space
      await page.waitForTimeout(250);
    }
  }

  // Helper to handle dropdown question
  async function handleDropdown(searchVal = 'Nepal') {
    // Check & click combobox trigger
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          const blockEl = el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || el.parentElement.parentElement;
          return { el, blockEl, dist: Math.abs(rect.top - window.innerHeight * 0.35) };
        });
      counters.sort((a, b) => a.dist - b.dist);
      const activeBlock = counters[0]?.blockEl || document.body;
      const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]') || activeBlock.querySelector('button');
      if (trig) trig.click();
    });
    await page.waitForTimeout(500);

    if (searchVal) {
      await page.keyboard.type(searchVal, { delay: 40 });
      await page.waitForTimeout(500);
    }

    // Select option
    const picked = await page.evaluate((val) => {
      const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const q = clean(val);
      const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [role="option"], [data-radix-popper-content-wrapper] [role="option"], [data-qa*="combobox-item"], li'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 20 && r.height > 10;
        });

      if (options.length > 0) {
        let match = options.find(o => clean(o.innerText).includes(q));
        if (!match) match = options[0];
        // Dispatch full mouse/pointer events so Radix UI receives it
        match.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        match.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        match.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
        match.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        match.click();
        return match.innerText.trim();
      }
      return null;
    }, searchVal);

    console.log(`Dropdown selected: "${picked}"`);
    await page.waitForTimeout(300);

    // If Enter can select, press Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Ensure popper is closed
    await closeAnyDropdownPopper();

    // Click OK button
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          const blockEl = el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || el.parentElement.parentElement;
          return { el, blockEl, dist: Math.abs(rect.top - window.innerHeight * 0.35) };
        });
      counters.sort((a, b) => a.dist - b.dist);
      const activeBlock = counters[0]?.blockEl || document.body;
      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);

    // Ensure popper is completely gone after moving forward
    await closeAnyDropdownPopper();
  }

  console.log('Step 1: Consent');
  await clickChoice('Yes, I consent');

  console.log('Step 2: Qualifier');
  await clickChoice('Yes');

  console.log('Step 3: Age');
  await clickChoice('22–25');

  console.log('Step 4: Gender');
  await clickChoice('Woman');

  console.log('Step 5: Q5 (Country 1 - Where are you from?)');
  await handleDropdown('Nepal');

  console.log('Step 6: Q6 (Country 2 - Where do you currently live?)');
  await handleDropdown('Nepal');

  console.log('Step 7: Q7 (Employment status - Radio / Button choose)');
  // Check if dropdown popper is visible on Q7
  const popperVisibleOnQ7 = await page.evaluate(() => {
    const poppers = Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"], [data-qa*="dropdown-list"]'));
    return poppers.some(p => {
      const r = p.getBoundingClientRect();
      return r.width > 20 && r.height > 20;
    });
  });
  console.log('Is dropdown popper visible on Q7 screen?', popperVisibleOnQ7);

  // Read active question text
  const q7Text = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('Q7 Screen Text:\n', q7Text);

  // Click choice on Q7
  await clickChoice('Employed full-time');
  console.log('Successfully clicked choice on Q7!');

  await page.waitForTimeout(800);
  const q8Text = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('Q8 Screen Text after Q7:\n', q8Text);

  await browser.close();
  console.log('Test completed successfully!');
})();
