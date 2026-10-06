const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }

  // Answer 1..21
  const steps = [
    { target: 'Yes, I consent' },
    { target: 'Yes' },
    { target: '22–25' },
    { target: 'Man' },
    { target: 'Nepal', dropdown: true },
    { target: 'Nepal', dropdown: true },
    { target: 'Full-time student' },
    { target: "Bachelor's" },
    { target: 'STEM' },
    { target: 'Yes, actively' },
    { target: 'Mid-sized city' },
    { target: 'No, but I plan to' },
    { break: true },
    { rating: '4' },
    { rating: '3' },
    { ranking: ['Self-taught', 'Hands-on'] },
    { multiselect: ['Creative problem', 'Resilience'] },
    { target: 'Daily' },
    { rating: '5' },
    { rating: '3' },
    { target: 'No' },
  ];

  for (const s of steps) {
    await page.waitForTimeout(400);
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
      await page.waitForTimeout(200);
      await page.keyboard.type(s.target);
      await page.waitForTimeout(300);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
      await page.keyboard.press('Enter');
    } else if (s.rating) {
      await page.keyboard.press(s.rating);
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
      await page.keyboard.press('Enter');
    } else if (s.ranking || s.multiselect) {
      const items = s.ranking || s.multiselect;
      await page.evaluate((arr) => {
        const btns = Array.from(document.querySelectorAll('button, [role="radio"], [role="checkbox"], label'));
        for (const item of arr) {
          const m = btns.find(b => (b.innerText || '').toLowerCase().includes(item.toLowerCase()));
          if (m) m.click();
        }
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      }, items);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else {
      await page.evaluate((val) => {
        const btns = Array.from(document.querySelectorAll('[role="radio"], button, [role="button"], label, div[data-qa*="choice"]'));
        const m = btns.find(b => (b.innerText || '').toLowerCase().includes(val.toLowerCase()));
        if (m) m.click();
      }, s.target);
      await page.waitForTimeout(200);
    }
  }

  await page.waitForTimeout(1000);
  console.log('=== Qi Live DOM Dump ===');
  const dump = await page.evaluate(() => {
    const isVisible = el => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      return true;
    };

    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

    const btns = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="combobox"], [role="button"], input')).map(b => ({
      tag: b.tagName,
      role: b.getAttribute('role'),
      qa: b.getAttribute('data-qa'),
      text: (b.innerText || b.value || '').trim()
    }));

    return {
      activeBlockText: activeBlock.innerText,
      interactiveElements: btns
    };
  });

  console.log('Active Block Text:\n', dump.activeBlockText);
  console.log('Interactive Elements:\n', JSON.stringify(dump.interactiveElements, null, 2));

  await browser.close();
})();
