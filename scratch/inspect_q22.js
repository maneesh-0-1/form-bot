const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'networkidle' });

  // Click start
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(1000);

  // Auto-advance until Q22
  for (let i = 0; i < 25; i++) {
    const text = await page.evaluate(() => document.body.innerText);
    if (/primary financial concern/i.test(text)) {
      console.log('REACHED Q22!');
      break;
    }
    // Try consent or choice or rating
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, [role="radio"], [role="button"]'))
        .find(b => {
          const t = (b.innerText || '').toLowerCase();
          return t.includes('consent') || t === 'yes' || /^[1-5]$/.test(t) || t === 'ok' || t === 'continue';
        });
      if (btn) btn.click();
      else {
        const anyBtn = document.querySelector('[role="radio"], [data-qa*="choice"]');
        if (anyBtn) anyBtn.click();
      }
    });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
  }

  // Inspect Q22 DOM
  const domInfo = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const elementsWithText = all.filter(el => (el.innerText || '').includes('Type or select an option'));
    return elementsWithText.map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      qa: el.getAttribute('data-qa'),
      className: el.className,
      outerHTML: el.outerHTML.slice(0, 200)
    }));
  });

  console.log('DOM INFO for "Type or select an option":', JSON.stringify(domInfo, null, 2));

  // Now click it and see what appears in the DOM!
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => (e.innerText || '').trim() === 'Type or select an option' && e.children.length === 0) ||
               document.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], input[type="text"]');
    if (el) el.click();
  });
  await page.waitForTimeout(1000);

  // Check what new elements appeared
  const afterClickInfo = await page.evaluate(() => {
    const listboxes = Array.from(document.querySelectorAll('[role="listbox"], [role="option"], ul, li, div[data-qa*="option"], [data-qa*="item"]'));
    return listboxes.map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      qa: el.getAttribute('data-qa'),
      text: (el.innerText || '').slice(0, 50)
    })).filter(x => x.text.length > 0).slice(0, 15);
  });

  console.log('AFTER CLICK ELEMENTS:', JSON.stringify(afterClickInfo, null, 2));
  await browser.close();
})();
