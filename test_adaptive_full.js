const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';
const LOG_FILE = path.join(__dirname, 'automation_debug.log');
const SCREENSHOTS_DIR = path.join(__dirname, 'debug_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

fs.writeFileSync(LOG_FILE, `=== ADAPTIVE STATE-DRIVEN TYPEFORM RUNNER ===\nStarted: ${new Date().toISOString()}\n\n`);

function log(msg) {
  const timestamp = new Date().toTimeString().split(' ')[0];
  const formatted = `[${timestamp}] ${msg}`;
  fs.appendFileSync(LOG_FILE, formatted + '\n');
  console.log(formatted);
}

// Complete Question Rules Database
const RULES = [
  // Section 1: Demographics
  { key: "Consent", match: /consent/i, type: 'radio', target: "Yes, I consent", alts: ["consent", "Yes"] },
  { key: "Contact", match: /agree to be contacted/i, type: 'radio', target: "Yes", alts: ["Yes"] },
  { key: "Age", match: /what is your age/i, type: 'radio', target: "22–25", alts: ["22-25", "25", "–25", "Under 25", "18–25"] },
  { key: "Gender", match: /what is your gender/i, type: 'radio', target: "Man", alts: ["Man"] },
  { key: "Origin Country", match: /where are you from/i, type: 'dropdown', target: "Nepal" },
  { key: "Current Country", match: /where do you currently live/i, type: 'dropdown', target: "Nepal" },
  { key: "Employment", match: /employment status/i, type: 'radio', target: "Full-time student", alts: ["Full-time student", "student"] },
  { key: "Education", match: /highest level of education/i, type: 'radio', target: "Bachelor's", alts: ["Bachelor", "Bachelor's degree"] },
  { key: "Field of Study", match: /field of study/i, type: 'radio', target: "STEM", alts: ["STEM", "Science"] },
  { key: "Youth Organization", match: /member of a youth organization/i, type: 'radio', target: "Yes, actively", alts: ["Yes, actively", "Yes"] },
  { key: "Community Type", match: /type of community/i, type: 'radio', target: "Mid-sized city", alts: ["Mid-sized city", "Urban", "City"] },
  { key: "Lived Abroad", match: /lived, studied, or worked in a country other than/i, type: 'radio', target: "No, but I plan to", alts: ["No, but I plan", "No"] },

  // Section 2: Future of Work & Skills
  { key: "Job Market Prep", match: /how prepared do you feel for the current job market/i, type: 'rating', target: "4" },
  { key: "Formal Education Equip", match: /formal education equip you/i, type: 'rating', target: "3" },
  { key: "Skills Acquisition Ranking", match: /rank the following three options based on where you acquired/i, type: 'ranking', target: ["Self-taught learning", "Hands-on experience", "Formal education"] },
  { key: "Human Centric Skills", match: /human-centric skills do you believe ai cannot replace/i, type: 'multiselect', target: ["Creative problem-solving", "Resilience", "Cross-cultural collaboration"] },
  { key: "AI Tools Frequency", match: /how frequently do you productively use artificial intelligence/i, type: 'radio', target: "Daily", alts: ["Daily", "Weekly", "Often"] },
  { key: "AI Replacement Concern", match: /how concerned are you about ai replacing your job/i, type: 'rating', target: "5" },
  { key: "Traditional Employment", match: /traditional employment \(stable job, linear career\) is a realistic/i, type: 'rating', target: "3" },
  { key: "Alternative Income / Emergency", match: /alternative source of income, side hustle/i, type: 'radio', target: "No", alts: ["No"] },
  { key: "Financial Concern", match: /primary financial concern for the next 2 years/i, type: 'radio', target: "Inflation and cost of living", alts: ["Inflation", "Cost of living", "Finding a first job", "Unemployment", "Debt"] },
  { key: "Structured Real World Project", match: /structured real-world project, community initiative/i, type: 'radio', target: "No, but I want to", alts: ["No, but I want", "Yes", "No"] },
  { key: "Skills Barrier", match: /biggest barrier to gaining the skills/i, type: 'multiselect', target: ["My education covers it", "Lack of time", "I don't know what skills I"] },
  { key: "Career Impact Importance", match: /how important is it that your career has positive social/i, type: 'rating', target: "3" },
  { key: "Demand to Companies/Universities", match: /to secure the future of work for your generation/i, type: 'text', target: "Get more Practical Learning" },

  // Section 3: Youth Leadership
  { key: "Leadership Factors Rank", match: /rank the following factors from 1 to 4 based on what defines a true leader/i, type: 'ranking', target: ["Formal authority", "Inspirational", "Peer"] },
  { key: "Initiated Community Project", match: /how many times have you self-initiated or led a community project/i, type: 'radio', target: "Once", alts: ["Once", "1-2", "None"] },
  { key: "Leadership Barrier", match: /primary barrier preventing you from taking on a formal or informal leadership/i, type: 'radio', target: "Systemic: Lack of networks", alts: ["Lack of networks", "Systemic", "networks"] },
  { key: "Youth Representation Influence", match: /young people today have genuine influence over decisions/i, type: 'rating', target: "5" },
  { key: "Leadership Competencies", match: /which of these leadership competencies/i, type: 'multiselect', target: ["Cross-cultural communication"] },
  { key: "Community Support", match: /how supported do you feel by your local community/i, type: 'rating', target: "5" },
  { key: "Making Decisions Impact", match: /making decisions that impact/i, type: 'rating', target: "3" },
  { key: "Leadership Role Readiness", match: /how comfortable and ready do you feel to take on a leadership role/i, type: 'rating', target: "4" },
  { key: "Trust in Figures", match: /rate your level of trust in the following figures/i, type: 'radio', target: "Emerging Community Leaders", alts: ["Emerging", "Community"] },
  { key: "Positive Influence Society Rank", match: /who has the strongest ability to positively influence society/i, type: 'ranking', target: ["Social media", "Lived experience", "Institutional"] },
  { key: "Priority Action Youth Leadership", match: /if governments, organizations and businesses want to effectively increase youth leadership/i, type: 'text', target: "Awarness" },

  // Section 4 & 5: Mental Health
  { key: "Mental Wellbeing Rate", match: /overall, how would you rate your mental health/i, type: 'rating', target: "4" },
  { key: "Burnout Limiting Opportunities", match: /mental health challenges or burnout limited your ability/i, type: 'rating', target: "5" },
  { key: "Disclosing Crisis Comfort", match: /how comfortable would you feel disclosing and openly discussing/i, type: 'rating', target: "2" },
  { key: "Stress Drivers", match: /what are the top source of stress in your life/i, type: 'multiselect', target: ["Relationships", "Job market uncertainty", "Climate anxiety"] },
  { key: "Institution Mental Health Seriousness", match: /organizations i belong to take mental health seriously/i, type: 'rating', target: "4" },
  { key: "Institution Support Initiatives", match: /what concrete, accessible mental health resources does your educational/i, type: 'multiselect', target: ["Clear protocols for deadline", "On-site or subsidized free"] },
  { key: "Turn to for Help", match: /when you feel overwhelmed or experience an emotional crisis/i, type: 'multiselect', target: ["Social media", "Online communities"] },
  { key: "Future Uncertainty Impact", match: /how much does uncertainty about the future.*impact your mental/i, type: 'rating', target: "4" },
  { key: "Emotional Resilience Tools", match: /young people today need more emotional resilience tools/i, type: 'rating', target: "2" },
  { key: "Workplace 2 Aspects Matrix", match: /rate how your university, school, or workplace currently performs regarding the following two aspects/i, type: 'matrix', target: "3, 3" },
  { key: "AI Opportunities Outlook", match: /artificial intelligence will create more opportunities than it eliminates/i, type: 'radio', target: "opportunity", alts: ["Opportunity", "more opportunity"] },

  // Section 6: Global Engagement & Outlook
  { key: "Follow International News", match: /how often do you follow international news/i, type: 'radio', target: "Monthly", alts: ["Monthly", "Weekly", "Daily"] },
  { key: "SDG Knowledge", match: /how knowledgeable do you feel about the sustainable development goals/i, type: 'rating', target: "5" },
  { key: "Individual Actions Contribute", match: /how much do you feel your individual actions can contribute/i, type: 'rating', target: "5" },
  { key: "Global Institution Trust", match: /which global institution do you have the most trust in/i, type: 'radio', target: "Nothing — I've lost faith in", alts: ["Nothing", "lost faith"] },
  { key: "Engaging Obstacle", match: /what is the greatest obstacle preventing you from engaging/i, type: 'radio', target: "No local entry point", alts: ["No local"] },
  { key: "Global Cooperation Optimism", match: /how optimistic are you that global cooperation can solve/i, type: 'rating', target: "5" },
  { key: "Important Mindset Skill", match: /faced with rapid global change, what is the single most important skill/i, type: 'text', target: "Industry ready skills and updated syllabus" },
  { key: "Policy Demand World Leader", match: /if you had 5 minutes with a world leader/i, type: 'text', target: "Skilled people not percentage based people" },
  { key: "Youth Vision Summary", match: /in one or two sentences, summarize your vision/i, type: 'text', target: "Getting Good Jobs and Setteling. To much demand in few sectors and lack of oppurtunties in few." },
  { key: "Urgent Challenge 2026", match: /what is the single most urgent challenge the world must address by 2030/i, type: 'text', target: "Quality education and practical skills over theoretical degrees.", isFinal: true }
];

async function getScreenState(page) {
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
        isQuestion: true,
        counter: activeCounter.text,
        title: titleEl ? clean(titleEl.innerText) : '',
        text: clean(blockEl.innerText)
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
        isQuestion: false,
        isStatement: true,
        counter: 'break',
        title: statements[0].text.slice(0, 80),
        text: statements[0].text
      };
    }

    return { isQuestion: false, isStatement: false, counter: 'unknown', title: clean(document.body.innerText).slice(0, 60), text: '' };
  });
}

