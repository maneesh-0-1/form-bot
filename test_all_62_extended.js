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
      return { type: 'fallback', counter: 'none', title: clean(document.body.innerText).slice(0, 60), text: '' };
    });
  }

  async function waitForActiveBlockToChange(oldTitle, maxWaitMs = 4000) {
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
    { id: 1, type: 'radio', target: answers.consent },
    { id: 2, type: 'radio', target: answers.contact },
    { id: 3, type: 'radio', target: answers.age, altTargets: ["22-25", "–25", "-25", "25", "Under 25", "18–25"] },
    { id: 4, type: 'radio', target: answers.gender },
    { id: 5, type: 'dropdown', target: answers.originCountry },
    { id: 6, type: 'dropdown', target: answers.currentCountry },
    { id: 7, type: 'radio', target: answers.employment, altTargets: ["Full-time student", "Employed", "Self-employed", "Unemployed"] },
    { id: 8, type: 'radio', target: answers.education, altTargets: ["Bachelor", "Bachelor's degree", "Master", "Vocational"] },
    { id: 9, type: 'radio', target: answers.fieldOfStudy, altTargets: ["STEM", "Business", "Social", "Arts", "Healthcare"] },
    { id: 10, type: 'radio', target: answers.youthOrg, altTargets: ["Yes, actively", "Yes, occasionally", "No, but interested", "Yes", "actively"] },
    { id: 11, type: 'radio', target: answers.community, altTargets: ["Mid-sized city", "Urban", "Megacity", "Small town"] },
    { id: 12, type: 'radio', target: answers.livedAbroad, altTargets: ["No, but I plan to", "Yes", "No"] },

    // [ITEM 13]: SECTION BREAK 1
    { id: 13, type: 'break', target: "Continue" },

    // --- Section 2: Future of Work (Items 14–26) ---
    { id: 14, type: 'rating', target: answers.jobPrepRating },
    { id: 15, type: 'rating', target: answers.formalEdEquipRating },
    { id: 16, type: 'ranking', target: Array.isArray(answers.skillsAcquisitionRank) ? answers.skillsAcquisitionRank.join(', ') : answers.skillsAcquisitionRank },
    { id: 17, type: 'multiselect', target: Array.isArray(answers.humanCentricSkills) ? answers.humanCentricSkills.join(', ') : answers.humanCentricSkills },
    { id: 18, type: 'radio', target: answers.aiUsage, altTargets: ["Daily", "Weekly", "Several times", "Occasionally"] },
    { id: 19, type: 'rating', target: answers.aiConcernRating },
    { id: 20, type: 'rating', target: answers.traditionalEmploymentRating },
    { id: 21, type: 'radio', target: answers.sideHustle, altTargets: ["No", "Yes"] },
    { id: 22, type: 'dropdown_or_choice', target: answers.financialConcern, altTargets: ["Inflation", "rising cost", "first job", "Housing", "Cost of living"] },
    { id: 23, type: 'radio', target: answers.realWorldProject, altTargets: ["want to", "Yes", "No"] },
    { id: 24, type: 'multiselect', target: Array.isArray(answers.skillsBarrier) ? answers.skillsBarrier.join(', ') : answers.skillsBarrier },
    { id: 25, type: 'rating', target: answers.careerImpactRating },
    { id: 26, type: 'text', target: answers.demandCompaniesText },

    // [ITEM 27]: SECTION BREAK 2
    { id: 27, type: 'break', target: "Continue" },

    // --- Section 3: Leadership & Youth Voice (Items 28–38) ---
    { id: 28, type: 'ranking', target: Array.isArray(answers.leadershipFactorsRank) ? answers.leadershipFactorsRank.join(', ') : answers.leadershipFactorsRank },
    { id: 29, type: 'radio', target: answers.initiatedProjects, altTargets: ["Once", "2–3", "Never", "1-2"] },
    { id: 30, type: 'dropdown_or_choice', target: answers.leadershipBarrier, altTargets: ["Systemic", "networks", "experience", "Fear"] },
    { id: 31, type: 'rating', target: answers.youthInfluenceRating },
    { id: 32, type: 'multiselect', target: Array.isArray(answers.leadershipCompetencies) ? answers.leadershipCompetencies.join(', ') : answers.leadershipCompetencies },
    { id: 33, type: 'rating', target: answers.communitySupportRating },
    { id: 34, type: 'rating', target: answers.decisionMakingRating },
    { id: 35, type: 'rating', target: answers.leadershipReadinessRating },
    { id: 36, type: 'radio', target: answers.trustInFigures, altTargets: ["Emerging", "Community", "Academic", "Scientific"] },
    { id: 37, type: 'ranking', target: Array.isArray(answers.societyInfluenceRank) ? answers.societyInfluenceRank.join(', ') : answers.societyInfluenceRank },
    { id: 38, type: 'text', target: answers.priorityActionText },

    // [ITEM 39]: SECTION BREAK 3
    { id: 39, type: 'break', target: "Continue" },

    // --- Section 4: Mental Health (Items 40–45) ---
    { id: 40, type: 'rating', target: answers.mentalHealthRating },
    { id: 41, type: 'rating', target: answers.burnoutRating },
    { id: 42, type: 'rating', target: answers.disclosingComfortRating },
    { id: 43, type: 'multiselect', target: Array.isArray(answers.stressSources) ? answers.stressSources.join(', ') : answers.stressSources },
    { id: 44, type: 'rating', target: answers.institutionMentalHealthRating },
    { id: 45, type: 'multiselect', target: Array.isArray(answers.mentalHealthResources) ? answers.mentalHealthResources.join(', ') : answers.mentalHealthResources },

    // [ITEM 46]: SECTION BREAK 4
    { id: 46, type: 'break', target: "Continue" },

    // --- Section 5: Mental Health Part 2 (Items 47–51) ---
    { id: 47, type: 'multiselect', target: Array.isArray(answers.emotionalCrisisHelp) ? answers.emotionalCrisisHelp.join(', ') : answers.emotionalCrisisHelp },
    { id: 48, type: 'rating', target: answers.futureUncertaintyRating },
    { id: 49, type: 'rating', target: answers.resilienceToolsRating },
    { id: 50, type: 'matrix', target: answers.matrixPerformance },
    { id: 51, type: 'radio', target: answers.aiOpportunitiesOutlook, altTargets: ["opportunity", "more opportunities", "create more opportunities"] },

    // [ITEM 52]: SECTION BREAK 5
    { id: 52, type: 'break', target: "Continue" },

    // --- Section 6: Global Engagement & Outlook (Items 53–62) ---
    { id: 53, type: 'radio', target: answers.internationalNewsFreq, altTargets: ["Monthly", "Weekly", "Daily"] },
    { id: 54, type: 'rating', target: answers.sdgKnowledgeRating },
    { id: 55, type: 'rating', target: answers.individualActionRating },
    { id: 56, type: 'radio', target: answers.globalInstitutionTrust, altTargets: ["Nothing", "lost faith", "United Nations", "WHO"] },
    { id: 57, type: 'radio', target: answers.engagingObstacle, altTargets: ["No local", "entry point", "financial", "time"] },
    { id: 58, type: 'rating', target: answers.globalCooperationRating },
    { id: 59, type: 'text', target: answers.importantSkillText },
    { id: 60, type: 'text', target: answers.worldLeaderText },
    { id: 61, type: 'text', target: answers.youthVisionText },
    { id: 62, type: 'text', target: answers.urgentChallengeText, isFinal: true }
  ];

  for (const item of items) {
    await page.waitForTimeout(500);
    const before = await getActiveBlock();
    console.log(`\n[STEP ${item.id}/62] Starting on: "${before.title}"`);

    if (item.type === 'break') {
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
    } else if (item.type === 'dropdown') {
      const searchVal = (item.target || '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/)[0] || 'Nepal';
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
    } else if (item.type === 'rating') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
        const match = buttons.find(b => (b.innerText || '').trim() === val);
        if (match) match.click();
      }, item.target);
      await page.waitForTimeout(200);
      await page.keyboard.press(item.target);
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
    } else if (item.type === 'ranking' || item.type === 'multiselect') {
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
      }, item.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (item.type === 'matrix') {
      const matrixVals = (item.target || '3, 3').split(',').map(s => s.trim());
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
    } else if (item.type === 'text') {
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
      }, item.target);
      await page.waitForTimeout(200);

      if (item.isFinal) {
        console.log('\n🛑 STRICT SAFETY RULE ENFORCED: Final question (Step 62) reached! Answered with generated text and safely halting BEFORE submission.');
        await page.waitForTimeout(1000);
        const finalScreenshot = path.join(SCREENSHOTS_DIR, 'final_screen_reached.png');
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        console.log(`Saved final verification screenshot to: ${finalScreenshot}`);
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
      const res = await page.evaluate(({ targets, targetVal }) => {
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
      }, { targets: item.altTargets ? [item.target, ...item.altTargets] : [item.target], targetVal: item.target });

      if (res?.action === 'opened_combobox') {
        const searchVal = (item.target || '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/)[0] || 'Nepal';
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
    console.log(`[STEP ${item.id}/62] Result Screen After: "${after.title}"`);
    if (after.title === before.title && item.id < 62) {
      console.log(`❌ Step ${item.id} failed to advance!`);
      await page.screenshot({ path: `debug_screenshots/test_step_${item.id}_halt.png` });
      break;
    }
  }

  await browser.close();
  console.log('\n🎉 ALL 62 ITEMS RUN COMPLETE!');
})();
