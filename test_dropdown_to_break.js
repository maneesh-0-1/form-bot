const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(800);
  }

  async function getActiveBlock() {
    return await page.evaluate(() => {
      const clean = str => (str || '').replace(/\s+/g, ' ').trim();
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top, dist: Math.abs(el.getBoundingClientRect().top - window.innerHeight * 0.35), text: clean(el.innerText) }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
      if (counters.length > 0) {
        counters.sort((a, b) => a.dist - b.dist);
        const c = counters[0];
        const block = c.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || c.el.parentElement.parentElement;
        const titleEl = block.querySelector('[data-qa*="block-title"], legend, h1, h2, h3');
        return { type: 'question', counter: c.text, title: `Q${c.text}: ${titleEl ? clean(titleEl.innerText) : ''}` };
      }
      const st = Array.from(document.querySelectorAll('[data-qa*="statement"], [data-qa*="blocktype-statement"], [data-qa*="block-title"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top, dist: Math.abs(el.getBoundingClientRect().top - window.innerHeight * 0.35), text: clean(el.innerText) }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
      if (st.length > 0) {
        st.sort((a, b) => a.dist - b.dist);
        return { type: 'statement', counter: 'statement', title: st[0].text.slice(0, 80) };
      }
      return { type: 'fallback', counter: 'none', title: '' };
    });
  }

  const steps = [
    { id: 1, type: 'radio', target: 'Yes, I consent' },
    { id: 2, type: 'radio', target: 'Yes' },
    { id: 3, type: 'radio', target: '22–25' },
    { id: 4, type: 'radio', target: 'Man' },
    { id: 5, type: 'dropdown', target: 'Nepal' },
    { id: 6, type: 'dropdown', target: 'Nepal' },
    { id: 7, type: 'radio', target: 'Full-time student' },
    { id: 8, type: 'radio', target: "Bachelor's" },
    { id: 9, type: 'radio', target: 'STEM' },
    { id: 10, type: 'radio', target: 'Yes, actively' },
    { id: 11, type: 'radio', target: 'Mid-sized city' },
    { id: 12, type: 'radio', target: 'No, but I plan to' },
    { id: 13, type: 'break', target: 'Continue' },
    { id: 14, type: 'rating', target: '4' }
  ];

  for (let idx = 0; idx < steps.length; idx++) {
    const item = steps[idx];
    const before = await getActiveBlock();
    console.log(`\n[${idx + 1}/${steps.length}] [${item.type.toUpperCase()}] Target: "${item.target}" | Before: "${before.title}"`);

    if (item.type === 'break') {
      console.log('  Handling break...');
      for (let r = 0; r < 5; r++) {
        const btn = page.locator('button:has-text("Continue"):visible, button[data-qa*="continue"]:visible, button:has-text("OK"):visible').first();
        if (await btn.isVisible({ timeout: 500 })) {
          await btn.click({ force: true });
        }
        await page.keyboard.press('Enter');
        await page.waitForTimeout(600);
        const cur = await getActiveBlock();
        if (cur.type === 'question' && cur.title !== before.title) {
          console.log(`  Cleared break -> "${cur.title}"`);
          break;
        }
      }
      continue;
    } else if (item.type === 'dropdown') {
      const trig = page.locator('button[data-qa*="combobox-trigger"]:visible, [role="combobox"]:visible, input[placeholder*="Type or select"]:visible, button:has-text("Type or select"):visible').first();
      if (await trig.isVisible({ timeout: 800 })) {
        await trig.click({ force: true });
        await page.waitForTimeout(200);
      }
      await page.keyboard.type(item.target, { delay: 40 });
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const ok = page.locator('button[data-qa*="ok-button"]:visible, button:has-text("OK"):visible').first();
      if (await ok.isVisible({ timeout: 400 })) {
        await ok.click({ force: true });
      } else {
        await page.keyboard.press('Enter');
      }
    } else if (item.type === 'radio') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const btns = Array.from(activeBlock.querySelectorAll('button, [role="radio"], label'));
        const match = btns.find(b => (b.innerText || '').includes(val));
        if (match) match.click();
      }, item.target);
      await page.waitForTimeout(200);
      const ok = page.locator('button[data-qa*="ok-button"]:visible, button:has-text("OK"):visible').first();
      if (await ok.isVisible({ timeout: 300 })) await ok.click({ force: true });
    } else if (item.type === 'rating') {
      await page.keyboard.press(item.target);
      await page.waitForTimeout(200);
      const ok = page.locator('button[data-qa*="ok-button"]:visible, button:has-text("OK"):visible').first();
      if (await ok.isVisible({ timeout: 300 })) await ok.click({ force: true });
    }

    // Wait for screen advance
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      const cur = await getActiveBlock();
      if (cur.title !== before.title && cur.title.length > 0) {
        console.log(`  Advanced in ${(i+1)*100}ms -> "${cur.title}"`);
        break;
      }
    }
  }

  console.log('\n✅ TEST FINISHED');
  await browser.close();
})();
