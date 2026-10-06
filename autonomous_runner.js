const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { generateUniqueSurveyResponses, generateWithOnlineAI, synthesizeDynamicText } = require('./ai_response_generator');

const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';
const LOG_FILE = path.join(__dirname, 'automation_debug.log');
const SCREENSHOTS_DIR = path.join(__dirname, 'debug_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

fs.writeFileSync(LOG_FILE, `=== ADAPTIVE DYNAMIC AUTONOMOUS TYPEFORM RUNNER ===\nStarted: ${new Date().toISOString()}\n\n`);

function log(msg) {
  const timestamp = new Date().toTimeString().split(' ')[0];
  const formatted = `[${timestamp}] ${msg}`;
  fs.appendFileSync(LOG_FILE, formatted + '\n');
  console.log(formatted);
}

async function getActiveBlock(page) {
  return await page.evaluate(() => {
    const clean = str => (str || '').replace(/\s+/g, ' ').trim();

    const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
      .map(el => {
        const rect = el.getBoundingClientRect();
        const blockEl = el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || el.parentElement.parentElement;
        const bStyle = window.getComputedStyle(blockEl || el);
        const opacity = parseFloat(bStyle.opacity || '1');
        return { el, blockEl, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText), opacity };
      })
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text && c.opacity > 0.5);

    if (counters.length > 0) {
      counters.sort((a, b) => a.dist - b.dist);
      const activeCounter = counters[0];
      const blockEl = activeCounter.blockEl;
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
      .map(el => {
        const rect = el.getBoundingClientRect();
        const blockEl = el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || el.parentElement.parentElement;
        const bStyle = window.getComputedStyle(blockEl || el);
        const opacity = parseFloat(bStyle.opacity || '1');
        return { el, blockEl, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: clean(el.innerText), opacity };
      })
      .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text && c.opacity > 0.5);

    if (statements.length > 0) {
      statements.sort((a, b) => a.dist - b.dist);
      return {
        type: 'statement',
        counter: 'BREAK',
        title: statements[0].text.slice(0, 80),
        rawTitle: statements[0].text,
        text: statements[0].text
      };
    }

    return { type: 'fallback', counter: 'none', title: clean(document.body.innerText).slice(0, 60), rawTitle: '', text: '' };
  });
}

async function waitForActiveBlockToChange(page, oldTitle, maxWaitMs = 3500) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await page.waitForTimeout(100);
    const cur = await getActiveBlock(page);
    if (cur.title && cur.title !== oldTitle) {
      return cur;
    }
  }
  return await getActiveBlock(page);
}

async function dismissAnyOpenDropdown(page, reason = '') {
  try {
    const hasDropdown = await page.evaluate(() => {
      const poppers = Array.from(document.querySelectorAll(
        '[data-radix-popper-content-wrapper], [role="listbox"], [data-qa*="dropdown-list"], [data-qa*="combobox-options"], [data-state="open"][role="dialog"]'
      )).filter(p => {
        const r = p.getBoundingClientRect();
        return r.width > 20 && r.height > 20 && r.top < window.innerHeight && r.bottom > 0;
      });
      return poppers.length > 0;
    });

    if (hasDropdown) {
      log(`    🧹 Detected open/lingering dropdown (${reason}). Dismissing via empty space click & Escape...`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      // Click safe top-left margin of the page body (empty non-interactive space in Typeform)
      await page.mouse.click(60, 60);
      await page.waitForTimeout(200);

      // Secondary check: if still present, click background edge
      const stillOpen = await page.evaluate(() => {
        const poppers = Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"]'))
          .filter(p => p.getBoundingClientRect().height > 20);
        return poppers.length > 0;
      });
      if (stillOpen) {
        await page.mouse.click(20, 200);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);
      }
      return true;
    }
  } catch (e) {
    // Non-fatal safety catch
  }
  return false;
}

async function clickEmptySpaceAndClearDropdown(page, contextMsg = '') {
  log(`    🛡️ [BACKUP] Clicking on empty space to remove lingering dropdown and reset focus (${contextMsg})...`);
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    // Click on two safe neutral positions (empty margins outside question cards)
    await page.mouse.click(60, 60);
    await page.waitForTimeout(150);
    await page.mouse.click(30, 250);
    await page.waitForTimeout(150);
    await dismissAnyOpenDropdown(page, 'forced backup clearance');
  } catch (e) {
    log(`    ⚠️ Backup click notice: ${e.message}`);
  }
}

