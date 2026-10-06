const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Fast-tracking to Q16...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  const start = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await start.isVisible({ timeout: 4000 })) {
    await start.click({ force: true });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }

  for (let step = 1; step <= 80; step++) {
    await page.waitForTimeout(150);
    const info = await page.evaluate(() => {
      const clean = s => (s || '').replace(/\s+/g, ' ').trim();
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const title = clean(activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText);
      const isQ16 = /rate how your university, school, or workplace currently performs/i.test(title);
      return { title, isQ16, counter: counters[0]?.text || '' };
    });

    if (info.isQ16) {
      console.log(`\n🎯 REACHED Q16 AT STEP ${step}! Title: "${info.title}"`);
      
      const q16Full = await page.evaluate(() => {
        const clean = s => (s || '').replace(/\s+/g, ' ').trim();
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        const allRadios = Array.from(activeBlock.querySelectorAll('[role="radio"], button')).map(el => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            role: el.getAttribute('role'),
            qa: el.getAttribute('data-qa'),
            ariaLabel: el.getAttribute('aria-label'),
            text: clean(el.innerText),
            parentRole: el.parentElement?.getAttribute('role'),
            parentTag: el.parentElement?.tagName,
            parentClass: (el.parentElement?.className || '').slice(0, 50),
            name: el.getAttribute('name'),
            value: el.getAttribute('value'),
            top: Math.round(r.top),
            left: Math.round(r.left),
            width: Math.round(r.width),
            height: Math.round(r.height)
          };
        });

        const groups = Array.from(activeBlock.querySelectorAll('[role="radiogroup"], fieldset')).map(g => ({
          tag: g.tagName,
          role: g.getAttribute('role'),
          legend: clean(g.querySelector('legend')?.innerText),
          ariaLabel: g.getAttribute('aria-label'),
          childRadios: g.querySelectorAll('[role="radio"], button').length
        }));

        return {
          title: clean(activeBlock.querySelector('[data-qa*="block-title"], legend')?.innerText),
          groups,
          allRadios,
          html: activeBlock.outerHTML
        };
      });

      fs.writeFileSync(path.join(__dirname, 'q16_full_dump.json'), JSON.stringify(q16Full, null, 2));
      fs.writeFileSync(path.join(__dirname, 'q16_outer.html'), q16Full.html);
      console.log('Saved Q16 dump to q16_full_dump.json and q16_outer.html');
      console.log('Groups found:', JSON.stringify(q16Full.groups, null, 2));
      console.log('All radios/buttons:', JSON.stringify(q16Full.allRadios, null, 2));
      break;
    }

    // Advance standard questions
    await page.evaluate(() => {
      // Check dropdown
      const trig = document.querySelector('button[data-qa*="combobox-trigger"]');
      if (trig && trig.getBoundingClientRect().top < window.innerHeight) {
        trig.click();
        return;
      }
      // Check textarea/input
      const inp = document.querySelector('textarea, input[type="text"]');
      if (inp && inp.getBoundingClientRect().top < window.innerHeight) {
        inp.focus();
        inp.value = "Equitable access and youth empowerment initiatives.";
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // Click choice
      const btn = Array.from(document.querySelectorAll('[role="radio"], button, [role="checkbox"]')).find(b => {
        const t = (b.innerText || '').toLowerCase();
        if (t === 'ok' || t.includes('continue') || (b.getAttribute('data-qa') || '').includes('ok-button')) return false;
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top >= 0 && r.top < window.innerHeight;
      });
      if (btn) btn.click();

      // Click ok
      const ok = document.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });

    // Handle dropdown if opened
    const hasDropdown = await page.evaluate(() => !!document.querySelector('[role="option"], [data-qa*="combobox-item"]'));
    if (hasDropdown) {
      await page.keyboard.type('Nepal', { delay: 20 });
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('[role="option"], [data-qa*="combobox-item"], li'));
        const m = opts.find(o => (o.innerText || '').toLowerCase().includes('nepal'));
        if (m) m.click(); else if (opts.length) opts[0].click();
      });
    }

    await page.keyboard.press('Enter');
  }

  await browser.close();
})();
