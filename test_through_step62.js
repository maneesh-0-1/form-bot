const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'debug_screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

(async () => {
  const isHeaded = process.argv.includes('--headed') || process.env.HEADED === 'true';
  const keepOpen = process.argv.includes('--keep-open');
  const slowMo = isHeaded ? 200 : 40;

  console.log(`Starting Typeform Runner (Headed: ${isHeaded}, SlowMo: ${slowMo}ms)...`);
  const browser = await chromium.launch({ headless: !isHeaded, slowMo });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
  }

  async function getActiveBlock() {
    return await page.evaluate(() => {
      const clean = str => (str || '').replace(/\s+/g, ' ').trim();

      const isVisible = el => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        return true;
      };

      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .filter(el => isVisible(el) && isVisible(el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]')))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText) };
        })
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);

      if (counters.length > 0) {
        counters.sort((a, b) => a.dist - b.dist);
        const activeCounter = counters[0];
        const blockEl = activeCounter.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || activeCounter.el.parentElement.parentElement;
        const titleEl = blockEl.querySelector('[data-qa*="block-title"], legend, h1, h2, h3');
        return {
          type: 'question',
          counter: activeCounter.text,
          title: `Q${activeCounter.text}: ${titleEl ? clean(titleEl.innerText) : ''}`,
          rawTitle: titleEl ? clean(titleEl.innerText) : '',
          text: clean(blockEl.innerText).slice(0, 200)
        };
      }

      const statements = Array.from(document.querySelectorAll('[data-qa*="statement"], [data-qa*="blocktype-statement"], [data-qa*="block-title"]'))
        .filter(el => isVisible(el))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText) };
        })
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);

      if (statements.length > 0) {
        statements.sort((a, b) => a.dist - b.dist);
        return {
          type: 'statement',
          counter: 'break',
          title: statements[0].text.slice(0, 60),
          rawTitle: statements[0].text,
          text: statements[0].text
        };
      }

      return { type: 'fallback', counter: 'none', title: clean(document.body.innerText).slice(0, 60), rawTitle: '', text: '' };
    });
  }

  async function waitForActiveBlockToChange(oldTitle, maxWaitMs = 3000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      await page.waitForTimeout(100);
      const cur = await getActiveBlock();
      if (cur.title && cur.title !== oldTitle) {
        return cur;
      }
    }
    return await getActiveBlock();
  }

  const items = [
    // --- Section 1: Demographics (Items 1–12) ---
    { id: 1, match: /consent/i, type: 'radio', target: "Yes, I consent" },
    { id: 2, match: /agree to be contacted/i, type: 'radio', target: "Yes" },
    { id: 3, match: /what is your age/i, type: 'radio', target: "22–25", altTargets: ["22-25", "–25", "-25", "25", "Under 25", "18–25"] },
    { id: 4, match: /what is your gender/i, type: 'radio', target: "Man" },
    { id: 5, match: /where are you from/i, type: 'dropdown', target: "Nepal" },
    { id: 6, match: /where do you currently live/i, type: 'dropdown', target: "Nepal" },
    { id: 7, match: /employment status/i, type: 'radio', target: "Full-time student" },
    { id: 8, match: /highest level of education/i, type: 'radio', target: "Bachelor's", altTargets: ["Bachelor", "Bachelor's degree"] },
    { id: 9, match: /field of study/i, type: 'radio', target: "STEM" },
    { id: 10, match: /member of a youth organization/i, type: 'radio', target: "Yes, actively", altTargets: ["Yes", "actively"] },
    { id: 11, match: /type of community/i, type: 'radio', target: "Mid-sized city" },
    { id: 12, match: /lived, studied, or worked in a country other than/i, type: 'radio', target: "No, but I plan to", altTargets: ["No, but I plan"] },

    // [ITEM 13]: SECTION BREAK 1
    { id: 13, match: /future of work/i, type: 'break', target: "Continue" },

    // --- Section 2: Future of Work & Skills (Items 14–26) ---
    { id: 14, match: /how prepared do you feel for the current job market/i, type: 'rating', target: "4" },
    { id: 15, match: /formal education equip you/i, type: 'rating', target: "3" },
    { id: 16, match: /rank the following three options based on where you acquired/i, type: 'ranking', target: "Self-taught learning, Hands-on experience, Formal education" },
    { id: 17, match: /human-centric skills do you believe ai cannot replace/i, type: 'multiselect', target: "Creative problem-solving, Resilience, Cross-cultural collaboration" },
    { id: 18, match: /how frequently do you productively use artificial intelligence/i, type: 'radio', target: "Daily" },
    { id: 19, match: /how concerned are you about ai replacing your job/i, type: 'rating', target: "5" },
    { id: 20, match: /traditional employment/i, type: 'rating', target: "3" },
    { id: 21, match: /alternative source of income, side hustle/i, type: 'radio', target: "No" },
    { id: 22, match: /primary financial concern for the next 2 years/i, type: 'dropdown_or_choice', target: "Inflation, rising cost", altTargets: ["Inflation", "Cost of living", "first job"] },
    { id: 23, match: /structured real-world project, community initiative/i, type: 'radio', target: "No, but I want to" },
    { id: 24, match: /biggest barrier to gaining the skills/i, type: 'multiselect', target: "My education covers it, Lack of time, I don't know what skills I" },
    { id: 25, match: /how important is it that your career has positive social/i, type: 'rating', target: "3" },
    { id: 26, match: /to secure the future of work for your generation/i, type: 'text', target: "Get more Practical Learning" },

    // [ITEM 27]: SECTION BREAK 2
    { id: 27, match: /youth leadership/i, type: 'break', target: "Continue" },

    // --- Section 3: Leadership & Youth Voice (Items 28–38) ---
    { id: 28, match: /rank the following factors from 1 to 4 based on what defines a true leader/i, type: 'ranking', target: "Formal authority, Inspirational, Peer" },
    { id: 29, match: /how many times have you self-initiated or led a community project/i, type: 'radio', target: "Once" },
    { id: 30, match: /primary barrier preventing you from taking on a formal or informal leadership/i, type: 'dropdown_or_choice', target: "Systemic: Lack of networks", altTargets: ["Lack of networks", "Systemic"] },
    { id: 31, match: /young people today have genuine influence over decisions/i, type: 'rating', target: "5" },
    { id: 32, match: /which of these leadership competencies/i, type: 'multiselect', target: "Cross-cultural communication" },
    { id: 33, match: /how supported do you feel by.*organizations around you/i, type: 'rating', target: "5" },
    { id: 34, match: /making decisions about real projects/i, type: 'rating', target: "3" },
    { id: 35, match: /how comfortable and ready do you feel to.*claim and exercise a seat/i, type: 'rating', target: "4" },
    { id: 36, match: /rate your level of trust in the following figures/i, type: 'radio', target: "Emerging Community Leaders", altTargets: ["Emerging"] },
    { id: 37, match: /who has the strongest ability to positively influence society/i, type: 'ranking', target: "Social media, Lived experience, Institutional" },
    { id: 38, match: /if governments, organizations and businesses want to effectively increase youth leadership/i, type: 'text', target: "Awarness" },

    // [ITEM 39]: SECTION BREAK 3
    { id: 39, match: /mental health/i, type: 'break', target: "Continue" },

    // --- Section 4: Mental Health & Support (Part 1) (Items 40–45) ---
    { id: 40, match: /overall, how would you rate your mental health/i, type: 'rating', target: "4" },
    { id: 41, match: /mental health challenges or burnout limited your ability/i, type: 'rating', target: "5" },
    { id: 42, match: /how comfortable would you feel disclosing and openly discussing/i, type: 'rating', target: "2" },
    { id: 43, match: /what are the top source of stress in your life/i, type: 'multiselect', target: "Relationships, Job market uncertainty, Climate anxiety" },
    { id: 44, match: /organizations i belong to take mental health seriously/i, type: 'rating', target: "4" },
    { id: 45, match: /what concrete, accessible mental health resources does your educational/i, type: 'multiselect', target: "Clear protocols for deadline, On-site or subsidized free" },

    // [ITEM 46]: SECTION BREAK 4
    { id: 46, match: /mental health.*part 2|mental health resources/i, type: 'break', target: "Continue" },

    // --- Section 5: Mental Health (Part 2) (Items 47–51) ---
    { id: 47, match: /when you feel overwhelmed or experience an emotional crisis/i, type: 'multiselect', target: "Social media, Online communities" },
    { id: 48, match: /how much does uncertainty about the future.*impact your mental/i, type: 'rating', target: "4" },
    { id: 49, match: /young people today need more emotional resilience tools/i, type: 'rating', target: "2" },
    { id: 50, match: /rate how your university, school, or workplace currently performs regarding the following two aspects/i, type: 'matrix', target: "3, 3" },
    { id: 51, match: /artificial intelligence will create more opportunities than it eliminates/i, type: 'radio', target: "opportunity", altTargets: ["Opportunity", "more opportunity"] },

    // [ITEM 52]: SECTION BREAK 5
    { id: 52, match: /global engagement|global outlook/i, type: 'break', target: "Continue" },

    // --- Section 6: Global Engagement & Outlook (Items 53–62) ---
    { id: 53, match: /how often do you follow international news/i, type: 'radio', target: "Monthly" },
    { id: 54, match: /how knowledgeable do you feel about the sustainable development goals/i, type: 'rating', target: "5" },
    { id: 55, match: /how much do you feel your individual actions can contribute/i, type: 'rating', target: "5" },
    { id: 56, match: /which global institution do you have the most trust in/i, type: 'radio', target: "Nothing — I've lost faith in", altTargets: ["Nothing", "lost faith"] },
    { id: 57, match: /what is the greatest obstacle preventing you from engaging/i, type: 'radio', target: "No local entry point", altTargets: ["No local"] },
    { id: 58, match: /how optimistic are you that global cooperation can solve/i, type: 'rating', target: "5" },
    { id: 59, match: /faced with rapid global change, what is the single most important skill/i, type: 'text', target: "Industry ready skills and updated syllabus" },
    { id: 60, match: /if you had 5 minutes with a world leader/i, type: 'text', target: "Skilled people not percentage based people" },
    { id: 61, match: /in one or two sentences, summarize your vision/i, type: 'text', target: "Getting Good Jobs and Setteling. To much demand in few sectors and lack of oppurtunties in few." },
    { id: 62, match: /what is the single most urgent challenge the world must address by 2030/i, type: 'text', target: "Quality education and practical skills over theoretical degrees.", isFinal: true }
  ];

  let completedSteps = 0;
  let safetyHalt = false;

  while (completedSteps < 75 && !safetyHalt) {
    completedSteps++;
    await page.waitForTimeout(400);
    const before = await getActiveBlock();

    // Find rule by match
    let activeItem = items.find(it => it.match && (it.match.test(before.rawTitle) || it.match.test(before.text)));
    if (!activeItem && before.type === 'statement') {
      activeItem = { id: completedSteps, type: 'break', target: 'Continue' };
    } else if (!activeItem) {
      activeItem = items[Math.min(completedSteps - 1, items.length - 1)];
    }

    console.log(`\n[STEP ${completedSteps}] Screen [${before.counter}]: "${before.title.slice(0, 70)}" -> Matching: ${activeItem.type.toUpperCase()}`);

    if (activeItem.type === 'break') {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const btn = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return t.includes('continue') || (b.getAttribute('data-qa') || '').includes('ok-button');
        }) || activeBlock.querySelector('button');
        if (btn) btn.click();
      });
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'dropdown') {
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
      await page.keyboard.type(activeItem.target, { delay: 40 });
      await page.waitForTimeout(400);
      await page.evaluate((val) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanV = clean(val);
        const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [data-radix-popper-content-wrapper] [role="option"], [data-radix-popper-content-wrapper] li, [data-qa*="combobox-item"], [role="option"], li'));
        const match = options.find(el => {
          const txt = clean(el.innerText || el.textContent || '');
          return txt === cleanV || txt.startsWith(cleanV) || txt.includes(cleanV);
        });
        if (match) match.click();
        else if (options.length > 0) options[0].click();
      }, activeItem.target);
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
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'rating') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
        const match = buttons.find(b => (b.innerText || '').trim() === val);
        if (match) match.click();
      }, activeItem.target);
      await page.waitForTimeout(200);
      await page.keyboard.press(activeItem.target);
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
        });
        if (ok) ok.click();
      });
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'ranking' || activeItem.type === 'multiselect') {
      const parts = Array.isArray(activeItem.target) ? activeItem.target : activeItem.target.split(',').map(s => s.trim()).filter(Boolean);
      await page.evaluate((items) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="checkbox"], [role="button"], label'));
        for (const item of items) {
          const cleanPart = clean(item);
          const match = buttons.find(b => {
            const raw = b.innerText.trim();
            const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
            const btnClean = clean(withoutBadge);
            return btnClean.includes(cleanPart) || cleanPart.includes(btnClean) || btnClean.includes(cleanPart.slice(0, 10));
          });
          if (match) match.click();
        }
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
        });
        if (ok) ok.click();
      }, parts);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'matrix') {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        const rowGroups = Array.from(activeBlock.querySelectorAll('fieldset, [role="radiogroup"], [data-qa*="matrix-row"], [data-qa*="row"]'));

        if (rowGroups.length >= 2) {
          rowGroups.forEach(row => {
            const buttons = Array.from(row.querySelectorAll('button, [role="radio"], [role="button"], label'));
            const targetBtn = buttons.find(b => (b.innerText || '').trim() === '3') || buttons[Math.min(2, buttons.length - 1)];
            if (targetBtn) {
              targetBtn.click();
              targetBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
          });
        } else {
          const allRadios = Array.from(activeBlock.querySelectorAll('[role="radio"], button:not([data-qa*="ok-button"])'));
          if (allRadios.length >= 10) {
            allRadios[2]?.click();
            allRadios[7]?.click();
          } else if (allRadios.length >= 2) {
            allRadios[0]?.click();
            allRadios[Math.floor(allRadios.length / 2)]?.click();
          }
        }

        const okBtn = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
        });
        if (okBtn) okBtn.click();
      });
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'text') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const input = activeBlock.querySelector('textarea, input[type="text"], input:not([type="hidden"])');
        if (input) {
          input.focus();
          input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, activeItem.target);
      await page.waitForTimeout(200);

      if (activeItem.isFinal) {
        console.log('\n🛑 SAFETY RULE ENFORCED: Final question answered. Halting before submission!');
        await page.waitForTimeout(1000);
        const finalScreenshot = path.join(SCREENSHOTS_DIR, 'final_screen_reached.png');
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`Saved final verification screenshot to: ${finalScreenshot}`);
        safetyHalt = true;
        break;
      } else {
        await page.evaluate(() => {
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
          const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
            const t = (b.innerText || '').trim().toLowerCase();
            return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
          });
          if (ok) ok.click();
        });
        await page.keyboard.press('Enter');
      }
    } else {
      // Radio / Choice / Dropdown or Choice
      const res = await page.evaluate(({ targets }) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]');
        if (trig) {
          trig.click();
          return { action: 'opened_combobox' };
        }

        const buttons = Array.from(activeBlock.querySelectorAll('[role="radio"], button, [role="button"], label, div[data-qa*="choice"]'));
        let matched = null;
        for (const t of targets) {
          const cleanT = clean(t);
          matched = buttons.find(b => {
            const raw = (b.innerText || b.textContent || '').trim();
            const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
            const btnClean = clean(withoutBadge);
            return btnClean === cleanT || btnClean.startsWith(cleanT) || btnClean.includes(cleanT) || cleanT.includes(btnClean);
          });
          if (matched) break;
        }

        if (!matched && buttons.length > 0) {
          matched = buttons[0];
        }

        if (matched) {
          matched.scrollIntoView?.({ block: 'center' });
          matched.click();
          const raw = (matched.innerText || matched.textContent || '').trim();
          const letter = raw.match(/^([A-Z0-9])[\s\n]/i)?.[1] || null;
          const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
          if (ok) ok.click();
          return { action: 'clicked_radio', letter, text: raw };
        }
        return { action: 'no_match' };
      }, { targets: activeItem.altTargets ? [activeItem.target, ...activeItem.altTargets] : [activeItem.target] });

      if (res?.action === 'opened_combobox') {
        const searchVal = activeItem.target.split(/[\s,–-]+/)[0];
        await page.waitForTimeout(300);
        await page.keyboard.type(searchVal, { delay: 40 });
        await page.waitForTimeout(400);
        await page.evaluate((val) => {
          const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanV = clean(val);
          const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [data-radix-popper-content-wrapper] [role="option"], [data-radix-popper-content-wrapper] li, [data-qa*="combobox-item"], [role="option"], li'));
          const match = options.find(el => {
            const txt = clean(el.innerText || el.textContent || '');
            return txt === cleanV || txt.startsWith(cleanV) || txt.includes(cleanV);
          });
          if (match) match.click();
          else if (options.length > 0) options[0].click();
        }, searchVal);
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
        await page.keyboard.press('Enter');
      } else if (res?.action === 'clicked_radio') {
        if (res.letter) {
          await page.keyboard.press(res.letter);
        }
        await page.waitForTimeout(200);
        await page.keyboard.press('Enter');
      }
    }

    const after = await waitForActiveBlockToChange(before.title);
    console.log(`    After: "${after.title}"`);
  }

  console.log('\n🎉 ALL QUESTIONS COMPLETED UP TO FINAL SAFETY HALT!');

  if (keepOpen) {
    console.log('\n👀 Browser left open for user visual inspection.');
    await page.waitForEvent('close', { timeout: 0 }).catch(() => {});
  } else {
    await browser.close();
  }
})();
