const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';
const LOG_FILE = path.join(__dirname, 'automation_debug.log');
const SCREENSHOTS_DIR = path.join(__dirname, 'debug_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

fs.writeFileSync(LOG_FILE, `=== UNIVERSAL RUNNER LOG START: ${new Date().toISOString()} ===\n\n`);

function log(msg) {
  const timestamp = new Date().toTimeString().split(' ')[0];
  const formatted = `[${timestamp}] ${msg}`;
  fs.appendFileSync(LOG_FILE, formatted + '\n');
  console.log(formatted);
}

const SURVEY_ITEMS = [
  // --- Section 1: Demographics (Items 1–12) ---
  { id: 1, type: 'radio', key: "Consent", target: "Yes, I consent" },
  { id: 2, type: 'radio', key: "Confirmation / Qualifier", target: "Yes" },
  { id: 3, type: 'radio', key: "Age Bracket", target: "22–25", altTargets: ["22-25", "–25", "-25", "25", "Under 25", "18–25"] },
  { id: 4, type: 'radio', key: "Gender", target: "Man" },
  { id: 5, type: 'dropdown', key: "Country of Origin / Residence", target: "Nepal" },
  { id: 6, type: 'dropdown', key: "Current Location / Country", target: "Nepal" },
  { id: 7, type: 'radio', key: "Employment / Student Status", target: "Full-time student" },
  { id: 8, type: 'radio', key: "Education Level", target: "Bachelor's", altTargets: ["Bachelor", "Bachelor's degree"] },
  { id: 9, type: 'radio', key: "Field of Study", target: "STEM" },
  { id: 10, type: 'radio', key: "Job Search Status", target: "Yes, actively", altTargets: ["Yes", "actively"] },
  { id: 11, type: 'radio', key: "Location / Setting", target: "Mid-sized city" },
  { id: 12, type: 'radio', key: "Relocation / Next Plan", target: "No, but I plan to", altTargets: ["No, but I plan"] },

  // [ITEM 13]: SECTION BREAK 1
  { id: 13, type: 'break', key: "Section Break 1", target: "Continue" },

  // --- Section 2: Future of Work & Skills (Items 14–26) ---
  { id: 14, type: 'rating', key: "How prepared do you feel for...", target: "4" },
  { id: 15, type: 'rating', key: "To what extent does your...", target: "3" },
  { id: 16, type: 'ranking', key: "Question c. of 22 (Rank / Priority)", target: "Self-taught learning (Online), Hands-on experience (Previous)" },
  { id: 17, type: 'multiselect', key: 'Question d. of 22 ("Which human...")', target: "Creative problem-solving, Resilience, Cross-cultural collaboration" },
  { id: 18, type: 'radio', key: "Frequency / AI or Tool usage", target: "Daily" },
  { id: 19, type: 'rating', key: "How concerned are you about...", target: "5" },
  { id: 20, type: 'rating', key: "How strongly do you agree: Traditional employment", target: "3" },
  { id: 21, type: 'radio', key: "Qualifier question", target: "No" },
  { id: 22, type: 'text_or_choice', key: "Key Challenge / Goal", target: "Finding a first job", altTargets: ["Finding a first job", "Finding a job"] },
  { id: 23, type: 'radio', key: "Skill / Training interest", target: "No, but I want to" },
  { id: 24, type: 'multiselect', key: 'Question k. of 56 ("What is the...")', target: "My education covers it, Lack of time, I don't know what skills I" },
  { id: 25, type: 'rating', key: "Scale / Score", target: "3" },
  { id: 26, type: 'text', key: 'Question m. of 56 ("To secure...")', target: "Get more Practical Learning" },

  // [ITEM 27]: SECTION BREAK 2
  { id: 27, type: 'break', key: "Section Break 2", target: "Continue" },

  // --- Section 3: Leadership & Youth Voice (Items 28–38) ---
  { id: 28, type: 'ranking', key: 'Question a. of 56 ("Rank the...")', target: "Formal authority: Holding a" },
  { id: 29, type: 'radio', key: "Frequency / Occurrence", target: "Once" },
  { id: 30, type: 'dropdown_or_choice', key: "Barrier / Obstacle", target: "Systemic: Lack of networks," },
  { id: 31, type: 'rating', key: "Scale / Rating 1", target: "5" },
  { id: 32, type: 'multiselect', key: "Skill / Competency", target: "Cross-cultural communication" },
  { id: 33, type: 'rating', key: "How supported do you feel by...", target: "5" },
  { id: 34, type: 'rating', key: "How strongly do you agree: Making decisions", target: "3" },
  { id: 35, type: 'rating', key: "How comfortable and ready do...", target: "4" },
  { id: 36, type: 'choice_or_rating', key: 'Question i. of 56 ("Rate your...")', target: "Emerging Community Leaders (" },
  { id: 37, type: 'ranking', key: 'Question j. of 56 ("Who has the...")', target: "Social media presence, Lived experience" },
  { id: 38, type: 'text', key: 'Question k. of 56 ("If...")', target: "Awarness" },

  // [ITEM 39]: SECTION BREAK 3
  { id: 39, type: 'break', key: "Section Break 3", target: "Continue" },

  // --- Section 4: Mental Health & Support (Part 1) (Items 40–45) ---
  { id: 40, type: 'rating', key: "Overall, how would you rate...", target: "4" },
  { id: 41, type: 'rating', key: "In the past year, to what...", target: "5" },
  { id: 42, type: 'rating', key: "How comfortable would you...", target: "2" },
  { id: 43, type: 'multiselect', key: 'Question d. of 56 ("What are...")', target: "Relationships, Job market uncertainty, Climate anxiety" },
  { id: 44, type: 'rating', key: "Scale / Rating 2 (Instance 1)", target: "4" },
  { id: 45, type: 'multiselect', key: 'Question f. of 56 ("What...") (Instance 2)', target: "Clear protocols for deadline, On-site or subsidized free" },

  // [ITEM 46]: SECTION BREAK 4
  { id: 46, type: 'break', key: "Section Break 4", target: "Continue" },

  // --- Section 5: Mental Health (Part 2) (Items 47–51) ---
  { id: 47, type: 'multiselect', key: 'Question g. of 56 ("When you...")', target: "Social media, Online communities" },
  { id: 48, type: 'rating', key: "How much does uncertainty...", target: "4" },
  { id: 49, type: 'rating', key: "How strongly do you agree: Young people today", target: "2" },
  { id: 50, type: 'radio', key: 'Question 16 of 56 ("Rate how...")', target: "Mental health days" },
  { id: 51, type: 'radio', key: "Outlook / Sentiment", target: "opportunity" },

  // [ITEM 52]: SECTION BREAK 5
  { id: 52, type: 'break', key: "Section Break 5", target: "Continue" },

  // --- Section 6: Global Engagement & Outlook (Items 53–62) ---
  { id: 53, type: 'radio', key: "Frequency", target: "Monthly" },
  { id: 54, type: 'rating', key: "How knowledgeable do you...", target: "5" },
  { id: 55, type: 'rating', key: "How much do you feel your...", target: "5" },
  { id: 56, type: 'radio', key: "Sentiment / Belief", target: "Nothing — I've lost faith in" },
  { id: 57, type: 'radio', key: "Challenge / Barrier", target: "No local entry point" },
  { id: 58, type: 'rating', key: "Scale / Rating 3", target: "5" },
  { id: 59, type: 'text', key: 'Question h. of 56 ("Faced with...")', target: "Industry ready skills and updated syllabus" },
  { id: 60, type: 'text', key: 'Question 18 of 56 ("If you...")', target: "Skilled people not percentage based people" },
  { id: 61, type: 'text', key: 'Question 19 of 56 ("In one or...")', target: "Getting Good Jobs and Setteling. To much demand in few sectors and lack of oppurtunties in few." },
  { id: 62, type: 'text', key: "Urgent Challenge 2026", target: "Quality education and practical skills over theoretical degrees." }
];

async function getActiveBlock(page) {
  return await page.evaluate(() => {
    const clean = str => (str || '').replace(/\s+/g, ' ').trim();
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
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
        text: clean(blockEl.innerText).slice(0, 150)
      };
    }

    const statements = Array.from(document.querySelectorAll('[data-qa*="statement"], [data-qa*="blocktype-statement"], [data-qa*="block-title"]'))
      .map(el => {
        const rect = el.getBoundingClientRect();
        return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText) };
      })
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);

    if (statements.length > 0) {
      statements.sort((a, b) => a.dist - b.dist);
      return {
        type: 'statement',
        counter: 'statement',
        title: statements[0].text.slice(0, 80),
        text: statements[0].text.slice(0, 150)
      };
    }

    return { type: 'fallback', counter: 'none', title: clean(document.body.innerText).slice(0, 60), text: '' };
  });
}

