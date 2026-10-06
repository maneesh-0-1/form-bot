const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }

  // Answer Q1 - Q12
  const simpleTargets = [
    "Yes, I consent", "Yes", "22–25", "Man", "Nepal", "Nepal",
    "Full-time student", "Bachelor's", "STEM", "Yes, actively",
    "Mid-sized city", "No, but I plan to"
  ];

  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(400);
    if (i === 4 || i === 5) {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
        if (trig) trig.click();
      });
      await page.waitForTimeout(200);
      await page.keyboard.type('Nepal', { delay: 30 });
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [role="option"], li'));
        const match = options.find(o => (o.innerText || '').toLowerCase().includes('nepal'));
        if (match) match.click();
      });
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else {
      await page.evaluate((target) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanT = clean(target);
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label'));
        const match = buttons.find(b => clean(b.innerText).includes(cleanT) || cleanT.includes(clean(b.innerText)));
        if (match) match.click();
      }, simpleTargets[i]);
    }
    await page.waitForTimeout(400);
  }

  // Section break
  await page.waitForTimeout(1000);
  console.log('Clearing section break with mouse click on active Continue button...');
  const breakCoords = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: (el.innerText || '').trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const btn = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('continue') || (b.innerText || '').toLowerCase().includes('ok')) || activeBlock.querySelector('button');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (breakCoords) {
    await page.mouse.click(breakCoords.x, breakCoords.y);
  }
  await page.waitForTimeout(1500);

  // Now on Qa!
  console.log('\n--- NOW ON QUESTION a. (How prepared do you feel...) ---');
  const qaStateBefore = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return {
      counter: counters[0]?.text,
      title: activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText,
      allButtons: Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]')).map(b => ({
        tag: b.tagName,
        text: (b.innerText || '').trim(),
        qa: b.getAttribute('data-qa'),
        rect: b.getBoundingClientRect()
      }))
    };
  });
  console.log('Qa state before click:', JSON.stringify(qaStateBefore, null, 2));

  // Find button "4"
  const btn4 = qaStateBefore.allButtons.find(b => b.text === '4' || b.text.startsWith('4'));
  console.log('Button 4 found:', btn4);

  if (btn4) {
    console.log(`Clicking button 4 at (${btn4.rect.x + btn4.rect.width/2}, ${btn4.rect.y + btn4.rect.height/2})...`);
    await page.mouse.click(btn4.rect.x + btn4.rect.width/2, btn4.rect.y + btn4.rect.height/2);
  }
  await page.waitForTimeout(500);

  const qaStateAfter = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return {
      counter: counters[0]?.text,
      title: activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText,
      allButtons: Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]')).map(b => ({
        tag: b.tagName,
        text: (b.innerText || '').trim(),
        qa: b.getAttribute('data-qa'),
        rect: b.getBoundingClientRect()
      }))
    };
  });
  console.log('Qa state AFTER clicking 4:', JSON.stringify(qaStateAfter, null, 2));

  // Try pressing Enter or clicking OK
  const okBtn = qaStateAfter.allButtons.find(b => b.text.toLowerCase().includes('ok') || (b.qa && b.qa.includes('ok')));
  if (okBtn) {
    console.log(`Clicking OK button on Qa at (${okBtn.rect.x + okBtn.rect.width/2}, ${okBtn.rect.y + okBtn.rect.height/2})...`);
    await page.mouse.click(okBtn.rect.x + okBtn.rect.width/2, okBtn.rect.y + okBtn.rect.height/2);
  } else {
    console.log('No OK button found, pressing Enter key...');
    await page.keyboard.press('Enter');
  }

  await page.waitForTimeout(1500);
  const nextScreen = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return {
      counter: counters[0]?.text,
      title: activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText
    };
  });
  console.log('Screen after OK/Enter:', nextScreen);

  await browser.close();
})();
