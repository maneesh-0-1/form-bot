const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForSelector('[data-qa="question-header-counter"]', { timeout: 5000 });
  await page.waitForTimeout(600);

  const SURVEY_ITEMS = [
    { id: 1, type: 'radio', target: "Yes, I consent" },
    { id: 2, type: 'radio', target: "Yes" },
    { id: 3, type: 'radio', target: "22–25", altTargets: ["22-25", "–25", "-25", "25", "Under 25", "18–25"] },
    { id: 4, type: 'radio', target: "Man" },
    { id: 5, type: 'dropdown', target: "Nepal" },
    { id: 6, type: 'dropdown', target: "Nepal" },
    { id: 7, type: 'radio', target: "Full-time student" },
    { id: 8, type: 'radio', target: "Bachelor's", altTargets: ["Bachelor", "Bachelor's degree"] },
    { id: 9, type: 'radio', target: "STEM" },
    { id: 10, type: 'radio', target: "Yes, actively", altTargets: ["Yes", "actively"] },
    { id: 11, type: 'radio', target: "Mid-sized city" },
    { id: 12, type: 'radio', target: "No, but I plan to", altTargets: ["No, but I plan"] },
    { id: 13, type: 'break', target: "Continue" }
  ];

  for (const item of SURVEY_ITEMS) {
    if (item.type === 'break') {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const btn = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const txt = (b.innerText || '').trim().toLowerCase();
          const qa = b.getAttribute('data-qa') || '';
          return txt.includes('continue') || qa.includes('continue') || qa.includes('ok-button');
        }) || activeBlock.querySelector('button');
        if (btn) btn.click();
      });
      await page.waitForTimeout(600);
    } else if (item.type === 'dropdown') {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
        if (trig) trig.click();
      });
      await page.waitForTimeout(300);
      await page.keyboard.type(item.target, { delay: 40 });
      await page.waitForTimeout(400);
      await page.evaluate((val) => {
        const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
        const match = options.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === val.toLowerCase());
        if (match) match.click();
      }, item.target);
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
      await page.waitForTimeout(600);
    } else {
      await page.evaluate(({ targets }) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label'));
        for (const t of targets) {
          const cleanT = clean(t);
          const match = buttons.find(b => {
            const raw = b.innerText.trim();
            const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
            const btnClean = clean(withoutBadge);
            return btnClean === cleanT || btnClean.startsWith(cleanT) || btnClean.includes(cleanT) || cleanT.includes(btnClean);
          });
          if (match) {
            match.click();
            return;
          }
        }
      }, { targets: item.altTargets ? [item.target, ...item.altTargets] : [item.target] });
      await page.waitForTimeout(600);
    }
  }

  console.log('--- Successfully at Step 14 ---');
  await page.waitForTimeout(600);

  const blockDump = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

    const allButtons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"], div[data-qa*="rating"], span, input, label')).map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      qa: el.getAttribute('data-qa'),
      text: el.innerText ? el.innerText.trim().replace(/\n/g, ' ') : null,
      id: el.id,
      className: el.className
    }));

    return {
      counter: counters[0]?.text,
      title: activeBlock.innerText.slice(0, 150),
      buttons: allButtons.filter(b => b.text && b.text.length < 50)
    };
  });

  console.log('Step 14 Active Block Dump:\n', JSON.stringify(blockDump, null, 2));

  // Let's test clicking button '4' via active block DOM vs Playwright click
  console.log('\nTesting clicking rating 4 button inside active block...');
  const clicked = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    
    // Find button with text '4'
    const btns = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
    const b4 = btns.find(b => (b.innerText || '').trim() === '4');
    if (b4) {
      b4.click();
      return { found: true, tag: b4.tagName, text: b4.innerText };
    }
    return { found: false, count: btns.length };
  });

  console.log('Click result:', clicked);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'debug_screenshots/step14_after_click_4.png' });

  // Now click OK in active block
  const okClicked = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    
    const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
      const t = (b.innerText || '').trim().toLowerCase();
      const qa = b.getAttribute('data-qa') || '';
      return t === 'ok' || qa.includes('ok-button');
    });
    if (ok) {
      ok.click();
      return { found: true, text: ok.innerText };
    }
    return { found: false };
  });
  console.log('OK Click result:', okClicked);

  await page.waitForTimeout(800);
  await page.screenshot({ path: 'debug_screenshots/step14_after_click_ok.png' });

  const finalBlock = await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    return {
      counter: counters[0]?.text,
      title: activeBlock.innerText.slice(0, 150)
    };
  });
  console.log('Active after Step 14:', JSON.stringify(finalBlock, null, 2));

  await browser.close();
})();
