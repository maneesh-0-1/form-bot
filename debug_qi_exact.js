const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
  }

  // Answer through step 21 using evaluate clicks
  const steps = [
    { type: 'radio', target: 'Yes, I consent' },
    { type: 'radio', target: 'Yes' },
    { type: 'radio', target: '22–25' },
    { type: 'radio', target: 'Man' },
    { type: 'dropdown', target: 'Nepal' },
    { type: 'dropdown', target: 'Nepal' },
    { type: 'radio', target: 'Full-time student' },
    { type: 'radio', target: "Bachelor's" },
    { type: 'radio', target: 'STEM' },
    { type: 'radio', target: 'Yes, actively' },
    { type: 'radio', target: 'Mid-sized city' },
    { type: 'radio', target: 'No, but I plan to' },
    { type: 'break', target: 'Continue' },
    { type: 'rating', target: '4' },
    { type: 'rating', target: '3' },
    { type: 'ranking', target: ['Self-taught', 'Hands-on', 'Formal'] },
    { type: 'multiselect', target: ['Creative problem', 'Resilience'] },
    { type: 'radio', target: 'Daily' },
    { type: 'rating', target: '5' },
    { type: 'rating', target: '3' },
    { type: 'radio', target: 'No' },
  ];

  for (const s of steps) {
    await page.waitForTimeout(500);
    if (s.type === 'break') {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('continue')) || document.querySelector('button');
        if (btn) btn.click();
      });
      await page.keyboard.press('Enter');
    } else if (s.type === 'dropdown') {
      await page.evaluate(() => {
        const trig = document.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]');
        if (trig) trig.click();
      });
      await page.waitForTimeout(300);
      await page.keyboard.type(s.target);
      await page.waitForTimeout(300);
      await page.evaluate((val) => {
        const opts = Array.from(document.querySelectorAll('[role="option"], li'));
        const m = opts.find(o => (o.innerText || '').toLowerCase().includes(val.toLowerCase()));
        if (m) m.click();
      }, s.target);
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
      await page.keyboard.press('Enter');
    } else if (s.type === 'rating') {
      await page.keyboard.press(s.target);
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
    } else if (s.type === 'ranking' || s.type === 'multiselect') {
      await page.evaluate((items) => {
        const btns = Array.from(document.querySelectorAll('button, [role="radio"], [role="checkbox"], label'));
        for (const item of items) {
          const m = btns.find(b => (b.innerText || '').toLowerCase().includes(item.toLowerCase()));
          if (m) m.click();
        }
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      }, s.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else {
      await page.evaluate((val) => {
        const btns = Array.from(document.querySelectorAll('[role="radio"], button, [role="button"], label, div[data-qa*="choice"]'));
        const m = btns.find(b => (b.innerText || '').toLowerCase().includes(val.toLowerCase()));
        if (m) m.click();
      }, s.target);
    }
  }

  await page.waitForTimeout(1500);

  const screenshotPath = path.join(__dirname, 'debug_screenshots', 'qi_inspect.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved Qi screenshot to ${screenshotPath}`);

  const details = await page.evaluate(() => {
    const isVisible = el => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      return true;
    };

    const activeBlock = Array.from(document.querySelectorAll('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]'))
      .find(el => isVisible(el) && !el.closest('[aria-hidden="true"]'));

    const allDescendants = activeBlock ? Array.from(activeBlock.querySelectorAll('*')).map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      qa: el.getAttribute('data-qa'),
      text: (el.innerText || '').trim().slice(0, 100),
      rect: el.getBoundingClientRect()
    })).filter(e => e.role || e.qa || e.tag === 'BUTTON' || e.tag === 'INPUT' || e.tag === 'SELECT') : [];

    return {
      blockText: activeBlock ? activeBlock.innerText : 'NO ACTIVE BLOCK FOUND',
      elements: allDescendants
    };
  });

  console.log('Block text:\n', details.blockText);
  console.log('\nInteractive elements in active block:\n', JSON.stringify(details.elements, null, 2));

  await browser.close();
})();
