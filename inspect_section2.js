const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  // Helper to click in active block
  async function answerRadio(text) {
    await page.evaluate((val) => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const btns = Array.from(activeBlock.querySelectorAll('button, label'));
      const match = btns.find(b => b.innerText.includes(val));
      if (match) match.click();
    }, text);
    await page.waitForTimeout(600);
  }

  async function answerDropdown(queryText) {
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
    await page.waitForTimeout(600);
  }

  // Q1 - Q12
  await answerRadio('Yes, I consent');
  await answerRadio('Yes');
  await answerRadio('22–25');
  await answerRadio('Man');
  await answerDropdown('Nepal');
  await answerDropdown('Nepal');
  await answerRadio('Full-time student');
  await answerRadio("Bachelor's");
  await answerRadio('STEM');
  await answerRadio('Yes');
  await answerRadio('Mid-sized city');
  await answerRadio('No, but I plan to');

  console.log('--- At Section Break 1 ---');
  // Click Continue
  const cont = page.locator('button[data-qa*="continue"], button[data-qa*="ok-button"], button:has-text("Continue")').first();
  if (await cont.isVisible({ timeout: 1000 })) {
    await cont.click({ force: true });
  } else {
    await page.keyboard.press('Enter');
  }
  await page.waitForTimeout(1000);

  // Now at Section 2 Question a (Item 14)
  console.log('--- At Section 2 Question a (Item 14) ---');
  const qAInfo = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const block = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

    const buttons = Array.from(block.querySelectorAll('*'))
      .filter(el => ['BUTTON', 'LABEL', 'INPUT', 'DIV', 'SPAN'].includes(el.tagName) && el.children.length === 0 && el.innerText?.trim())
      .map(el => ({ tag: el.tagName, qa: el.getAttribute('data-qa'), role: el.getAttribute('role'), text: el.innerText.trim() }));

    return {
      counter: counters[0]?.text,
      html: block.outerHTML.slice(0, 800),
      leaves: buttons
    };
  });

  console.log('Q a block details:\n', JSON.stringify(qAInfo, null, 2));

  // Let's test pressing '4' or clicking rating 4
  console.log('Sending 4 via keyboard...');
  await page.keyboard.press('4');
  await page.waitForTimeout(600);

  // Check if OK button exists or if it advanced
  const ok = page.locator('button[data-qa*="ok-button"]').first();
  if (await ok.isVisible()) {
    console.log('OK button visible after 4, clicking OK...');
    await ok.click({ force: true });
  }

  await page.waitForTimeout(1000);

  const afterQ4 = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => ({ text: el.innerText.trim(), top: Math.round(el.getBoundingClientRect().top) }));
    return counters;
  });
  console.log('Counters after rating 4:\n', afterQ4);

  await browser.close();
})();
