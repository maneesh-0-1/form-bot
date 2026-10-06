const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 30 });
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

  async function waitForScrollToStop() {
    let prevTop = -9999;
    for (let i = 0; i < 20; i++) {
      const top = await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => Math.round(el.getBoundingClientRect().top))
          .filter(t => t >= -50 && t < window.innerHeight);
        return counters.length > 0 ? counters[0] : 0;
      });
      if (prevTop !== -9999 && Math.abs(top - prevTop) === 0) {
        break;
      }
      prevTop = top;
      await page.waitForTimeout(70);
    }
  }

  async function getActiveBlock() {
    await waitForScrollToStop();
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

  async function handleDropdown(targetVal) {
    await waitForScrollToStop();
    // 1. Open trigger in active block
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
      if (trig) trig.click();
    });
    await page.waitForTimeout(350);

    // 2. Type query
    const query = targetVal.split(':')[0].split(',')[0].trim();
    const searchInput = page.locator('input[placeholder*="Type or select"], input[aria-autocomplete="list"], input[type="text"]:visible').first();
    if (await searchInput.isVisible({ timeout: 800 })) {
      await searchInput.fill(query);
    } else {
      await page.keyboard.type(query, { delay: 30 });
    }
    await page.waitForTimeout(350);

    // 3. Click option in list
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

    if (!clicked) {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(300);

    // 4. Click OK in active block
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

  // Radios Q1-4
  const radios = ['Yes, I consent', 'Yes', '22–25', 'Man'];
  for (const r of radios) {
    const cur = await getActiveBlock();
    console.log(`Q on: ${cur.title} -> select ${r}`);
    await page.evaluate((val) => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const btn = Array.from(activeBlock.querySelectorAll('button, label')).find(b => b.innerText.includes(val));
      if (btn) btn.click();
    }, r);
  }

  // Q5 & Q6
  const q5 = await getActiveBlock();
  console.log(`Q5 on: ${q5.title}`);
  await handleDropdown('Nepal');

  const q6 = await getActiveBlock();
  console.log(`Q6 on: ${q6.title}`);
  await handleDropdown('Nepal');

  const q7 = await getActiveBlock();
  console.log(`Q7 on: ${q7.title}`);

  await browser.close();
})();