async function fillSingleForm(runIndex, totalRuns, options = {}) {
  const { isHeaded = false, isDebug = false, autoSubmit = true, keepOpen = false } = options;
  const slowMo = isHeaded ? 120 : 40;

  // Step 1: Generate Unique Persona and Dynamic AI Answers
  const dynamicProfile = await generateUniqueSurveyResponses();
  const { persona, answers } = dynamicProfile;

  log(`\n----------------------------------------------------------------`);
  log(`👤 [Submission ${runIndex}/${totalRuns}] Persona: [${persona.role}] from ${persona.country} (${persona.age}, ${persona.gender})`);
  log(`💡 Persona Focus: ${persona.focus}`);
  log(`----------------------------------------------------------------\n`);

  // Step 2: Knowledge-driven Adaptive Question Rules
  const items = [
    // --- Section 1: Demographics ---
    { match: /consent to participate/i, type: 'radio', target: 'Yes, I consent', isConsent: true },
    { match: /agree to be contacted/i, type: 'radio', target: answers.contact },
    { match: /what is your age/i, type: 'radio', target: answers.age },
    { match: /what is your gender/i, type: 'radio', target: answers.gender },
    { match: /where are you from/i, type: 'dropdown', target: 'Nepal', isCountry: true },
    { match: /where do you currently live/i, type: 'dropdown', target: 'Nepal', isCountry: true },
    { match: /employment status/i, type: 'radio', target: answers.employment },
    { match: /highest level of education/i, type: 'radio', target: answers.education },
    { match: /field of study/i, type: 'radio', target: answers.fieldOfStudy },
    { match: /member of a youth organization/i, type: 'radio', target: answers.youthOrg },
    { match: /type of community/i, type: 'radio', target: answers.community },
    { match: /lived, studied, or worked in a country other than/i, type: 'radio', target: answers.livedAbroad },

    // Section 2: Future of Work
    { match: /^(Q\d+:\s*)?Future of Work\s*$/i, type: 'break', target: 'Continue' },
    { match: /how prepared do you feel for the current job market/i, type: 'rating', target: answers.jobPrepRating },
    { match: /formal education equip you/i, type: 'rating', target: answers.formalEdEquipRating },
    { match: /rank the following three options based on where you acquired/i, type: 'ranking', target: answers.skillsAcquisitionRank },
    { match: /human-centric skills do you believe ai cannot replace/i, type: 'multiselect', target: answers.humanCentricSkills },
    { match: /how frequently do you productively use artificial intelligence/i, type: 'radio', target: answers.aiUsage },
    { match: /how concerned are you about ai replacing your job/i, type: 'rating', target: answers.aiConcernRating },
    { match: /traditional employment/i, type: 'rating', target: answers.traditionalEmploymentRating },
    { match: /alternative source of income, side hustle/i, type: 'radio', target: answers.sideHustle },
    { match: /primary financial concern for the next 2 years/i, type: 'dropdown', target: 'RANDOM' },
    { match: /structured real-world project, community initiative/i, type: 'radio', target: answers.realWorldProject },
    { match: /how much did that experience contribute to your professional/i, type: 'rating', target: answers.jobPrepRating || "4" },
    { match: /biggest barrier to gaining the skills/i, type: 'multiselect', target: answers.skillsBarrier },
    { match: /how important is it that your career has positive social/i, type: 'rating', target: answers.careerImpactRating },
    { match: /most urgent action you demand from companies and universities/i, type: 'text', target: answers.demandCompaniesText },

    // Section 3: Leadership & Youth Voice
    { match: /^(Q\d+:\s*)?(Youth Leadership|Leadership & Youth Voice)\s*$/i, type: 'break', target: 'Continue' },
    { match: /rank the following factors from 1 to 4 based on what defines a true leader/i, type: 'ranking', target: answers.leadershipFactorsRank },
    { match: /how many times have you self-initiated or led a community project/i, type: 'radio', target: answers.initiatedProjects },
    { match: /primary barrier preventing you from taking on a formal or informal leadership/i, type: 'dropdown', target: 'RANDOM' },
    { match: /young people today have genuine influence over decisions/i, type: 'rating', target: answers.youthInfluenceRating },
    { match: /which.*leadership competencies do you most need to develop/i, type: 'multiselect', target: answers.leadershipCompetencies },
    { match: /how supported do you feel by.*organizations around you/i, type: 'rating', target: answers.communitySupportRating },
    { match: /making decisions about real projects/i, type: 'rating', target: answers.decisionMakingRating },
    { match: /how comfortable and ready do you feel to.*claim and exercise a seat/i, type: 'rating', target: answers.leadershipReadinessRating },
    { match: /rate your level of trust in the following figures/i, type: 'radio', target: answers.trustInFigures },
    { match: /who has the strongest ability to positively influence society/i, type: 'ranking', target: answers.societyInfluenceRank },
    { match: /which action should they prioritize first/i, type: 'text', target: answers.priorityActionText },

    // Section 4 & 5: Mental Health
    { match: /^(Q\d+:\s*)?Mental Health\s*$/i, type: 'break', target: 'Continue' },
    { match: /overall, how would you rate your mental health/i, type: 'rating', target: answers.mentalHealthRating },
    { match: /mental health challenges or burnout limited your ability/i, type: 'rating', target: answers.burnoutRating },
    { match: /how comfortable would you feel disclosing and openly discussing/i, type: 'rating', target: answers.disclosingComfortRating },
    { match: /what are the top source of stress in your life/i, type: 'multiselect', target: answers.stressSources },
    { match: /organizations i belong to take mental health seriously/i, type: 'rating', target: answers.institutionMentalHealthRating },
    { match: /what concrete, accessible mental health resources does your educational/i, type: 'multiselect', target: answers.mentalHealthResources },
    { match: /when you feel overwhelmed or experience an emotional crisis/i, type: 'multiselect', target: answers.emotionalCrisisHelp },
    { match: /how much does uncertainty about the future.*impact your mental/i, type: 'rating', target: answers.futureUncertaintyImpact || answers.futureUncertaintyRating },
    { match: /young people today need more emotional resilience tools/i, type: 'rating', target: answers.resilienceToolsRating },
    { match: /rate how your university, school, or workplace currently performs regarding the following two aspects/i, type: 'matrix', target: answers.matrixPerformance || '3, 3' },
    { match: /artificial intelligence will create more opportunities than it eliminates/i, type: 'radio', target: answers.aiOpportunitiesOutlook },

    // Section 6: Global Engagement & Outlook
    { match: /biggest barrier preventing you from engaging more in global networks/i, type: 'radio', target: answers.globalEngageObstacle },
    { match: /^(Q\d+:\s*)?Global (Networks|Engagement)\s*$/i, type: 'break', target: 'Continue' },
    { match: /connection to international youth networks.*how many tangible opportunities/i, type: 'radio', target: answers.globalTangibleOpps },
    { match: /frequently do you participate in global-reaching actions/i, type: 'radio', target: answers.globalActionsFreq },
    { match: /knowledgeable do you consider yourself regarding.*multilateral organizations/i, type: 'rating', target: answers.multilateralKnowledgeRating },
    { match: /individual actions.*can influence global events/i, type: 'rating', target: answers.individualActionInfluenceRating },
    { match: /expect from international institutions and world leaders.*responding to current global conflicts/i, type: 'radio', target: answers.conflictResponseExpectation },
    { match: /how important is it that an organization you belong to has a global presence/i, type: 'rating', target: answers.orgGlobalPresenceRating },
    { match: /faced with current global context in this year 2026.*primary demand/i, type: 'text', target: answers.demandCompaniesText2026 },
    { match: /if you could change ONE thing about the way your generation is perceived/i, type: 'text', target: answers.youthVisionText },
    { match: /what do you believe is the single most urgent challenge young people face globally in 2026/i, type: 'text', target: answers.urgentChallengeText, isFinal: true }
  ];

  log(`Launching Chromium for Submission ${runIndex}/${totalRuns} (Headless: ${!isHeaded}, SlowMo: ${slowMo}ms)...`);
  const browser = await chromium.launch({ 
    headless: !isHeaded, 
    slowMo,
    devtools: isDebug
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);

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

    let completedSteps = 0;
    let safetyHalt = false;

    async function executeQuestionAction(activeItem, blockInfo) {
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
        const isCountry = Boolean(activeItem.isCountry) || /where are you from|where do you currently live/i.test(blockInfo.rawTitle || blockInfo.text);
        const searchVal = isCountry ? 'Nepal' : '';
        log(`    🔽 Dropdown question: isCountry=${isCountry}, searchVal="${searchVal}"`);

        // Step 1: Open the dropdown combobox trigger
        await page.evaluate(() => {
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => {
              const rect = el.getBoundingClientRect();
              const blockEl = el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || el.parentElement.parentElement;
              const bStyle = window.getComputedStyle(blockEl || el);
              const opacity = parseFloat(bStyle.opacity || '1');
              return { el, blockEl, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: (el.innerText||'').trim(), opacity };
            })
            .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text && c.opacity > 0.5);
          counters.sort((a, b) => a.dist - b.dist);
          const activeBlock = counters[0]?.blockEl || document.body;
          const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]') ||
                        activeBlock.querySelector('button');
          if (trig) {
            trig.scrollIntoView({ behavior: 'instant', block: 'center' });
            trig.click();
          }
        });

        // Step 2: Wait for dropdown list to appear, then type search
        await page.waitForTimeout(600);
        if (searchVal) {
          await page.keyboard.type(searchVal, { delay: 40 });
          await page.waitForTimeout(800);
        }

        // Step 3: Click the matching option in the listbox with full pointer events
        const optionClicked = await page.evaluate(({ query, isCountryTarget }) => {
          const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const q = clean(query);
          const selectors = [
            '[role="listbox"] [role="option"]',
            '[role="option"]',
            '[data-qa*="combobox-item"]',
            '[data-radix-popper-content-wrapper] [role="option"]',
            '[data-radix-popper-content-wrapper] li',
            'ul[role="listbox"] li',
            'li[data-value]'
          ];
          let options = [];
          for (const sel of selectors) {
            options = Array.from(document.querySelectorAll(sel)).filter(el => {
              const r = el.getBoundingClientRect();
              return r.width > 20 && r.height > 10;
            });
            if (options.length > 0) break;
          }

          let match = null;
          if (isCountryTarget) {
            match = options.find(el => clean(el.innerText || el.textContent || '').includes('nepal'));
            if (!match && options.length > 0) match = options[0];
          } else {
            if (options.length > 0) {
              const randIdx = Math.floor(Math.random() * options.length);
              match = options[randIdx];
            }
          }

          if (match) {
            match.scrollIntoView({ behavior: 'instant', block: 'center' });
            match.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
            match.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            match.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
            match.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            match.click();
            return (match.innerText || '').trim();
          }
          return 'no_options';
        }, { query: searchVal, isCountryTarget: isCountry });

        log(`    Dropdown option clicked (result=${optionClicked}): "${searchVal || 'RANDOM'}"`);
        await page.waitForTimeout(300);

        // Confirm selection via Enter (Do NOT press ArrowDown as it re-opens the dropdown)
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);

        // Clear any popper that didn't automatically close
        await dismissAnyOpenDropdown(page, 'after dropdown option click');

        // Step 4: Click OK button to confirm
        await page.evaluate(() => {
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => {
              const rect = el.getBoundingClientRect();
              const blockEl = el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || el.parentElement.parentElement;
              const bStyle = window.getComputedStyle(blockEl || el);
              const opacity = parseFloat(bStyle.opacity || '1');
              return { el, blockEl, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35), text: (el.innerText||'').trim(), opacity };
            })
            .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text && c.opacity > 0.5);
          counters.sort((a, b) => a.dist - b.dist);
          const activeBlock = counters[0]?.blockEl || document.body;
          const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
          if (ok) ok.click();
        });
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(400);

        // Ensure popper is completely gone after moving forward
        await dismissAnyOpenDropdown(page, 'after dropdown OK button');
      } else if (activeItem.type === 'rating') {
        const ratingVal = String(Math.floor(Math.random() * 4) + 2);
        const clicked = await page.evaluate((val) => {
          const clean = str => (str || '').replace(/\s+/g, ' ').trim();
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

          const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
          const match = buttons.find(b => (b.innerText || '').trim() === val) || buttons[Math.min(parseInt(val) - 1, buttons.length - 1)];
          if (match) {
            match.click();
            return true;
          }
          return false;
        }, ratingVal);

        await page.waitForTimeout(200);
        await page.keyboard.press(ratingVal);
        await page.waitForTimeout(300);

        await page.evaluate(() => {
          const clean = str => (str || '').replace(/\s+/g, ' ').trim();
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
      } else if (activeItem.type === 'multiselect') {
        await page.evaluate(() => {
          const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

          const rawBoxes = Array.from(activeBlock.querySelectorAll('[role="checkbox"], [data-qa*="choice"], button, label'));
          const validBoxes = rawBoxes.filter(el => {
            const rawText = (el.innerText || '').trim();
            const lower = rawText.toLowerCase();
            const qa = (el.getAttribute('data-qa') || '').toLowerCase();
            if (lower === 'ok' || lower === 'continue' || lower === 'submit' || lower.includes('press enter')) return false;
            if (qa.includes('ok-button') || qa.includes('submit') || qa.includes('continue')) return false;
            const r = el.getBoundingClientRect();
            return rawText.length > 0 && r.width > 20 && r.height > 15 && r.top >= -50 && r.top < window.innerHeight;
          });

          const uniqueBoxes = validBoxes.filter((el, idx) => {
            return !validBoxes.some((other, oIdx) => oIdx !== idx && other.contains(el));
          });
          const boxes = uniqueBoxes.length > 0 ? uniqueBoxes : validBoxes;

          if (boxes.length > 0) {
            const maxPick = Math.min(boxes.length, 3);
            const numToPick = Math.floor(Math.random() * maxPick) + 1;
            const shuffled = [...boxes].sort(() => 0.5 - Math.random());
            for (let i = 0; i < numToPick; i++) {
              shuffled[i].scrollIntoView({ behavior: 'instant', block: 'center' });
              shuffled[i].click();
            }
          }

          const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
            const t = (b.innerText || '').trim().toLowerCase();
            return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
          });
          if (ok) ok.click();
        });
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
      } else if (activeItem.type === 'ranking') {
        await page.evaluate(() => {
          const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

          const rawItems = Array.from(activeBlock.querySelectorAll('[aria-roledescription="sortable"], [data-qa*="choice"], [role="button"], button'));
          const validItems = rawItems.filter(el => {
            const rawText = (el.innerText || '').trim();
            const lower = rawText.toLowerCase();
            const qa = (el.getAttribute('data-qa') || '').toLowerCase();
            if (lower === 'ok' || lower === 'continue' || lower === 'submit' || lower.includes('press enter')) return false;
            if (qa.includes('ok-button') || qa.includes('submit') || qa.includes('continue')) return false;
            const r = el.getBoundingClientRect();
            return rawText.length > 0 && r.width > 20 && r.height > 15 && r.top >= -50 && r.top < window.innerHeight;
          });

          const uniqueItems = validItems.filter((el, idx) => {
            return !validItems.some((other, oIdx) => oIdx !== idx && other.contains(el));
          });
          const items = uniqueItems.length > 0 ? uniqueItems : validItems;

          if (items.length > 0) {
            const shuffled = [...items].sort(() => 0.5 - Math.random());
            for (const it of shuffled) {
              it.scrollIntoView({ behavior: 'instant', block: 'center' });
              it.click();
            }
          }

          const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
            const t = (b.innerText || '').trim().toLowerCase();
            return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
          });
          if (ok) ok.click();
        });
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
      } else if (activeItem.type === 'matrix') {
        log('    🧩 Solving Question 16 Dual Ranking (Aspect 1: Talk + Aspect 2: Action)...');

        // Locate and inspect the two aspect blocks inside Q16
        const q16Info = await page.evaluate(() => {
          const clean = str => (str || '').replace(/\s+/g, ' ').trim();
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

          const blocks = Array.from(activeBlock.querySelectorAll('div[data-qa="block"]'));
          return blocks.map((b, bIdx) => {
            const label = clean(b.querySelector('label')?.innerText);
            const sortables = Array.from(b.querySelectorAll('[aria-roledescription="sortable"], li div[role="button"]')).map(s => {
              const r = s.getBoundingClientRect();
              return {
                text: clean(s.innerText),
                cx: Math.round(r.left + r.width / 2),
                cy: Math.round(r.top + r.height / 2)
              };
            });
            const comboboxes = Array.from(b.querySelectorAll('button[role="combobox"]')).map(cb => {
              const r = cb.getBoundingClientRect();
              return {
                text: clean(cb.innerText),
                cx: Math.round(r.left + r.width / 2),
                cy: Math.round(r.top + r.height / 2)
              };
            });
            return { bIdx, label, sortables, comboboxes };
          });
        });

        log(`    Found ${q16Info.length} aspect blocks in Q16.`);

        // Solve each aspect block
        for (let bIdx = 0; bIdx < q16Info.length; bIdx++) {
          const info = q16Info[bIdx];
          log(`    ▶ Ranking Aspect ${bIdx + 1}: "${info.label.slice(0, 45)}..."`);

          // Ensure the aspect block is scrolled into viewport center
          const sortablePos = await page.evaluate((idx) => {
            const blocks = Array.from(document.querySelectorAll('div[data-qa="block"]'));
            const b = blocks[idx];
            if (!b) return null;
            b.scrollIntoView({ behavior: 'instant', block: 'center' });
            const s = b.querySelector('[aria-roledescription="sortable"], li div[role="button"]');
            if (s) {
              s.scrollIntoView({ behavior: 'instant', block: 'center' });
              s.focus();
              const r = s.getBoundingClientRect();
              return {
                cx: Math.round(r.left + r.width / 2),
                cy: Math.round(r.top + r.height / 2)
              };
            }
            return null;
          }, bIdx);

          // Strategy 1: Keyboard DnD nudge (Space -> ArrowDown -> Space) on first sortable
          if (sortablePos) {
            log(`      [Aspect ${bIdx + 1}] Trying Keyboard DnD on first sortable (${sortablePos.cx}, ${sortablePos.cy})...`);
            await page.mouse.click(sortablePos.cx, sortablePos.cy);
            await page.waitForTimeout(250);
            await page.keyboard.press('Space');
            await page.waitForTimeout(200);
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(200);
            await page.keyboard.press('Space');
            await page.waitForTimeout(350);
          }

          // Check if aspect is now ranked
          let currentStatus = await page.evaluate((idx) => {
            const clean = str => (str || '').replace(/\s+/g, ' ').trim();
            const blocks = Array.from(document.querySelectorAll('div[data-qa="block"]'));
            const b = blocks[idx];
            if (!b) return [];
            return Array.from(b.querySelectorAll('button[role="combobox"]')).map(cb => clean(cb.innerText));
          }, bIdx);
          log(`      [Aspect ${bIdx + 1}] Combobox status after DnD: [${currentStatus.join(', ')}]`);

          // Strategy 2: If still unranked, scroll and click each sortable item in this block
          if (currentStatus.some(v => v === '-' || !v)) {
            log(`      [Aspect ${bIdx + 1}] Clicking all sortables sequentially...`);
            await page.evaluate((idx) => {
              const blocks = Array.from(document.querySelectorAll('div[data-qa="block"]'));
              const b = blocks[idx];
              if (!b) return;
              b.scrollIntoView({ behavior: 'instant', block: 'center' });
              const sortables = Array.from(b.querySelectorAll('[aria-roledescription="sortable"], li div[role="button"]'));
              for (const s of sortables) {
                s.scrollIntoView({ behavior: 'instant', block: 'center' });
                s.click();
              }
            }, bIdx);
            await page.waitForTimeout(400);
          }

          // Check status again
          currentStatus = await page.evaluate((idx) => {
            const clean = str => (str || '').replace(/\s+/g, ' ').trim();
            const blocks = Array.from(document.querySelectorAll('div[data-qa="block"]'));
            const b = blocks[idx];
            if (!b) return [];
            return Array.from(b.querySelectorAll('button[role="combobox"]')).map(cb => clean(cb.innerText));
          }, bIdx);
          log(`      [Aspect ${bIdx + 1}] Combobox status after clicking items: [${currentStatus.join(', ')}]`);

          // Strategy 3: Radix dropdown selection for any remaining '-' comboboxes
          if (currentStatus.some(v => v === '-' || !v)) {
            log(`      [Aspect ${bIdx + 1}] Fallback to Radix combobox dropdowns with scroll...`);
            for (let cIdx = 0; cIdx < 4; cIdx++) {
              const comboOpened = await page.evaluate(({ idx, c }) => {
                const blocks = Array.from(document.querySelectorAll('div[data-qa="block"]'));
                const b = blocks[idx];
                if (!b) return false;
                b.scrollIntoView({ behavior: 'instant', block: 'center' });
                const cbs = Array.from(b.querySelectorAll('button[role="combobox"]'));
                const cb = cbs[c];
                if (cb && (cb.innerText || '').trim() === '-') {
                  cb.scrollIntoView({ behavior: 'instant', block: 'center' });
                  cb.click();
                  return true;
                }
                return false;
              }, { idx: bIdx, c: cIdx });

              if (comboOpened) {
                await page.waitForTimeout(300);
                const picked = await page.evaluate((targetNum) => {
                  const poppers = Array.from(document.querySelectorAll('[data-radix-popper-content-wrapper], [role="listbox"]'));
                  for (const pop of poppers) {
                    const opts = Array.from(pop.querySelectorAll('[role="option"], [data-radix-collection-item], div, span'));
                    const match = opts.find(o => (o.innerText || '').trim() === String(targetNum));
                    if (match) {
                      match.click();
                      return true;
                    }
                  }
                  return false;
                }, cIdx + 1);

                if (!picked) {
                  await page.keyboard.press(String(cIdx + 1));
                  await page.waitForTimeout(100);
                  await page.keyboard.press('Enter');
                }
                await page.waitForTimeout(250);
              }
            }
          }
        }

        // Final verification of Q16 ranks
        const finalQ16Check = await page.evaluate(() => {
          const clean = str => (str || '').replace(/\s+/g, ' ').trim();
          const blocks = Array.from(document.querySelectorAll('div[data-qa="block"]'));
          return blocks.map((b, i) => ({
            aspect: i + 1,
            ranks: Array.from(b.querySelectorAll('button[role="combobox"]')).map(cb => clean(cb.innerText))
          }));
        });
        log(`    Q16 Final Ranks: ${JSON.stringify(finalQ16Check)}`);

        // Step 3: Click OK and Press Enter
        await page.evaluate(() => {
          const clean = str => (str || '').replace(/\s+/g, ' ').trim();
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

          const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => {
            const t = clean(b.innerText).toLowerCase();
            const qa = (b.getAttribute('data-qa') || '').toLowerCase();
            return t === 'ok' || qa.includes('partial-submission-button') || qa.includes('ok-button');
          }) || Array.from(document.querySelectorAll('button')).find(b => {
            const t = clean(b.innerText).toLowerCase();
            const qa = (b.getAttribute('data-qa') || '').toLowerCase();
            return t === 'ok' || qa.includes('partial-submission-button') || qa.includes('ok-button');
          });

          if (ok) {
            ok.scrollIntoView({ behavior: 'instant', block: 'center' });
            ok.click();
          }
        });
        await page.waitForTimeout(400);
        await page.keyboard.press('Enter');
        await dismissAnyOpenDropdown(page, 'after Q16 matrix');
      } else if (activeItem.type === 'text') {
        let textToFill = '';
        const qTitle = (blockInfo.rawTitle || blockInfo.text || '').toLowerCase();
        if (qTitle.includes('urgent action') || qTitle.includes('demand from companies')) {
          textToFill = synthesizeDynamicText('future_of_work_demand');
        } else if (qTitle.includes('prioritize first') || qTitle.includes('action should they prioritize')) {
          textToFill = synthesizeDynamicText('youth_leadership_action');
        } else if (qTitle.includes('2026') && qTitle.includes('primary demand')) {
          textToFill = synthesizeDynamicText('world_leader_speech');
        } else if (qTitle.includes('change one thing') || qTitle.includes('perceived')) {
          textToFill = synthesizeDynamicText('youth_vision_summary');
        } else if (qTitle.includes('urgent challenge') || qTitle.includes('face globally')) {
          textToFill = synthesizeDynamicText('urgent_challenge');
        } else {
          textToFill = synthesizeDynamicText('future_of_work_demand');
        }
        log(`    ✍️ Dynamic AI Text Answer: "${textToFill}"`);

        // Locate input or textarea specifically inside the visible active question card
        const inputInfo = await page.evaluate(() => {
          const clean = str => (str || '').replace(/\s+/g, ' ').trim();
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

          let inp = activeBlock.querySelector('textarea, input[type="text"], input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])');
          if (!inp) {
            const allInps = Array.from(document.querySelectorAll('textarea, input[type="text"]'));
            inp = allInps.find(el => {
              const r = el.getBoundingClientRect();
              return r.width > 50 && r.height > 20 && r.top >= 50 && r.top < window.innerHeight - 50;
            });
          }

          if (inp) {
            const r = inp.getBoundingClientRect();
            return {
              found: true,
              tag: inp.tagName,
              cx: Math.round(r.left + r.width / 2),
              cy: Math.round(r.top + r.height / 2)
            };
          }
          return { found: false };
        });

        if (inputInfo.found) {
          await page.mouse.click(inputInfo.cx, inputInfo.cy);
          await page.waitForTimeout(150);
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Backspace');
          await page.waitForTimeout(100);
          await page.keyboard.type(textToFill, { delay: 15 });
          await page.waitForTimeout(200);

          await page.evaluate((val) => {
            const el = document.activeElement;
            if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
              el.value = val;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, textToFill);
          await page.waitForTimeout(200);
        } else {
          log('    ⚠️ Fallback focusing on input box...');
          await page.keyboard.press('Tab');
          await page.keyboard.type(textToFill, { delay: 15 });
        }

        if (activeItem.isFinal) {
          if (autoSubmit) {
            log(`\n🚀 Auto-submitting final question for Submission ${runIndex}/${totalRuns}...`);
            await page.evaluate(() => {
              const submitBtn = Array.from(document.querySelectorAll('button')).find(b => {
                const t = (b.innerText || '').trim().toLowerCase();
                return t === 'submit' || (b.getAttribute('data-qa') || '').includes('submit');
              });
              if (submitBtn) submitBtn.click();
            });
            await page.keyboard.press('Control+Enter');
            await page.waitForTimeout(800);
            await page.keyboard.press('Enter');

            log('    Waiting for submission confirmation...');
            await page.waitForTimeout(3500);

            const finalScreenshot = path.join(SCREENSHOTS_DIR, `submission_${runIndex}_submitted.png`);
            await page.screenshot({ path: finalScreenshot, fullPage: true }).catch(() => {});
            log(`🎉 Survey #${runIndex} submitted! Confirmation screenshot: ${finalScreenshot}`);
            return { success: true, submitted: true, safetyHalt: true };
          } else {
            log(`\n🛑 Dry-run mode: Final question reached for Submission ${runIndex}/${totalRuns}! Halting before submission.`);
            await page.waitForTimeout(1000);
            const finalScreenshot = path.join(SCREENSHOTS_DIR, `submission_${runIndex}_preview.png`);
            await page.screenshot({ path: finalScreenshot, fullPage: true }).catch(() => {});
            log(`Saved verification screenshot to: ${finalScreenshot}`);
            return { success: true, submitted: false, safetyHalt: true };
          }
        } else {
          // Advance via OK button and Control+Enter
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
          await page.keyboard.press('Control+Enter');
          await page.waitForTimeout(300);
          await page.keyboard.press('Enter');
        }
      } else {
        // Radio / Choice / Dropdown or Choice
        const res = await page.evaluate(({ isConsent, isCountry, targetText }) => {
          const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

          // Strict consent handling
          if (isConsent) {
            const allElements = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"], label'));
            const consentBtn = allElements.find(b => clean(b.innerText).includes('yesi consent') || clean(b.innerText).includes('consent'));
            if (consentBtn) {
              consentBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
              consentBtn.click();
              return { action: 'clicked_consent', text: consentBtn.innerText };
            }
          }

          // Find all valid choices on this card
          const rawButtons = Array.from(activeBlock.querySelectorAll('[role="radio"], [data-qa*="choice"], button, label'));
          const validButtons = rawButtons.filter(el => {
            const raw = (el.innerText || '').trim();
            const lower = raw.toLowerCase();
            const qa = (el.getAttribute('data-qa') || '').toLowerCase();
            if (lower === 'ok' || lower === 'continue' || lower === 'submit' || lower.includes('press enter')) return false;
            if (qa.includes('ok-button') || qa.includes('submit') || qa.includes('continue')) return false;
            if (lower === 'other' || lower.endsWith('\nother') || lower.includes('\nother')) return false;
            const r = el.getBoundingClientRect();
            return raw.length > 0 && r.width > 20 && r.height > 15 && r.top >= -50 && r.top < window.innerHeight;
          });

          const uniqueButtons = validButtons.filter((el, idx) => {
            return !validButtons.some((other, oIdx) => oIdx !== idx && other.contains(el));
          });
          const choices = uniqueButtons.length > 0 ? uniqueButtons : validButtons;

          // Pick a random choice from all available choices on screen
          if (choices.length > 0) {
            const randIdx = Math.floor(Math.random() * choices.length);
            const picked = choices[randIdx];
            picked.scrollIntoView({ behavior: 'instant', block: 'center' });
            picked.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
            picked.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            picked.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
            picked.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            picked.click();
            return { action: 'clicked_random', text: picked.innerText.trim(), index: randIdx + 1, total: choices.length };
          }

          // If no choices found on card, check for combobox trigger
          const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]');
          if (trig) {
            trig.scrollIntoView({ behavior: 'instant', block: 'center' });
            trig.click();
            return { action: 'opened_combobox' };
          }

          return { action: 'no_match' };
        }, { isConsent: Boolean(activeItem.isConsent), isCountry: Boolean(activeItem.isCountry), targetText: activeItem.target });

        if (res?.action === 'clicked_random') {
          log(`    🎲 Randomly picked choice [${res.index}/${res.total}]: "${res.text.slice(0, 40)}"`);
        } else if (res?.action === 'clicked_target') {
          log(`    🎯 Selected target choice: "${res.text.slice(0, 40)}"`);
        }

        if (res?.action === 'opened_combobox') {
          const isCountry = Boolean(activeItem.isCountry) || /nepal/i.test(activeItem.target || '');
          const searchVal = isCountry ? 'Nepal' : ((activeItem.target || '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/)[0] || '');
          await page.waitForTimeout(300);
          if (searchVal) {
            await page.keyboard.type(searchVal, { delay: 40 });
            await page.waitForTimeout(400);
          }
          await page.evaluate((isCountryTarget) => {
            const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [data-radix-popper-content-wrapper] [role="option"], [data-radix-popper-content-wrapper] li, [data-qa*="combobox-item"], [role="option"], li'))
              .filter(el => el.getBoundingClientRect().height > 10);

            let match = null;
            if (isCountryTarget) {
              match = options.find(el => clean(el.innerText || el.textContent).includes('nepal'));
              if (!match && options.length > 0) match = options[0];
            } else {
              if (options.length > 0) {
                const randIdx = Math.floor(Math.random() * options.length);
                match = options[randIdx];
              }
            }
            if (match) {
              match.scrollIntoView({ behavior: 'instant', block: 'center' });
              match.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
              match.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
              match.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
              match.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
              match.click();
            }
          }, isCountry);
          await page.waitForTimeout(300);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(200);

          await dismissAnyOpenDropdown(page, 'after opened_combobox option click');

          await page.evaluate(() => {
            const clean = str => (str || '').replace(/\s+/g, ' ').trim();
            const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
              .map(el => ({ el, top: el.getBoundingClientRect().top }))
              .filter(c => c.top >= -50 && c.top < window.innerHeight);
            counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
            const activeBlock = counters[0]?.blockEl || document.body;
            const ok = activeBlock.querySelector('button[data-qa*="ok-button"]');
            if (ok) ok.click();
          });
          await page.keyboard.press('Enter');
          await page.waitForTimeout(300);
          await dismissAnyOpenDropdown(page, 'after opened_combobox OK button');
        } else {
          // If OK button is present for radio questions, click it
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
      return { success: true };
    }

    while (completedSteps < 150 && !safetyHalt) {
      completedSteps++;
      await page.waitForTimeout(400);

      // Pre-step guard: Clear any lingering dropdown or popper from a previous screen
      await dismissAnyOpenDropdown(page, `Step ${completedSteps} start guard`);

      const before = await getActiveBlock(page);

      // Match against known rules
      let activeItem = items.find(it => it.match.test(before.rawTitle) || it.match.test(before.text));
      if (!activeItem && (before.type === 'statement' || /future of work|youth leadership|mental health|global engagement/i.test(before.rawTitle))) {
        activeItem = { type: 'break', target: 'Continue' };
      }

      // Auto-fallback widget inspection if unknown dynamic question
      if (!activeItem) {
        log(`ℹ️ Auto-inspecting dynamic question [${before.counter}]: "${before.title}"`);
        const widgetType = await page.evaluate(() => {
          const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
            .map(el => ({ el, top: el.getBoundingClientRect().top }))
            .filter(c => c.top >= -50 && c.top < window.innerHeight);
          counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
          const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

          if (activeBlock.querySelector('textarea, input[type="text"]')) return 'text';
          if (activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]')) return 'dropdown';
          if (activeBlock.querySelectorAll('fieldset [role="radio"], [data-qa*="matrix"]').length >= 4) return 'matrix';
          const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="button"]'));
          if (buttons.some(b => /^[1-5]$/.test((b.innerText || '').trim()))) return 'rating';
          if (activeBlock.querySelectorAll('[role="checkbox"]').length > 0) return 'multiselect';
          return 'radio';
        });

        if (widgetType === 'rating') {
          activeItem = { type: 'rating', target: '4' };
        } else if (widgetType === 'text') {
          const generatedText = await generateWithOnlineAI(`Answer question: ${before.title}`, "general", "Prioritize sustainable youth innovation, equitable education, and practical skills.");
          activeItem = { type: 'text', target: generatedText };
        } else {
          activeItem = { type: 'radio', target: 'Yes' };
        }
      }

      log(`\n[STEP ${completedSteps}] Screen [${before.counter}]: "${before.title.slice(0, 65)}" -> ${activeItem.type.toUpperCase()}`);
      log(`    Dynamic Target: ${Array.isArray(activeItem.target) ? activeItem.target.join(', ') : activeItem.target}`);

      // Primary Execution
      const execRes = await executeQuestionAction(activeItem, before);
      if (execRes?.safetyHalt) {
        safetyHalt = true;
        return execRes;
      }

      const after = await waitForActiveBlockToChange(page, before.title);
      log(`    Result Screen After: "${after.title}"`);

      // BACKUP MECHANISM: If card did not advance, click empty space to clear any lingering dropdown/overlay and re-attempt
      if (after.title === before.title && !activeItem.isFinal) {
        log(`⚠️ Card did not advance on Step ${completedSteps} [${before.counter}].`);
        log(`    🔄 [BACKUP ACTIVATED] Clicking empty space to remove lingering dropdown and retrying question...`);

        // 1. Click on empty space & dismiss any dropdown
        await clickEmptySpaceAndClearDropdown(page, `stuck on Step ${completedSteps} [${before.counter}]`);
        await page.waitForTimeout(350);

        // 2. Re-acquire active block to ensure fresh DOM state
        const currentActive = await getActiveBlock(page);
        log(`    🔁 Re-attempting question [${currentActive.counter}]: "${currentActive.title.slice(0, 50)}"...`);

        // 3. Re-execute question action
        const retryRes = await executeQuestionAction(activeItem, currentActive);
        if (retryRes?.safetyHalt) {
          safetyHalt = true;
          return retryRes;
        }

        // 4. Check if screen advanced after backup retry
        const afterRetry = await waitForActiveBlockToChange(page, before.title, 3500);
        log(`    Result Screen After Backup Retry: "${afterRetry.title}"`);

        if (afterRetry.title !== before.title) {
          log(`    ✅ Backup recovery successful! Screen advanced to: "${afterRetry.title}"`);
        } else {
          log(`    ⚠️ Card still on same screen. Attempting keyboard confirm (Enter)...`);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
          const afterEnter = await waitForActiveBlockToChange(page, before.title, 2000);
          if (afterEnter.title === before.title) {
            log(`⏭️ Force-skipping stuck step ${completedSteps} after backup & retries. Screen: "${before.title.slice(0,60)}"`);
            await page.keyboard.press('Tab');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(600);
          }
        }
      }
    }

    log(`\n🎉 Survey completed for Submission ${runIndex}/${totalRuns}!`);
    return { success: true, submitted: autoSubmit };

  } catch (err) {
    log(`\n💥 RUNNER ERROR on Submission ${runIndex}/${totalRuns}: ${err.message}\n${err.stack}`);
    const errScreenshot = path.join(SCREENSHOTS_DIR, `submission_${runIndex}_error.png`);
    await page.screenshot({ path: errScreenshot, fullPage: true }).catch(() => {});
    throw err;
  } finally {
    if (!keepOpen || !browser.isConnected()) {
      await browser.close().catch(() => {});
      log(`Browser closed for Submission ${runIndex}/${totalRuns}.\n`);
    }
  }
}

