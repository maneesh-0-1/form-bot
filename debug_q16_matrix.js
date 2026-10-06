/**
 * debug_q16_matrix.js
 * Navigates through the form to Q16 and logs the exact DOM structure
 * of the matrix question to a JSON file for analysis.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'q16_dom_debug.json');

(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 80 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click start
  const start = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await start.isVisible({ timeout: 4000 })) {
    await start.click({ force: true });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
  }

  // Helper: click the active block's best matching radio/button
  async function clickOption(textFragment) {
    await page.evaluate((frag) => {
      const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const f = clean(frag);
      const btns = Array.from(document.querySelectorAll('button, [role="radio"], label'));
      const m = btns.find(b => {
        const t = clean(b.innerText || b.textContent || '');
        return t.includes(f) || f.includes(t.slice(0, 6));
      });
      if (m) m.click();
    }, textFragment);
    await page.waitForTimeout(800);
  }

  // Helper: advance (OK + Enter)
  async function advance() {
    await page.evaluate(() => {
      const ok = document.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
  }

  // Helper: click country dropdown
  async function selectDropdown(country) {
    await page.evaluate(() => {
      const trig = document.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]') ||
                   document.querySelector('button');
      if (trig) trig.click();
    });
    await page.waitForTimeout(600);
    await page.keyboard.type(country.split(' ')[0], { delay: 50 });
    await page.waitForTimeout(800);
    await page.evaluate((q) => {
      const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const qc = clean(q);
      const opts = Array.from(document.querySelectorAll('[role="option"], li[data-value], [data-qa*="combobox-item"]'));
      const m = opts.find(o => clean(o.innerText || o.textContent || '').includes(qc));
      if (m) m.click(); else if (opts.length) opts[0].click();
    }, country);
    await page.waitForTimeout(400);
    await advance();
  }

  // Quick-navigate through Q1–Q15 to reach Q16
  // Q1: Consent
  await clickOption('Yes, I consent'); await advance();
  // Q2: Contact
  await clickOption('Yes'); await advance();
  // Q3: Age
  await clickOption('22'); await advance();
  // Q4: Gender
  await clickOption('Man'); await advance();
  // Q5: From (dropdown)
  await selectDropdown('Nepal');
  // Q6: Live (dropdown)
  await selectDropdown('Nepal');
  // Q7: Employment
  await clickOption('Full-time student'); await advance();
  // Q8: Education
  await clickOption("Bachelor"); await advance();
  // Q9: Field
  await clickOption('STEM'); await advance();
  // Q10: Youth org
  await clickOption('Yes, actively'); await advance();
  // Q11: Community
  await clickOption('Mid-sized city'); await advance();
  // Q12: Lived abroad
  await clickOption('No, but I plan to'); await advance();
  // Q13: Section break — click Continue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find(b => /continue/i.test(b.innerText || '')) || btns[0];
    if (cont) cont.click();
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  // Q14-Q15: ratings (just pick 3)
  await clickOption('3'); await advance();
  await clickOption('3'); await advance();

  // Q16: ranking — click first 3 available
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="radio"], label')).slice(0, 3);
    btns.forEach(b => b.click());
  });
  await advance();

  // Q17: multiselect — click first 3
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="checkbox"], label')).slice(0, 3);
    btns.forEach(b => b.click());
  });
  await advance();

  // Q18–Q20: ratings
  await clickOption('4'); await advance();
  await clickOption('4'); await advance();
  await clickOption('3'); await advance();

  // Q21: side hustle radio
  await clickOption('No'); await advance();

  // Q22: financial concern dropdown or choice
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="radio"], label'));
    if (btns.length > 0) btns[0].click();
  });
  await advance();

  // Q23: real world project
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="radio"]'));
    if (btns.length > 0) btns[0].click();
  });
  await advance();

  // Q24: skills barrier multiselect
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="checkbox"], label')).slice(0, 2);
    btns.forEach(b => b.click());
  });
  await advance();

  // Q25: career impact rating
  await clickOption('4'); await advance();

  // Q26: text field
  await page.evaluate(() => {
    const inp = document.querySelector('textarea, input[type="text"]');
    if (inp) { inp.focus(); inp.value = 'Prioritize practical skills and mentorship programs.'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await advance();

  // Section break 2
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find(b => /continue/i.test(b.innerText || '')) || btns[0];
    if (cont) cont.click();
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  // Leadership Q-a through Q-k: ratings, radios, multiselects, text — just click first options
  for (let i = 0; i < 11; i++) {
    const type = await page.evaluate(() => {
      if (document.querySelector('textarea, input[type="text"]')) return 'text';
      if (document.querySelectorAll('[role="checkbox"]').length > 0) return 'multi';
      return 'other';
    });
    if (type === 'text') {
      await page.evaluate(() => {
        const inp = document.querySelector('textarea, input[type="text"]');
        if (inp) { inp.focus(); inp.value = 'Invest in youth-led programs and accessible mentorship.'; inp.dispatchEvent(new Event('input', { bubbles: true })); }
      });
    } else if (type === 'multi') {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="checkbox"], label')).slice(0, 2);
        btns.forEach(b => b.click());
      });
    } else {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="radio"]'));
        if (btns.length > 0) btns[0].click();
      });
    }
    await advance();
  }

  // Section break 3 (Mental Health)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cont = btns.find(b => /continue/i.test(b.innerText || '')) || btns[0];
    if (cont) cont.click();
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  // Mental Health Q-a through Q-i: 9 questions
  for (let i = 0; i < 9; i++) {
    const type = await page.evaluate(() => {
      if (document.querySelectorAll('[role="checkbox"]').length > 0) return 'multi';
      return 'other';
    });
    if (type === 'multi') {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="checkbox"], label')).slice(0, 2);
        btns.forEach(b => b.click());
      });
    } else {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="radio"]'));
        if (btns.length > 0) btns[0].click();
      });
    }
    await advance();
  }

  // Now we should be at Q16 (matrix)
  await page.waitForTimeout(1500);

  console.log('Reached Q16 area. Capturing DOM...');

  // Capture the full Q16 DOM structure
  const domInfo = await page.evaluate(() => {
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();

    // Get all potential selectors
    const selectorResults = {};
    const selectors = [
      'fieldset', '[role="radiogroup"]', '[data-qa*="matrix"]', '[data-qa*="row"]',
      'table', 'table tr', 'tbody tr', '[class*="matrix"]', '[class*="row"]',
      '[data-qa*="blocktype"]', 'form > div', 'section'
    ];
    selectors.forEach(sel => {
      const els = Array.from(document.querySelectorAll(sel));
      if (els.length > 0) {
        selectorResults[sel] = els.length;
      }
    });

    // Get active block
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => {
        const rect = el.getBoundingClientRect();
        const blockEl = el.closest('[data-qa*="blocktype"], section, form, div[data-block-type]') || el.parentElement.parentElement;
        const opacity = parseFloat(window.getComputedStyle(blockEl || el).opacity || '1');
        return { el, blockEl, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText), opacity };
      })
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text && c.opacity > 0.5);

    counters.sort((a, b) => a.dist - b.dist);
    const activeBlock = counters[0]?.blockEl || document.body;

    // Grab the active block's HTML snippet
    const blockHTML = activeBlock.innerHTML.slice(0, 3000);
    const blockTitle = clean(activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText || '');

    // All buttons in active block
    const allButtons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="checkbox"], label, input'))
      .map(b => ({
        tag: b.tagName,
        role: b.getAttribute('role') || '',
        text: clean(b.innerText || b.value || b.getAttribute('aria-label') || ''),
        'data-qa': b.getAttribute('data-qa') || '',
        class: (b.className || '').slice(0, 80)
      }));

    // Fieldsets
    const fieldsets = Array.from(activeBlock.querySelectorAll('fieldset, [role="radiogroup"]'))
      .map((fs, i) => {
        const buttons = Array.from(fs.querySelectorAll('button, [role="radio"], label, input'))
          .map(b => clean(b.innerText || b.value || b.getAttribute('aria-label') || ''));
        return { index: i, legend: clean(fs.querySelector('legend')?.innerText || ''), buttons };
      });

    return {
      currentTitle: clean(document.body.innerText).slice(0, 200),
      blockTitle,
      selectorResults,
      activeBlockHTML: blockHTML,
      allButtonsInBlock: allButtons,
      fieldsets
    };
  });

  fs.writeFileSync(OUT, JSON.stringify(domInfo, null, 2));
  console.log('DOM info saved to:', OUT);
  console.log('Block title:', domInfo.blockTitle);
  console.log('Fieldsets found:', domInfo.fieldsets.length);
  console.log('Selector hits:', JSON.stringify(domInfo.selectorResults, null, 2));
  console.log('All buttons:', domInfo.allButtonsInBlock.map(b => b.text).filter(t => t).join(' | '));

  await browser.close();
})();
