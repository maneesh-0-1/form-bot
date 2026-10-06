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

  async function handleDropdown(targetVal) {
    console.log(`\nHandling dropdown for target: "${targetVal}"`);
    // 1. Open trigger
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

    // 2. Type query
    const searchQuery = targetVal.split(':')[0].split(',')[0].trim();
    console.log(`Typing search query: "${searchQuery}"`);
    await page.keyboard.type(searchQuery, { delay: 40 });
    await page.waitForTimeout(400);

    // 3. Match option
    const result = await page.evaluate((val) => {
      const v = val.toLowerCase().trim();
      const allOptions = Array.from(document.querySelectorAll('[role="option"], li, [data-radix-collection-item], [data-qa*="combobox-item"], span, div'))
        .filter(el => el.children.length === 0 && (el.innerText || el.textContent || '').trim());

      // Try exact
      let match = allOptions.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === v);
      // Try startsWith
      if (!match) match = allOptions.find(el => (el.innerText || el.textContent || '').trim().toLowerCase().startsWith(v));
      // Try includes
      if (!match) match = allOptions.find(el => (el.innerText || el.textContent || '').trim().toLowerCase().includes(v));

      if (match) {
        const clickable = match.closest('[role="option"], li, [data-radix-collection-item], button') || match;
        clickable.click();
        return { matched: true, text: match.innerText || match.textContent };
      }
      return { matched: false, count: allOptions.length };
    }, searchQuery);

    console.log('Option match result:', result);
    await page.waitForTimeout(300);

    // 4. Click OK in active block
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
    await page.waitForTimeout(600);
  }

  // Answer Q1-4
  const radios = ['Yes, I consent', 'Yes', '22–25', 'Man'];
  for (const r of radios) {
    await page.evaluate((val) => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const btn = Array.from(activeBlock.querySelectorAll('button, label')).find(b => b.innerText.includes(val));
      if (btn) btn.click();
    }, r);
    await page.waitForTimeout(700);
  }

  // Test Q5 dropdown (Nepal)
  await handleDropdown('Nepal');

  // Test Q6 dropdown (Nepal)
  await handleDropdown('Nepal');

  const curTitle = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return activeBlock.innerText.slice(0, 100);
  });
  console.log('\nScreen after Q5 and Q6 dropdowns:\n', curTitle);

  await browser.close();
})();
