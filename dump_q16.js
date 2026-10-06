/**
 * dump_q16.js  — Navigate to Q16 and dump the raw innerHTML to a file.
 * Runs fast through Q1-Q15 using keyboard shortcuts and Enter keys.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Start
  const start = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await start.isVisible({ timeout: 5000 }).catch(() => false)) {
    await start.click({ force: true });
    await page.waitForTimeout(1500);
  }

  const press = async (key, wait = 800) => { await page.keyboard.press(key); await page.waitForTimeout(wait); };
  const wait = (ms) => page.waitForTimeout(ms);

  const clickText = async (text, waitMs = 900) => {
    await page.evaluate((t) => {
      const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const ct = clean(t);
      const all = Array.from(document.querySelectorAll('button, [role="radio"], [role="checkbox"], label'));
      const m = all.find(el => {
        const raw = el.innerText || el.textContent || '';
        const cr = clean(raw);
        return cr === ct || cr.includes(ct) || ct.includes(cr.slice(0, 6));
      });
      if (m) m.click();
    }, text);
    await wait(waitMs);
  };

  const clickOK = async () => {
    await page.evaluate(() => {
      const ok = document.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });
    await press('Enter', 900);
  };

  const dropdownSelect = async (country) => {
    // click the trigger
    await page.evaluate(() => {
      const trig = document.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]') || document.querySelector('button');
      if (trig) trig.click();
    });
    await wait(700);
    await page.keyboard.type(country.split(' ')[0], { delay: 60 });
    await wait(900);
    // click matching option
    await page.evaluate((q) => {
      const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const qc = clean(q);
      const opts = Array.from(document.querySelectorAll('[role="option"], li, [data-qa*="combobox-item"]'));
      const m = opts.find(o => clean(o.innerText || o.textContent || '').includes(qc));
      if (m) m.click(); else if (opts.length) opts[0].click();
    }, country);
    await wait(500);
    await clickOK();
  };

  // --- Q1: Consent ---
  await clickText('Yes, I consent'); await clickOK();
  // --- Q2: Contact ---
  await clickText('Yes'); await clickOK();
  // --- Q3: Age ---
  await clickText('22'); await clickOK();
  // --- Q4: Gender ---
  await clickText('Man'); await clickOK();
  // --- Q5: From (dropdown) ---
  await dropdownSelect('Nepal');
  // --- Q6: Live (dropdown) ---
  await dropdownSelect('Nepal');
  // --- Q7-Q12: radios ---
  await clickText('Full-time student'); await clickOK();
  await clickText("Bachelor"); await clickOK();
  await clickText('STEM'); await clickOK();
  await clickText('Yes, actively'); await clickOK();
  await clickText('Mid-sized city'); await clickOK();
  await clickText('No, but I plan to'); await clickOK();
  // --- Section break 1 ---
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find(b => /continue/i.test(b.innerText || '')) || btns[0];
    if (cont) cont.click();
  });
  await press('Enter', 1000);

  // --- Q14, Q15: ratings ---
  await clickText('4'); await clickOK();
  await clickText('3'); await clickOK();

  // --- Q16 ranking: click first 3 buttons ---
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, [role="radio"]')).slice(0, 3);
    all.forEach(b => b.click());
  });
  await clickOK();

  // --- Q17 multiselect ---
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, [role="checkbox"], label')).slice(0, 3);
    all.forEach(b => b.click());
  });
  await clickOK();

  // --- Q18-21: ratings/radio ---
  await clickText('4'); await clickOK();
  await clickText('4'); await clickOK();
  await clickText('3'); await clickOK();
  // Q21 side hustle
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, [role="radio"]'));
    if (all[0]) all[0].click();
  });
  await wait(800);

  // Q22 financial
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, [role="radio"], [role="option"]'));
    if (all[0]) all[0].click();
  });
  await clickOK();

  // Q23
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, [role="radio"]'));
    if (all[0]) all[0].click();
  });
  await wait(800);

  // Q24 multiselect
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('[role="checkbox"], label')).slice(0, 2);
    all.forEach(b => b.click());
  });
  await clickOK();

  // Q25 rating
  await clickText('4'); await clickOK();

  // Q26 text
  await page.evaluate(() => {
    const inp = document.querySelector('textarea, input[type="text"]');
    if (inp) { inp.focus(); inp.value = 'Invest in apprenticeships and AI literacy programs.'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await clickOK();

  // Section break 2
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find(b => /continue/i.test(b.innerText || '')) || btns[0];
    if (cont) cont.click();
  });
  await press('Enter', 1000);

  // Leadership Q-a to Q-k (11 questions)
  for (let i = 0; i < 11; i++) {
    const type = await page.evaluate(() => {
      if (document.querySelector('textarea, input[type="text"]')) return 'text';
      if (document.querySelectorAll('[role="checkbox"]').length > 0) return 'multi';
      return 'other';
    });
    if (type === 'text') {
      await page.evaluate(() => {
        const inp = document.querySelector('textarea, input[type="text"]');
        if (inp) { inp.focus(); inp.value = 'Empower youth with practical leadership and advocacy tools.'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
      });
    } else if (type === 'multi') {
      await page.evaluate(() => { Array.from(document.querySelectorAll('[role="checkbox"], label')).slice(0, 2).forEach(b => b.click()); });
    } else {
      await page.evaluate(() => { const all = Array.from(document.querySelectorAll('button, [role="radio"]')); if (all[0]) all[0].click(); });
    }
    await clickOK();
  }

  // Section break 3 (Mental Health)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find(b => /continue/i.test(b.innerText || '')) || btns[0];
    if (cont) cont.click();
  });
  await press('Enter', 1000);

  // Mental Health Q-a to Q-i (9 questions)
  for (let i = 0; i < 9; i++) {
    const type = await page.evaluate(() => {
      if (document.querySelectorAll('[role="checkbox"]').length > 0) return 'multi';
      return 'other';
    });
    if (type === 'multi') {
      await page.evaluate(() => { Array.from(document.querySelectorAll('[role="checkbox"], label')).slice(0, 2).forEach(b => b.click()); });
    } else {
      await page.evaluate(() => { const all = Array.from(document.querySelectorAll('button, [role="radio"]')); if (all[0]) all[0].click(); });
    }
    await clickOK();
  }

  // Now we should be at Q16 matrix
  await wait(2000);

  const title = await page.evaluate(() => document.body.innerText.slice(0, 100));
  console.log('Current screen:', title);

  // Dump the FULL page HTML around the active question
  const dump = await page.evaluate(() => {
    // Get the full page HTML of the visible section
    const allBlocks = Array.from(document.querySelectorAll('[data-qa*="blocktype"], fieldset[data-qa-block], section'));
    const visible = allBlocks.filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.top >= -200 && rect.top < window.innerHeight + 200 && parseFloat(style.opacity || '1') > 0.3;
    });

    // Also dump ALL role=radio in entire document
    const allRadios = Array.from(document.querySelectorAll('[role="radio"]')).map(r => ({
      text: (r.innerText || '').trim(),
      parent: r.parentElement?.tagName,
      grandparent: r.parentElement?.parentElement?.tagName,
      parentRole: r.parentElement?.getAttribute('role') || '',
      parentClass: (r.parentElement?.className || '').slice(0, 60),
      rect: (() => { const rc = r.getBoundingClientRect(); return { top: Math.round(rc.top), left: Math.round(rc.left) }; })(),
      visible: r.getBoundingClientRect().top >= -50 && r.getBoundingClientRect().top < window.innerHeight
    }));

    return {
      bodyText: document.body.innerText.slice(0, 300),
      allRadiosOnPage: allRadios,
      visibleBlocksCount: visible.length,
      visibleBlocksHTML: visible.map(v => v.innerHTML.slice(0, 500)).join('\n---BLOCK---\n'),
      fullHTML: document.body.innerHTML.slice(0, 8000)
    };
  });

  fs.writeFileSync(path.join(__dirname, 'q16_real_dump.json'), JSON.stringify(dump, null, 2));
  console.log('Saved to q16_real_dump.json');
  console.log('Body text:', dump.bodyText);
  console.log('Total [role=radio] on page:', dump.allRadiosOnPage.length);
  console.log('Visible radios:', dump.allRadiosOnPage.filter(r => r.visible).map(r => `"${r.text}" parent=${r.parent}[role=${r.parentRole}]`).join('\n'));

  // Keep open for 30 seconds so you can inspect
  await wait(30000);
  await browser.close();
})();
