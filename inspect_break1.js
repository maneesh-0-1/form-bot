const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(1000);
  }

  // Answer Section 1
  const s1 = [
    { t: 'radio', v: 'Yes, I consent' },
    { t: 'radio', v: 'Yes' },
    { t: 'radio', v: '22–25' },
    { t: 'radio', v: 'Man' },
    { t: 'dropdown', v: 'Nepal' },
    { t: 'dropdown', v: 'Nepal' },
    { t: 'radio', v: 'Full-time student' },
    { t: 'radio', v: "Bachelor's" },
    { t: 'radio', v: 'STEM' },
    { t: 'radio', v: 'Yes, actively' },
    { t: 'radio', v: 'Mid-sized city' },
    { t: 'radio', v: 'No, but I plan to' }
  ];

  for (const it of s1) {
    if (it.t === 'radio') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const btns = Array.from(activeBlock.querySelectorAll('button, label'));
        const match = btns.find(b => b.innerText.includes(val));
        if (match) match.click();
      }, it.v);
      await page.waitForTimeout(600);
    } else {
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
      await page.keyboard.type(it.v, { delay: 40 });
      await page.waitForTimeout(400);
      await page.evaluate((val) => {
        const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
        const match = options.find(el => (el.innerText || el.textContent || '').trim() === val);
        if (match) match.click();
      }, it.v);
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

  console.log('--- At Item 13 (Section Break 1) ---');
  const domDump = await page.evaluate(() => {
    return {
      bodyText: document.body.innerText,
      buttons: Array.from(document.querySelectorAll('button, a, [role="button"]')).map(b => ({
        text: b.innerText.trim().replace(/\s+/g, ' '),
        qa: b.getAttribute('data-qa'),
        visible: b.getBoundingClientRect().top >= 0 && b.getBoundingClientRect().top < window.innerHeight
      })).filter(b => b.visible)
    };
  });
  console.log('DOM Dump at Item 13:', JSON.stringify(domDump, null, 2));

  // Try clicking the button shown on screen
  const cont = page.locator('button:has-text("Continue"), button:has-text("OK"), button[data-qa*="button"]').first();
  console.log('Found button count:', await cont.count());
  if (await cont.count() > 0) {
    console.log('Button text:', await cont.innerText());
    await cont.click({ force: true });
  }

  await page.waitForTimeout(1000);

  const nextDOM = await page.evaluate(() => {
    return {
      body: document.body.innerText.slice(0, 300),
      counters: Array.from(document.querySelectorAll('[data-qa="question-header-counter"]')).map(c => c.innerText.trim())
    };
  });
  console.log('Next DOM after clicking button:\n', JSON.stringify(nextDOM, null, 2));

  await browser.close();
})();