(async () => {
  log('================================================================');
  log('🚀 RUNNING ADAPTIVE TYPEFORM SOLVER (ALL 62 ITEMS)');
  log(`🎯 URL: ${FORM_URL}`);
  log('================================================================\n');

  const isHeaded = process.argv.includes('--headed') || process.env.HEADED === 'true';
  const isDebug = process.argv.includes('--debug') || process.env.PWDEBUG === '1';
  const keepOpen = process.argv.includes('--keep-open');
  const slowMo = isHeaded ? 200 : 40;

  log(`Launching Chromium (Headless: ${!isHeaded}, SlowMo: ${slowMo}ms)...`);
  const browser = await chromium.launch({ 
    headless: !isHeaded, 
    slowMo,
    devtools: isDebug
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);

  try {
    log('Navigating to Typeform...');
    await page.goto(FORM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
    if (await startBtn.isVisible({ timeout: 4000 })) {
      log('Detected Welcome Screen. Clicking Start button...');
      await startBtn.click({ force: true });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
    }

    let completedQuestionsCount = 0;
    let loopIteration = 0;
    let lastSeenTitle = '';
    let consecutiveSameTitle = 0;

    while (loopIteration < 100) {
      loopIteration++;
      await page.waitForTimeout(400);
      const state = await getScreenState(page);

      if (state.title === lastSeenTitle) {
        consecutiveSameTitle++;
        if (consecutiveSameTitle >= 3) {
          log(`⚠️ Screen lingered on "${state.title.slice(0, 50)}". Attempting recovery advancement...`);
          await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => {
              const t = (b.innerText || '').toLowerCase();
              return (t.includes('continue') || t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button')) && !t.includes('submit');
            });
            if (btn) btn.click();
          });
          await page.keyboard.press('Enter');
          consecutiveSameTitle = 0;
          await page.waitForTimeout(600);
          continue;
        }
      } else {
        lastSeenTitle = state.title;
        consecutiveSameTitle = 0;
      }

      // 1. Check if Section Break / Statement Screen
      if (!state.isQuestion || state.isStatement) {
        log(`\n[BREAK] Section Transition Screen: "${state.title}"`);
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => {
            const t = (b.innerText || '').toLowerCase();
            return (t.includes('continue') || t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button')) && !t.includes('submit');
          });
          if (btn) btn.click();
        });
        await page.keyboard.press('Enter');
        await page.waitForTimeout(600);
        continue;
      }

      // 2. Find matching question rule
      const rule = RULES.find(r => r.match.test(state.title) || r.match.test(state.text));

      completedQuestionsCount++;
      log(`\n[Q-${state.counter}] [${rule ? rule.type.toUpperCase() : 'UNKNOWN'}] Title: "${state.title.slice(0, 80)}"`);

      if (!rule) {
        log(`    ⚠️ No specific rule matched for title. Using generic safe advancing...`);
        await page.evaluate(() => {
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
          const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"]'));
          if (buttons.length > 0) buttons[0].click();
        });
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
        continue;
      }

      log(`    Matched Rule: [${rule.key}] -> Target: ${JSON.stringify(rule.target)}`);

      // 3. Final Question Safety Halt
      if (rule.isFinal) {
        log(`\n🛑 SAFETY RULE ENFORCED: Final question reached! Typing final answer and halting before submission.`);
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
        }, rule.target);

        await page.waitForTimeout(1000);
        log('\n================================================================');
        log('🎉 SUCCESS: Entire survey answered autonomously up to final screen!');
        log('================================================================');

        const finalScreenshot = path.join(SCREENSHOTS_DIR, 'final_screen_reached.png');
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        log(`Saved final verification screenshot: ${finalScreenshot}`);
        break;
      }

      // 4. Dropdown
      if (rule.type === 'dropdown') {
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
        await page.keyboard.type(rule.target, { delay: 40 });
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
        }, rule.target);
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
      }

      // 5. Rating
      else if (rule.type === 'rating') {
        await page.evaluate((val) => {
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
          const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
          const match = buttons.find(b => (b.innerText || '').trim() === val);
          if (match) match.click();
        }, rule.target);

        await page.waitForTimeout(200);
        await page.keyboard.press(rule.target);
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
      }

      // 6. Ranking / Multiselect
      else if (rule.type === 'ranking' || rule.type === 'multiselect') {
        const parts = Array.isArray(rule.target) ? rule.target : rule.target.split(',').map(s => s.trim()).filter(Boolean);
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
      }

      // 7. Matrix (Q16: Rate 2 aspects)
      else if (rule.type === 'matrix') {
        const clickCoords = await page.evaluate(() => {
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

          const rowGroups = Array.from(activeBlock.querySelectorAll('fieldset, [role="radiogroup"], [data-qa*="matrix-row"], [data-qa*="row"]'));
          const coords = [];

          if (rowGroups.length >= 2) {
            rowGroups.forEach(row => {
              const buttons = Array.from(row.querySelectorAll('button, [role="radio"], [role="button"], label'));
              const targetBtn = buttons[Math.min(2, buttons.length - 1)];
              if (targetBtn) {
                const r = targetBtn.getBoundingClientRect();
                coords.push({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
              }
            });
          } else {
            const allRadios = Array.from(activeBlock.querySelectorAll('[role="radio"], button:not([data-qa*="ok-button"])'));
            if (allRadios.length >= 2) {
              const first = allRadios[0].getBoundingClientRect();
              const second = allRadios[Math.floor(allRadios.length / 2)].getBoundingClientRect();
              coords.push({ x: first.left + first.width / 2, y: first.top + first.height / 2 });
              coords.push({ x: second.left + second.width / 2, y: second.top + second.height / 2 });
            }
          }

          const okBtn = Array.from(activeBlock.querySelectorAll('button')).find(b => {
            const t = (b.innerText || '').trim().toLowerCase();
            return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
          });
          let okCoord = null;
          if (okBtn) {
            const r = okBtn.getBoundingClientRect();
            okCoord = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }

          return { coords, okCoord };
        });

        for (const c of clickCoords.coords) {
          await page.mouse.click(c.x, c.y);
          await page.waitForTimeout(300);
        }
        if (clickCoords.okCoord) {
          await page.mouse.click(clickCoords.okCoord.x, clickCoords.okCoord.y);
        }
        await page.keyboard.press('Enter');
      }

      // 8. Text
      else if (rule.type === 'text') {
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
          const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
            const t = (b.innerText || '').trim().toLowerCase();
            return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
          });
          if (ok) ok.click();
        }, rule.target);
        await page.waitForTimeout(200);
        await page.keyboard.press('Enter');
      }

      // 9. Radio / Choice
      else {
        const tgts = rule.alts ? [rule.target, ...rule.alts] : [rule.target];
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

          if (buttons.length > 0) {
            buttons[0].click();
            return { action: 'clicked_fallback', text: buttons[0].innerText };
          }

          return { action: 'no_match' };
        }, { targets: tgts });

        if (res?.action === 'opened_combobox') {
          const searchVal = (rule.target || '').split(',')[0].trim();
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
        }
      }

      await page.waitForTimeout(300);
    }

    if (keepOpen) {
      log('\n👀 Keep-open mode active: Browser will remain open for visual inspection.');
      log('Close the browser window or press Ctrl+C in terminal when done.');
      await page.waitForEvent('close', { timeout: 0 }).catch(() => {});
    }

  } catch (err) {
    log(`\n💥 RUNNER ERROR: ${err.message}\n${err.stack}`);
  } finally {
    if (!keepOpen || !browser.isConnected()) {
      await browser.close().catch(() => {});
      log('Browser closed. Test run complete.\n');
    }
  }
})();