// Main Batch Loop
(async () => {
  const args = process.argv.slice(2);
  const isHeaded = args.includes('--headed') || process.env.HEADED === 'true';
  const isDebug = args.includes('--debug') || process.env.PWDEBUG === '1';
  const keepOpen = args.includes('--keep-open');
  const noSubmit = args.includes('--no-submit') || args.includes('--dry-run');
  const autoSubmit = !noSubmit;

  let targetCount = 30; // Default to 30 submissions as requested!
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      targetCount = parseInt(args[i + 1], 10) || 30;
    } else if (args[i].startsWith('--count=')) {
      targetCount = parseInt(args[i].split('=')[1], 10) || 30;
    }
  }

  log('================================================================');
  log(`🚀 STARTING BATCH TYPEFORM AUTOMATION (${targetCount} SUBMISSIONS)`);
  log(`🎯 Target URL: ${FORM_URL}`);
  log(`⚙️ Config: Headed=${isHeaded} | Auto-Submit=${autoSubmit} | Target Count=${targetCount}`);
  log('================================================================\n');

  let successCount = 0;
  let failureCount = 0;

  for (let i = 1; i <= targetCount; i++) {
    log(`\n################################################################`);
    log(`▶ SUBMISSION ${i} OF ${targetCount} IN PROGRESS...`);
    log(`################################################################`);

    try {
      const res = await fillSingleForm(i, targetCount, {
        isHeaded,
        isDebug,
        keepOpen,
        autoSubmit
      });
      if (res?.submitted) {
        successCount++;
        log(`✅ Submission ${i}/${targetCount} submitted successfully! (Total success: ${successCount})`);
      } else {
        successCount++;
        log(`⏸️ Submission ${i}/${targetCount} filled (dry-run preview).`);
      }
    } catch (err) {
      failureCount++;
      log(`❌ Submission ${i}/${targetCount} encountered an error: ${err.message}`);
    }

    if (i < targetCount) {
      const cooldownSec = 3;
      log(`⏳ Waiting ${cooldownSec}s before launching next submission (${i + 1}/${targetCount})...`);
      await new Promise(r => setTimeout(r, cooldownSec * 1000));
    }
  }

  log('\n================================================================');
  log('🏁 ALL BATCH SUBMISSIONS COMPLETED!');
  log(`📊 Final Results:`);
  log(`   - Total Target:   ${targetCount}`);
  log(`   - ✅ Successful:   ${successCount}`);
  log(`   - ❌ Failed:       ${failureCount}`);
  log('================================================================\n');
})();
