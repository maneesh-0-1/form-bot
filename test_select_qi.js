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

  // Answer through step 21
  const steps = [
    { target: 'Yes, I consent', radio: true },
    { target: 'Yes', radio: true },
    { target: '22–25', radio: true },
    { target: 'Man', radio: true },
    { target: 'Nepal', dropdown: true },
    { target: 'Nepal', dropdown: true },
    { target: 'Full-time student', radio: true },
    { target: "Bachelor's", radio: true },
    { target: 'STEM', radio: true },
    { target: 'Yes, actively', radio: true },
    { target: 'Mid-sized city', radio: true },
    { target: 'No, but I plan to', radio: true },
    { target: 'Continue', break: true },
    { target: '4', rating: true },
    { target: '3', rating: true },
    { target: 'Self-taught', ranking: true },
    { target: 'Creative problem', multiselect: true },
    { target: 'Daily', radio: true },
    { target: '5', rating: true },
    { target: '3', rating: true },
    { target: 'No', radio: true }
  ];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    await page.waitForTimeout(500);
    if (s.break) {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('continue')) || document.querySelector('button');
        if (btn) btn.click();
      });
      await page.keyboard.press('Enter');
    } else if (s.dropdown) {
      await page.evaluate(() => {
        const trig = document.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]');
        if (trig) trig.click();
      });
      await page.waitForTimeout(300);
      await page.keyboard.type(s.target);
      await page.waitForTimeout(400);
      await page.evaluate((val) => {
        const opts = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [data-radix-popper-content-wrapper] [role="option"], [data-radix-popper-content-wrapper] li, [data-qa*="combobox-item"], [role="option"], li'));
        const m = opts.find(o => (o.innerText || '').toLowerCase().includes(val.toLowerCase()));
        if (m) m.click();
      }, s.target);
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
      await page.keyboard.press('Enter');
    } else if (s.rating) {
      await page.evaluate((val) => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"], [role="radio"]'));
        const m = btns.find(b => (b.innerText || '').trim() === val);
        if (m) m.click();
      }, s.target);
      await page.keyboard.press(s.target);
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
      await page.keyboard.press('Enter');
    } else if (s.ranking || s.multiselect) {
      await page.evaluate((val) => {
        const btns = Array.from(document.querySelectorAll('button, [role="radio"], [role="checkbox"], label'));
        const m = btns.find(b => (b.innerText || '').toLowerCase().includes(val.toLowerCase()));
        if (m) m.click();
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      }, s.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (s.radio) {
      await page.evaluate((val) => {
        const btns = Array.from(document.querySelectorAll('[role="radio"], button, [role="button"], label, div[data-qa*="choice"]'));
        const m = btns.find(b => (b.innerText || '').toLowerCase().includes(val.toLowerCase()));
        if (m) m.click();
      }, s.target);
    }
  }

  await page.waitForTimeout(1000);
  console.log('--- Now on Qi ---');

  // Inspect the combobox trigger on Qi
  const qiAnalysis = await page.evaluate(() => {
    const isVisible = el => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      return true;
    };

    const block = Array.from(document.querySelectorAll('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]'))
      .find(el => isVisible(el) && !el.closest('[aria-hidden="true"]'));

    const trig = block ? block.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button') : null;
    return {
      blockTitle: block?.querySelector('legend, h1, h2, h3')?.innerText,
      hasTrigger: !!trig,
      triggerQA: trig?.getAttribute('data-qa'),
      triggerText: trig?.innerText
    };
  });

  console.log('Qi Analysis:\n', JSON.stringify(qiAnalysis, null, 2));

  // Now let's try clicking trigger and typing Inflation
  await page.evaluate(() => {
    const isVisible = el => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      return true;
    };
    const block = Array.from(document.querySelectorAll('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]'))
      .find(el => isVisible(el) && !el.closest('[aria-hidden="true"]'));
    const trig = block ? block.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]') : null;
    if (trig) trig.click();
  });

  await page.waitForTimeout(400);
  await page.keyboard.type('Inflation');
  await page.waitForTimeout(500);

  const popoverOptions = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[role="option"], [data-qa*="combobox-item"], li')).map(o => ({
      text: (o.innerText || '').trim(),
      role: o.getAttribute('role'),
      qa: o.getAttribute('data-qa')
    }));
  });

  console.log('Popover Options after typing "Inflation":\n', JSON.stringify(popoverOptions, null, 2));

  // Press Enter / Down Arrow
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  const afterScreen = await page.evaluate(() => {
    const isVisible = el => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      return true;
    };
    const block = Array.from(document.querySelectorAll('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]'))
      .find(el => isVisible(el) && !el.closest('[aria-hidden="true"]'));
    return block?.querySelector('legend, h1, h2, h3')?.innerText;
  });

  console.log('After selecting option, active screen is:\n', afterScreen);

  await browser.close();
})();