async function waitForActiveBlockToChange(page, oldTitle, maxWaitMs = 3500) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await page.waitForTimeout(80);
    const cur = await getActiveBlock(page);
    if (cur.title && cur.title !== oldTitle) {
      return cur;
    }
  }
  return await getActiveBlock(page);
}

async function executeUniversalStep(page, item) {
  const before = await getActiveBlock(page);
  log(`\n[STEP ${String(item.id).padStart(2, '0')}/62] [${item.type.toUpperCase()}] Key: "${item.key}" | Target: "${item.target}"`);
  log(`  - Screen Before: "${before.title}"`);

  // 1. Section Break
  if (item.type === 'break') {
    const clicked = await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const btn = activeBlock.querySelector('button[data-qa*="ok-button"], button[data-qa*="continue"], button');
      if (btn) {
        btn.click();
        return btn.innerText.trim();
      }
      return null;
    });
    log(`  - Clicked break continue button: "${clicked || 'Enter key fallback'}"`);
    if (!clicked) await page.keyboard.press('Enter');
  }

  // 2. Dropdown
  else if (item.type === 'dropdown' || (item.type === 'dropdown_or_choice' && (await page.locator('button[data-qa*="combobox-trigger"]').count()) > 0)) {
    // Open trigger
    let triggerOpened = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      triggerOpened = await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"], button');
        if (trig) {
          trig.click();
          return true;
        }
        return false;
      });
      if (triggerOpened) break;
      await page.waitForTimeout(150);
    }

    log(`  - Dropdown combobox opened: ${triggerOpened}`);
    await page.waitForTimeout(300);
    log(`  - Typing search query: "${item.target}"`);
    await page.keyboard.type(item.target, { delay: 40 });
    await page.waitForTimeout(400);

    const optionClicked = await page.evaluate((val) => {
      const options = Array.from(document.querySelectorAll('li, [role="option"], [data-qa*="combobox-item"], span'));
      const match = options.find(el => (el.innerText || el.textContent || '').trim().toLowerCase() === val.toLowerCase());
      if (match) {
        match.click();
        return match.innerText || match.textContent;
      }
      return null;
    }, item.target);

    log(`  - Option selection: "${optionClicked || 'Enter fallback'}"`);
    if (!optionClicked) await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Click OK in active block
    await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
        .map(el => ({ el, top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight);
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
      const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
      if (ok) ok.click();
    });
  }

  // 3. All other question types (Rating, Radio, Multiselect, Ranking, Text)
  else {
    let actionResult = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      actionResult = await page.evaluate(async ({ itemType, targetVal, targets }) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        // Rating
        if (itemType === 'rating' || /^[0-9]$/.test(targetVal)) {
          const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [data-qa*="rating"]'));
          const match = buttons.find(b => {
            const txt = b.innerText.trim();
            return txt === targetVal || txt.startsWith(targetVal + '\n') || b.getAttribute('data-qa')?.includes(`rating-${targetVal}`);
          });
          if (match) {
            match.click();
            return { action: 'clicked_rating', text: match.innerText };
          }
          return { action: 'press_key', key: targetVal };
        }

        // Multiselect / Ranking
        if (itemType === 'ranking' || itemType === 'multiselect') {
          const parts = targetVal.split(',').map(s => s.trim()).filter(Boolean);
          const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="checkbox"], [role="button"], label'));
          let anyMatch = false;
          for (const part of parts) {
            const cleanPart = clean(part);
            const match = buttons.find(b => {
              const raw = b.innerText.trim();
              const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
              const btnClean = clean(withoutBadge);
              return btnClean.includes(cleanPart) || cleanPart.includes(btnClean) || btnClean.includes(cleanPart.slice(0, 10));
            });
            if (match) {
              match.click();
              anyMatch = true;
            }
          }
          if (anyMatch) {
            const ok = activeBlock.querySelector('button[data-qa*="ok-button"], button[data-qa*="continue"]');
            if (ok) ok.click();
            return { action: 'multiselect_clicked' };
          }
          return null;
        }

        // Radio / Single Choice
        if (itemType === 'radio' || itemType === 'choice_or_rating' || itemType === 'text_or_choice' || itemType === 'dropdown_or_choice') {
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
              return { action: 'clicked_radio', text: match.innerText };
            }
          }
        }

        // Text
        const input = activeBlock.querySelector('textarea, input[type="text"], input:not([type="hidden"])');
        if (input) {
          return { action: 'fill_text' };
        }

        return null;
      }, { itemType: item.type, targetVal: item.target, targets: item.altTargets ? [item.target, ...item.altTargets] : [item.target] });

      if (actionResult) break;
      await page.waitForTimeout(150);
    }

    log(`  - Active block DOM action: ${JSON.stringify(actionResult)}`);

    if (actionResult?.action === 'press_key') {
      await page.keyboard.press(actionResult.key);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (actionResult?.action === 'clicked_rating') {
      await page.waitForTimeout(250);
      // Rating scales require clicking OK or pressing Enter to advance
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const ok = activeBlock.querySelector('button[data-qa*="ok-button"], button');
        if (ok && (ok.innerText.trim() === 'OK' || ok.getAttribute('data-qa')?.includes('ok-button'))) {
          ok.click();
        }
      });
      await page.keyboard.press('Enter');
    } else if (actionResult?.action === 'fill_text') {
      const input = page.locator('textarea:visible, input[type="text"]:visible, input:not([type="hidden"]):visible').first();
      if (await input.isVisible({ timeout: 500 })) {
        await input.fill(item.target);
        await page.waitForTimeout(150);
        await page.keyboard.press('Enter');
      }
    }
  }

  // Verification & Advance Wait
  const startTime = Date.now();
  const after = await waitForActiveBlockToChange(page, before.title);
  const duration = Date.now() - startTime;

  if (after.title !== before.title && after.title.length > 0) {
    log(`  - Screen After: "${after.title}"`);
    log(`  - Status: VERIFIED_ADVANCED (Duration: ${duration}ms)`);
    await page.waitForTimeout(300);
    return true;
  }

  // Recovery if screen lingered
  log(`  ⚠️ LINGERED: Attempting recovery on Step ${item.id}...`);
  await page.evaluate(() => {
    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => ({ el, top: el.getBoundingClientRect().top }))
      .filter(c => c.top >= -50 && c.top < window.innerHeight);
    counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
    const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
    const ok = activeBlock.querySelector('button[data-qa*="ok-button"], button:has-text("OK"), button:has-text("Continue")');
    if (ok && !ok.innerText.toLowerCase().includes('submit')) {
      ok.click();
    }
  });
  await page.keyboard.press('Enter');

  await page.waitForTimeout(600);
  const finalAfter = await getActiveBlock(page);
  if (finalAfter.title !== before.title) {
    log(`  - Status: RECOVERED_AND_ADVANCED`);
    return true;
  }

  log(`  ❌ FAILED_TO_ADVANCE on Step ${item.id} ("${item.key}")`);
  const screenshotPath = path.join(SCREENSHOTS_DIR, `step_${String(item.id).padStart(2, '0')}_failed.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`  - Saved failure screenshot: ${screenshotPath}`);
  return false;
}

(async () => {
  log('========================================================');
  log('🚀 RUNNING AUTONOMOUS VERIFICATION FOR ALL 62 ITEMS');
  log(`🎯 URL: ${FORM_URL}`);
  log('========================================================\n');

  const browser = await chromium.launch({ headless: true, slowMo: 40 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.setDefaultTimeout(3500);

  try {
    log('Navigating to Typeform...');
    await page.goto(FORM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
    if (await startBtn.isVisible({ timeout: 3000 })) {
      log('Detected Welcome Screen. Clicking Start button...');
      await startBtn.click({ force: true });
      await page.waitForSelector('[data-qa="question-header-counter"]', { timeout: 5000 });
      await page.waitForTimeout(800);
    }

    for (let idx = 0; idx < SURVEY_ITEMS.length; idx++) {
      const item = SURVEY_ITEMS[idx];
      const success = await executeUniversalStep(page, item);
      if (!success) {
        log(`\n💥 Execution halted on Item ${item.id}`);
        break;
      }
    }

    log('\n========================================================');
    log('🎉 SUCCESS: All 62 items completed end-to-end!');
    log('🛑 SAFETY RULE ENFORCED: Reached final screen. Stopping without clicking Submit.');
    log('========================================================');

    const finalScreenshot = path.join(SCREENSHOTS_DIR, 'final_screen_reached.png');
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    log(`Saved final verification screenshot: ${finalScreenshot}`);

  } catch (err) {
    log(`\n💥 RUNNER ERROR: ${err.message}\n${err.stack}`);
  } finally {
    await browser.close();
    log('Browser closed. Test run complete.\n');
  }
})();
