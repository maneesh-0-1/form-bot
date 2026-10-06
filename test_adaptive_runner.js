const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { generateUniqueSurveyResponses } = require('./ai_response_generator');

const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';
const SCREENSHOTS_DIR = path.join(__dirname, 'debug_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

(async () => {
  const dynamicProfile = await generateUniqueSurveyResponses();
  const { persona, answers } = dynamicProfile;
  console.log(`👤 Persona: [${persona.role}] from ${persona.country} (${persona.age}, ${persona.gender})`);

  const browser = await chromium.launch({ headless: true, slowMo: 40 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto(FORM_URL, { waitUntil: 'domcontentloaded' });
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

  async function waitForActiveBlockToChange(oldTitle, maxWaitMs = 3500) {
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
    // --- Section 1: Demographics ---
    { match: /consent/i, type: 'radio', target: answers.consent },
    { match: /agree to be contacted/i, type: 'radio', target: answers.contact },
    { match: /what is your age/i, type: 'radio', target: answers.age, altTargets: ["22-25", "–25", "-25", "25", "Under 25", "18–25"] },
    { match: /what is your gender/i, type: 'radio', target: answers.gender },
    { match: /where are you from/i, type: 'dropdown', target: answers.originCountry },
    { match: /where do you currently live/i, type: 'dropdown', target: answers.currentCountry },
    { match: /employment status/i, type: 'radio', target: answers.employment, altTargets: ["Full-time", "Part-time", "Self-employed", "Unemployed", "student"] },
    { match: /highest level of education/i, type: 'radio', target: answers.education, altTargets: ["Bachelor", "Bachelor's degree", "Master", "Vocational"] },
    { match: /field of study/i, type: 'radio', target: answers.fieldOfStudy, altTargets: ["STEM", "Business", "Social", "Arts", "Healthcare"] },
    { match: /member of a youth organization/i, type: 'radio', target: answers.youthOrg, altTargets: ["Yes, actively", "Yes, occasionally", "No, but interested", "Yes", "actively"] },
    { match: /type of community/i, type: 'radio', target: answers.community, altTargets: ["Mid-sized city", "Urban", "Megacity", "Small town"] },
    { match: /lived, studied, or worked in a country other than/i, type: 'radio', target: answers.livedAbroad, altTargets: ["No, but I plan to", "Yes", "No"] },

    // Section Breaks
    { match: /future of work/i, type: 'break', target: "Continue" },
    { match: /youth leadership/i, type: 'break', target: "Continue" },
    { match: /mental health/i, type: 'break', target: "Continue" },
    { match: /global engagement|global outlook/i, type: 'break', target: "Continue" },

    // Section 2: Future of Work
    { match: /how prepared do you feel for the current job market/i, type: 'rating', target: answers.jobPrepRating },
    { match: /formal education equip you/i, type: 'rating', target: answers.formalEdEquipRating },
    { match: /rank the following three options based on where you acquired/i, type: 'ranking', target: Array.isArray(answers.skillsAcquisitionRank) ? answers.skillsAcquisitionRank.join(', ') : answers.skillsAcquisitionRank },
    { match: /human-centric skills do you believe ai cannot replace/i, type: 'multiselect', target: Array.isArray(answers.humanCentricSkills) ? answers.humanCentricSkills.join(', ') : answers.humanCentricSkills },
    { match: /how frequently do you productively use artificial intelligence/i, type: 'radio', target: answers.aiUsage, altTargets: ["Daily", "Weekly", "Several times", "Occasionally"] },
    { match: /how concerned are you about ai replacing your job/i, type: 'rating', target: answers.aiConcernRating },
    { match: /traditional employment/i, type: 'rating', target: answers.traditionalEmploymentRating },
    { match: /alternative source of income, side hustle/i, type: 'radio', target: answers.sideHustle, altTargets: ["No", "Yes"] },
    { match: /primary financial concern for the next 2 years/i, type: 'dropdown_or_choice', target: answers.financialConcern, altTargets: ["Inflation", "rising cost", "first job", "Housing", "Cost of living"] },
    { match: /structured real-world project, community initiative/i, type: 'radio', target: answers.realWorldProject, altTargets: ["want to", "Yes", "No"] },
    { match: /biggest barrier to gaining the skills/i, type: 'multiselect', target: Array.isArray(answers.skillsBarrier) ? answers.skillsBarrier.join(', ') : answers.skillsBarrier },
    { match: /how important is it that your career has positive social/i, type: 'rating', target: answers.careerImpactRating },
    { match: /to secure the future of work for your generation/i, type: 'text', target: answers.demandCompaniesText },

    // Section 3: Leadership & Youth Voice
    { match: /rank the following factors from 1 to 4 based on what defines a true leader/i, type: 'ranking', target: Array.isArray(answers.leadershipFactorsRank) ? answers.leadershipFactorsRank.join(', ') : answers.leadershipFactorsRank },
    { match: /how many times have you self-initiated or led a community project/i, type: 'radio', target: answers.initiatedProjects, altTargets: ["Once", "2–3", "Never", "1-2"] },
    { match: /primary barrier preventing you from taking on a formal or informal leadership/i, type: 'dropdown_or_choice', target: answers.leadershipBarrier, altTargets: ["Systemic", "networks", "experience", "Fear"] },
    { match: /young people today have genuine influence over decisions/i, type: 'rating', target: answers.youthInfluenceRating },
    { match: /which of these leadership competencies/i, type: 'multiselect', target: Array.isArray(answers.leadershipCompetencies) ? answers.leadershipCompetencies.join(', ') : answers.leadershipCompetencies },
    { match: /how supported do you feel by.*organizations around you/i, type: 'rating', target: answers.communitySupportRating },
    { match: /making decisions about real projects/i, type: 'rating', target: answers.decisionMakingRating },
    { match: /how comfortable and ready do you feel to.*claim and exercise a seat/i, type: 'rating', target: answers.leadershipReadinessRating },
    { match: /rate your level of trust in the following figures/i, type: 'radio', target: answers.trustInFigures, altTargets: ["Emerging", "Community", "Academic", "Scientific"] },
    { match: /who has the strongest ability to positively influence society/i, type: 'ranking', target: Array.isArray(answers.societyInfluenceRank) ? answers.societyInfluenceRank.join(', ') : answers.societyInfluenceRank },
    { match: /if governments, organizations and businesses want to effectively increase youth leadership/i, type: 'text', target: answers.priorityActionText },

    // Section 4 & 5: Mental Health
    { match: /overall, how would you rate your mental health/i, type: 'rating', target: answers.mentalHealthRating },
    { match: /mental health challenges or burnout limited your ability/i, type: 'rating', target: answers.burnoutRating },
    { match: /how comfortable would you feel disclosing and openly discussing/i, type: 'rating', target: answers.disclosingComfortRating },
    { match: /what are the top source of stress in your life/i, type: 'multiselect', target: Array.isArray(answers.stressSources) ? answers.stressSources.join(', ') : answers.stressSources },
    { match: /organizations i belong to take mental health seriously/i, type: 'rating', target: answers.institutionMentalHealthRating },
    { match: /what concrete, accessible mental health resources does your educational/i, type: 'multiselect', target: Array.isArray(answers.mentalHealthResources) ? answers.mentalHealthResources.join(', ') : answers.mentalHealthResources },
    { match: /when you feel overwhelmed or experience an emotional crisis/i, type: 'multiselect', target: Array.isArray(answers.emotionalCrisisHelp) ? answers.emotionalCrisisHelp.join(', ') : answers.emotionalCrisisHelp },
    { match: /how much does uncertainty about the future.*impact your mental/i, type: 'rating', target: answers.futureUncertaintyRating },
    { match: /young people today need more emotional resilience tools/i, type: 'rating', target: answers.resilienceToolsRating },
    { match: /rate how your university, school, or workplace currently performs regarding the following two aspects/i, type: 'matrix', target: answers.matrixPerformance },
    { match: /artificial intelligence will create more opportunities than it eliminates/i, type: 'radio', target: answers.aiOpportunitiesOutlook, altTargets: ["opportunity", "more opportunities", "create more opportunities"] },

    // Section 6: Global Engagement & Outlook
    { match: /how often do you follow international news/i, type: 'radio', target: answers.internationalNewsFreq, altTargets: ["Monthly", "Weekly", "Daily"] },
    { match: /how knowledgeable do you feel about the sustainable development goals/i, type: 'rating', target: answers.sdgKnowledgeRating },
    { match: /how much do you feel your individual actions can contribute/i, type: 'rating', target: answers.individualActionRating },
    { match: /which global institution do you have the most trust in/i, type: 'radio', target: answers.globalInstitutionTrust, altTargets: ["Nothing", "lost faith", "United Nations", "WHO"] },
    { match: /what is the greatest obstacle preventing you from engaging/i, type: 'radio', target: answers.engagingObstacle, altTargets: ["No local", "entry point", "financial", "time"] },
    { match: /how optimistic are you that global cooperation can solve/i, type: 'rating', target: answers.globalCooperationRating },
    { match: /faced with rapid global change, what is the single most important skill/i, type: 'text', target: answers.importantSkillText },
    { match: /if you had 5 minutes with a world leader/i, type: 'text', target: answers.worldLeaderText },
    { match: /in one or two sentences, summarize your vision/i, type: 'text', target: answers.youthVisionText },
    { match: /what is the single most urgent challenge the world must address by 2030/i, type: 'text', target: answers.urgentChallengeText, isFinal: true }
  ];

  let stepCount = 0;
  let safetyHalt = false;

  while (stepCount < 75 && !safetyHalt) {
    stepCount++;
    await page.waitForTimeout(400);
    const before = await getActiveBlock();

    // Dynamically match rule against active screen
    let activeItem = items.find(it => it.match.test(before.rawTitle) || it.match.test(before.text));
    if (!activeItem && before.type === 'statement') {
      activeItem = { type: 'break', target: 'Continue' };
    }

    if (!activeItem) {
      console.log(`⚠️ Unmatched screen [${before.counter}]: "${before.title}"`);
      // Try generic button click
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      continue;
    }

    console.log(`\n[STEP ${stepCount}] Screen [${before.counter}]: "${before.title.slice(0, 60)}" -> Type: ${activeItem.type.toUpperCase()}`);
    console.log(`    Dynamic Target: ${activeItem.target}`);

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
      const searchVal = (activeItem.target || '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/)[0] || 'Nepal';
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
    } else if (activeItem.type === 'ranking' || activeItem.type === 'multiselect') {
      await page.evaluate((val) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        const parts = val.split(',').map(s => s.trim()).filter(Boolean);
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="checkbox"], [role="button"], label'));
        for (const part of parts) {
          const cleanPart = clean(part);
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
      }, activeItem.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'matrix') {
      const matrixVals = (activeItem.target || '3, 3').split(',').map(s => s.trim());
      await page.evaluate((vals) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        const rowGroups = Array.from(activeBlock.querySelectorAll('fieldset, [role="radiogroup"], [data-qa*="matrix-row"], [data-qa*="row"]'));
        if (rowGroups.length >= 2) {
          rowGroups.forEach((row, i) => {
            const v = vals[i] || '3';
            const buttons = Array.from(row.querySelectorAll('button, [role="radio"], [role="button"], label'));
            const targetBtn = buttons.find(b => (b.innerText || '').trim() === v) || buttons[Math.min(parseInt(v) - 1, buttons.length - 1)];
            if (targetBtn) targetBtn.click();
          });
        }
        const okBtn = Array.from(activeBlock.querySelectorAll('button')).find(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return t === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button');
        });
        if (okBtn) okBtn.click();
      }, matrixVals);
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
        console.log('\n🛑 STRICT SAFETY RULE ENFORCED: Final question reached! Answered with generated text and safely halting BEFORE submission.');
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
          return { action: 'clicked_first', text: buttons[0].innerText };
        }
        return { action: 'no_match' };
      }, { targets: activeItem.altTargets ? [activeItem.target, ...activeItem.altTargets] : [activeItem.target] });

      if (res?.action === 'opened_combobox') {
        const searchVal = (activeItem.target || '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/)[0] || 'Nepal';
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
      }
    }

    const after = await waitForActiveBlockToChange(before.title);
    console.log(`    Result Screen After: "${after.title}"`);
    if (after.title === before.title && !activeItem.isFinal) {
      console.log(`⚠️ Card did not advance on Step ${stepCount}. Retrying once...`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  }

  await browser.close();
  console.log('\n🎉 ALL RUN COMPLETE!');
})();
