const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  async function getActiveCounter() {
    return await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { text: el.innerText.trim(), top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35) };
        })
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
      if (counters.length === 0) return 'statement';
      counters.sort((a, b) => a.dist - b.dist);
      return counters[0].text;
    });
  }

  async function answerRadio(expectedQ, choiceText) {
    console.log(`\nAnswering Q${expectedQ} with "${choiceText}"...`);
    const counterBefore = await getActiveCounter();
    console.log(`  Counter before: Q${counterBefore}`);

    await page.evaluate((val) => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const btns = Array.from(activeBlock.querySelectorAll('button, [role="radio"], label'));
      const match = btns.find(b => b.innerText.includes(val));
      if (match) match.click();
    }, choiceText);

    // Wait and check if OK button is in THIS active block
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });

    // Wait for screen to advance
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      const counterAfter = await getActiveCounter();
      if (counterAfter !== counterBefore) {
        console.log(`  Screen advanced from Q${counterBefore} -> Q${counterAfter}`);
        return;
      }
    }
    console.log(`  WARNING: Did not advance from Q${counterBefore}`);
  }

  async function answerDropdown(expectedQ, queryText) {
    console.log(`\nAnswering Q${expectedQ} Dropdown with "${queryText}"...`);
    const counterBefore = await getActiveCounter();
    console.log(`  Counter before: Q${counterBefore}`);

    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const trigger = activeBlock.querySelector('button[data-qa*="combobox-trigger"], button');
      if (trigger) trigger.click();
    });
    await page.waitForTimeout(300);

    await page.keyboard.type(queryText, { delay: 40 });
    await page.waitForTimeout(400);

    await page.evaluate((val) => {
      const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
      const match = options.find(el => (el.innerText || el.textContent || '').trim() === val);
      if (match) match.click();
    }, queryText);
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });

    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      const counterAfter = await getActiveCounter();
      if (counterAfter !== counterBefore) {
        console.log(`  Screen advanced from Q${counterBefore} -> Q${counterAfter}`);
        return;
      }
    }
  }

  // Section 1: Q1 to Q12
  await answerRadio(1, 'Yes, I consent');
  await answerRadio(2, 'Yes');
  await answerRadio(3, '22–25');
  await answerRadio(4, 'Man');
  await answerDropdown(5, 'Nepal');
  await answerDropdown(6, 'Nepal');
  await answerRadio(7, 'Full-time student');
  await answerRadio(8, "Bachelor's");
  await answerRadio(9, 'STEM');
  await answerRadio(10, 'Yes');
  await answerRadio(11, 'Mid-sized city');
  await answerRadio(12, 'No, but I plan to');

  console.log('\n--- Checking after Q12 (Section Break 1) ---');
  await page.waitForTimeout(500);
  const after12 = await page.evaluate(() => {
    return document.body.innerText.slice(0, 200);
  });
  console.log('Screen after Q12:\n', after12);

  await browser.close();
})();
