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
    await page.waitForTimeout(1200);
  }

  // Answer questions 1 to 21 using exact Playwright clicks
  await page.getByRole('radio', { name: /yes, i consent/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole('radio', { name: /^yes$/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole('radio', { name: /22/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole('radio', { name: /^man$/i }).click();
  await page.waitForTimeout(600);

  // Dropdown 1
  await page.getByRole('combobox').click();
  await page.keyboard.type('Nepal');
  await page.waitForTimeout(400);
  await page.getByRole('option', { name: /nepal/i }).click();
  await page.waitForTimeout(600);

  // Dropdown 2
  await page.getByRole('combobox').click();
  await page.keyboard.type('Nepal');
  await page.waitForTimeout(400);
  await page.getByRole('option', { name: /nepal/i }).click();
  await page.waitForTimeout(600);

  await page.getByRole('radio', { name: /full-time student/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole('radio', { name: /bachelor/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole('radio', { name: /stem/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole('radio', { name: /yes, actively/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole('radio', { name: /mid-sized city/i }).click();
  await page.waitForTimeout(600);
  await page.getByRole('radio', { name: /no, but i plan/i }).click();
  await page.waitForTimeout(600);

  // Section break 1
  const cont1 = page.getByRole('button', { name: /continue/i }).first();
  if (await cont1.isVisible()) {
    await cont1.click();
    await page.waitForTimeout(800);
  }

  // Future of work rating
  await page.keyboard.press('4');
  await page.waitForTimeout(600);
  await page.keyboard.press('3');
  await page.waitForTimeout(600);

  // Ranking
  await page.getByText(/self-taught/i).first().click();
  await page.waitForTimeout(300);
  await page.getByText(/hands-on/i).first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /ok/i }).first().click();
  await page.waitForTimeout(600);

  // Multiselect
  await page.getByText(/creative problem/i).first().click();
  await page.waitForTimeout(200);
  await page.getByText(/resilience/i).first().click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /ok/i }).first().click();
  await page.waitForTimeout(600);

  // AI frequency
  await page.getByRole('radio', { name: /daily/i }).click();
  await page.waitForTimeout(600);

  // Concern
  await page.keyboard.press('5');
  await page.waitForTimeout(600);

  // Traditional
  await page.keyboard.press('3');
  await page.waitForTimeout(600);

  // Alternative income
  await page.getByRole('radio', { name: /^no$/i }).click();
  await page.waitForTimeout(1000);

  console.log('=== ARRIVED AT QUESTION AFTER ALTERNATIVE INCOME ===');
  const info = await page.evaluate(() => {
    const clean = str => (str || '').replace(/\s+/g, ' ').trim();
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => {
        const rect = el.getBoundingClientRect();
        return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText) };
      })
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);

    counters.sort((a, b) => a.dist - b.dist);
    const active = counters[0];
    const block = active?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

    const btns = Array.from(block.querySelectorAll('button, [role="radio"], [role="button"], label, div[data-qa*="choice"]')).map(b => ({
      tag: b.tagName,
      role: b.getAttribute('role'),
      qa: b.getAttribute('data-qa'),
      text: (b.innerText || '').trim(),
      rect: b.getBoundingClientRect()
    }));

    return {
      counter: active?.text,
      title: block.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText,
      buttons: btns
    };
  });

  console.log('Active Question:', info.counter, info.title);
  console.log('Available Options on this Question:\n', JSON.stringify(info.buttons, null, 2));

  await browser.close();
})();
