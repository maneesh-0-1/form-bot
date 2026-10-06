const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  // Advance through Section 1
  const s1Answers = [
    { t: 'radio', v: 'Yes, I consent' },
    { t: 'radio', v: 'Yes' },
    { t: 'radio', v: '22–25' },
    { t: 'radio', v: 'Man' },
    { t: 'drop', v: 'Nepal' },
    { t: 'drop', v: 'Nepal' },
    { t: 'radio', v: 'Full-time student' },
    { t: 'radio', v: "Bachelor's" },
    { t: 'radio', v: 'STEM' },
    { t: 'radio', v: 'Yes' },
    { t: 'radio', v: 'Mid-sized city' },
    { t: 'radio', v: 'No, but I plan to' }
  ];

  for (const item of s1Answers) {
    if (item.t === 'radio') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const btns = Array.from(activeBlock.querySelectorAll('button, label'));
        const match = btns.find(b => b.innerText.includes(val));
        if (match) match.click();
      }, item.v);
      await page.waitForTimeout(600);
    } else {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const trigger = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
        if (trigger) trigger.click();
      });
      await page.waitForTimeout(300);
      await page.keyboard.type(item.v, { delay: 40 });
      await page.waitForTimeout(400);
      await page.evaluate((val) => {
        const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
        const match = options.find(el => (el.innerText || el.textContent || '').trim() === val);
        if (match) match.click();
      }, item.v);
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
      await page.waitForTimeout(600);
    }
  }

  console.log('--- At Section Break 1 ---');
  const breakInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top < window.innerHeight;
      })
      .map(el => ({
        tag: el.tagName,
        qa: el.getAttribute('data-qa'),
        role: el.getAttribute('role'),
        text: el.innerText ? el.innerText.trim().replace(/\s+/g, ' ') : ''
      }))
      .filter(el => el.tag === 'BUTTON' || el.qa || el.role);
    return all;
  });
  console.log('Break 1 visible buttons/elements:');
  console.log(JSON.stringify(breakInfo, null, 2));

  // Click continue button on Section Break 1
  const continueBtn = page.locator('button[data-qa*="continue-button"], button[data-qa*="ok-button"], button:has-text("Continue"), button:has-text("Next")').first();
  console.log('Continue button visible:', await continueBtn.isVisible());
  if (await continueBtn.isVisible()) {
    await continueBtn.click({ force: true });
    console.log('Clicked continue button!');
  } else {
    await page.keyboard.press('Enter');
    console.log('Pressed Enter');
  }

  await page.waitForTimeout(1000);

  const afterBreak = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => ({ text: el.innerText.trim(), top: Math.round(el.getBoundingClientRect().top) }));
    return {
      body: document.body.innerText.slice(0, 300),
      counters
    };
  });
  console.log('\nAfter Section Break 1:\n', JSON.stringify(afterBreak, null, 2));

  await browser.close();
})();
