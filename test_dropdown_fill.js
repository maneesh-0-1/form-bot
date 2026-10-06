const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 40 });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-qa="question-header-counter"]', { timeout: 8000 });
    await page.waitForTimeout(600);
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

  async function handleDropdown(targetVal) {
    console.log(`Handling dropdown for: "${targetVal}"`);
    // Open trigger
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
      if (trig) trig.click();
    });
    await page.waitForTimeout(400);

    const query = targetVal.split(':')[0].split(',')[0].trim();
    const searchInput = page.locator('input[placeholder*="Type or select"], input[aria-autocomplete="list"], input[type="text"]:visible').first();
    if (await searchInput.isVisible({ timeout: 1000 })) {
      await searchInput.fill(query);
    } else {
      await page.keyboard.type(query, { delay: 40 });
    }
    await page.waitForTimeout(400);

    const clicked = await page.evaluate((val) => {
      const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanV = clean(val);
      const items = Array.from(document.querySelectorAll('[role="option"], li, [data-radix-collection-item], button, [data-qa*="combobox-item"], [data-qa*="choice"]'));
      const match = items.find(el => {
        const txt = clean(el.innerText || el.textContent || '');
        return txt.startsWith(cleanV) || txt.includes(cleanV);
      });
      if (match) {
        match.click();
        return match.innerText || match.textContent;
      }
      return null;
    }, query);

    console.log(`Dropdown selection: "${clicked || 'Enter'}"`);
    if (!clicked) {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
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
    await page.keyboard.press('Enter');
  }

  // Answer Q1-4
  const radios = ['Yes, I consent', 'Yes', '22–25', 'Man'];
  for (const r of radios) {
    await page.waitForTimeout(400);
    const before = await getActiveBlock();
    console.log(`Radio on: ${before.title} -> ${r}`);
    await page.evaluate((val) => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const btn = Array.from(activeBlock.querySelectorAll('button, label')).find(b => b.innerText.includes(val));
      if (btn) btn.click();
    }, r);
    await waitForActiveBlockToChange(before.title);
  }

  // Q5 & Q6 dropdowns
  await page.waitForTimeout(400);
  let before = await getActiveBlock();
  console.log(`Q5 on: ${before.title}`);
  await handleDropdown('Nepal');
  await waitForActiveBlockToChange(before.title);

  await page.waitForTimeout(400);
  before = await getActiveBlock();
  console.log(`Q6 on: ${before.title}`);
  await handleDropdown('Nepal');
  const afterQ6 = await waitForActiveBlockToChange(before.title);
  console.log(`After Q6: ${afterQ6.title}`);

  await browser.close();
})();
