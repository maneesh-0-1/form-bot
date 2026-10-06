const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { generateUniqueSurveyResponses } = require('./ai_response_generator');

(async () => {
  const dynamicProfile = await generateUniqueSurveyResponses();
  const { answers } = dynamicProfile;

  const browser = await chromium.launch({ headless: true, slowMo: 40 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
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
      return { type: 'fallback', counter: 'none', title: clean(document.body.innerText).slice(0, 60), rawTitle: '', text: '' };
    });
  }

  const items = [
    { match: /consent to participate/i, type: 'radio', target: answers.consent },
    { match: /agree to be contacted/i, type: 'radio', target: answers.contact },
    { match: /what is your age/i, type: 'radio', target: answers.age, altTargets: ["22-25", "–25", "-25", "25", "Under 25", "18–25", "18-21", "26-30"] },
    { match: /what is your gender/i, type: 'radio', target: answers.gender },
    { match: /where are you from/i, type: 'dropdown', target: answers.originCountry },
    { match: /where do you currently live/i, type: 'dropdown', target: answers.currentCountry },
    { match: /employment status/i, type: 'radio', target: answers.employment, altTargets: ["Full-time", "Part-time", "Self-employed", "Unemployed", "student"] },
    { match: /highest level of education/i, type: 'radio', target: answers.education, altTargets: ["Bachelor", "Bachelor's degree", "Master", "Vocational"] },
    { match: /field of study/i, type: 'radio', target: answers.fieldOfStudy, altTargets: ["STEM", "Business", "Social", "Arts", "Healthcare"] },
    { match: /member of a youth organization/i, type: 'radio', target: answers.youthOrg, altTargets: ["Yes, actively", "Yes, occasionally", "No, but interested", "Yes", "actively"] },
    { match: /type of community/i, type: 'radio', target: answers.community, altTargets: ["Mid-sized city", "Urban", "Megacity", "Small town"] },
    { match: /lived, studied, or worked in a country other than/i, type: 'radio', target: answers.livedAbroad, altTargets: ["No, but I plan to", "Yes", "No"] },
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
    { match: /how much did that experience contribute to your professional/i, type: 'rating', target: "4" },
    { match: /biggest barrier to gaining the skills/i, type: 'multiselect', target: Array.isArray(answers.skillsBarrier) ? answers.skillsBarrier.join(', ') : answers.skillsBarrier },
    { match: /how important is it that your career has positive social/i, type: 'rating', target: answers.careerImpactRating },
    { match: /most urgent action you demand from companies and universities/i, type: 'text', target: answers.demandCompaniesText },
    { match: /rank the following factors from 1 to 4 based on what defines a true leader/i, type: 'ranking', target: Array.isArray(answers.leadershipFactorsRank) ? answers.leadershipFactorsRank.join(', ') : answers.leadershipFactorsRank },
    { match: /how many times have you self-initiated or led a community project/i, type: 'radio', target: answers.initiatedProjects, altTargets: ["Once", "2–3", "Never", "1-2"] },
    { match: /primary barrier preventing you from taking on a formal or informal leadership/i, type: 'dropdown_or_choice', target: answers.leadershipBarrier, altTargets: ["Systemic", "networks", "experience", "Fear"] },
    { match: /young people today have genuine influence over decisions/i, type: 'rating', target: answers.youthInfluenceRating },
    { match: /which.*leadership competencies do you most need to develop/i, type: 'multiselect', target: Array.isArray(answers.leadershipCompetencies) ? answers.leadershipCompetencies.join(', ') : answers.leadershipCompetencies },
    { match: /how supported do you feel by.*organizations around you/i, type: 'rating', target: answers.communitySupportRating },
    { match: /making decisions about real projects/i, type: 'rating', target: answers.decisionMakingRating },
    { match: /how comfortable and ready do you feel to.*claim and exercise a seat/i, type: 'rating', target: answers.leadershipReadinessRating },
    { match: /rate your level of trust in the following figures/i, type: 'radio', target: answers.trustInFigures, altTargets: ["Emerging", "Community", "Academic", "Scientific", "Independent"] },
    { match: /who has the strongest ability to positively influence society/i, type: 'ranking', target: Array.isArray(answers.societyInfluenceRank) ? answers.societyInfluenceRank.join(', ') : answers.societyInfluenceRank },
    { match: /which action should they prioritize first/i, type: 'text', target: answers.priorityActionText },
    { match: /overall, how would you rate your mental health/i, type: 'rating', target: answers.mentalHealthRating },
    { match: /mental health challenges or burnout limited your ability/i, type: 'rating', target: answers.burnoutRating },
    { match: /how comfortable would you feel disclosing and openly discussing/i, type: 'rating', target: answers.disclosingComfortRating },
    { match: /what are the top source of stress in your life/i, type: 'multiselect', target: Array.isArray(answers.stressSources) ? answers.stressSources.join(', ') : answers.stressSources },
    { match: /organizations i belong to take mental health seriously/i, type: 'rating', target: answers.institutionMentalHealthRating },
    { match: /what concrete, accessible mental health resources does your educational/i, type: 'multiselect', target: Array.isArray(answers.mentalHealthResources) ? answers.mentalHealthResources.join(', ') : answers.mentalHealthResources },
    { match: /when you feel overwhelmed or experience an emotional crisis/i, type: 'multiselect', target: Array.isArray(answers.emotionalCrisisHelp) ? answers.emotionalCrisisHelp.join(', ') : answers.emotionalCrisisHelp },
    { match: /how much does uncertainty about the future.*impact your mental/i, type: 'rating', target: answers.futureUncertaintyRating },
    { match: /young people today need more emotional resilience tools/i, type: 'rating', target: answers.resilienceToolsRating }
  ];

  let step = 0;
  while (step < 70) {
    step++;
    await page.waitForTimeout(300);
    const before = await getActiveBlock();

    if (/rate how your university, school, or workplace currently performs/i.test(before.rawTitle) || /following two aspects/i.test(before.text)) {
      console.log('\n🎯 REACHED Q16 MATRIX! Inspecting active block...');
      
      const debugInfo = await page.evaluate(() => {
        const clean = str => (str || '').replace(/\s+/g, ' ').trim();
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        // Dump every clickable item in active block
        const clickable = Array.from(activeBlock.querySelectorAll('*')).filter(el => {
          const r = el.getBoundingClientRect();
          const tag = el.tagName;
          const role = el.getAttribute('role');
          const isBtn = tag === 'BUTTON' || role === 'button' || role === 'radio' || role === 'checkbox' || el.hasAttribute('data-radix-collection-item');
          return isBtn && r.width > 0 && r.height > 0 && r.top >= 0 && r.top < window.innerHeight;
        }).map(el => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            role: el.getAttribute('role'),
            text: clean(el.innerText),
            top: Math.round(r.top),
            left: Math.round(r.left),
            width: Math.round(r.width),
            height: Math.round(r.height),
            cx: Math.round(r.left + r.width / 2),
            cy: Math.round(r.top + r.height / 2)
          };
        });

        return {
          title: clean(activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText),
          clickable
        };
      });

      console.log('Q16 Title:', debugInfo.title);
      console.log('Clickable elements found:', debugInfo.clickable.length);
      console.log(JSON.stringify(debugInfo.clickable, null, 2));

      // Separate into Set 1 and Set 2 (Aspect 1 and Aspect 2)
      // Exclude OK button
      const choices = debugInfo.clickable.filter(c => !c.text.toLowerCase().includes('ok') && c.width < 500);
      console.log(`Choices (excluding OK): ${choices.length}`);
      
      const mid = Math.floor(choices.length / 2);
      const set1 = choices.slice(0, mid);
      const set2 = choices.slice(mid);

      console.log('Set 1 (Aspect 1):', set1.map(s => `"${s.text}" at (${s.cx}, ${s.cy})`));
      console.log('Set 2 (Aspect 2):', set2.map(s => `"${s.text}" at (${s.cx}, ${s.cy})`));

      // Target rating: choice 3 in Set 1, choice 4 in Set 2
      const target1 = set1[2] || set1[0];
      const target2 = set2[3] || set2[0];

      console.log(`Clicking Aspect 1 rating "${target1?.text}" at (${target1?.cx}, ${target1?.cy})`);
      await page.mouse.click(target1.cx, target1.cy);
      await page.waitForTimeout(600);

      console.log(`Clicking Aspect 2 rating "${target2?.text}" at (${target2?.cx}, ${target2?.cy})`);
      await page.mouse.click(target2.cx, target2.cy);
      await page.waitForTimeout(600);

      const okBtn = debugInfo.clickable.find(c => c.text.toLowerCase().includes('ok'));
      if (okBtn) {
        console.log(`Clicking OK button at (${okBtn.cx}, ${okBtn.cy})`);
        await page.mouse.click(okBtn.cx, okBtn.cy);
      }
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);

      const after = await getActiveBlock();
      console.log(`\n🎉 RESULT AFTER Q16: "${after.title}"`);
      break;
    }

    let activeItem = items.find(it => it.match.test(before.rawTitle) || it.match.test(before.text));
    if (!activeItem && (before.type === 'statement' || /future of work|youth leadership|mental health|global engagement/i.test(before.rawTitle))) {
      activeItem = { type: 'break', target: 'Continue' };
    }

    if (!activeItem) {
      console.log(`[Step ${step}] Statement / Unmatched: "${before.title}" -> pressing Continue / Enter`);
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const cont = btns.find(b => (b.innerText || '').toLowerCase().includes('continue') || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (cont) cont.click();
      });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      continue;
    }

    if (activeItem.type === 'break') {
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const btn = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase().includes('continue') || (b.getAttribute('data-qa') || '').includes('ok-button')) || activeBlock.querySelector('button');
        if (btn) btn.click();
      });
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'dropdown') {
      const searchVal = (activeItem.target || 'Nepal').replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/)[0] || 'Nepal';
      await page.evaluate(() => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const trig = activeBlock.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]') || activeBlock.querySelector('button');
        if (trig) trig.click();
      });
      await page.waitForTimeout(400);
      await page.keyboard.type(searchVal, { delay: 40 });
      await page.waitForTimeout(500);
      await page.evaluate((query) => {
        const clean = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const q = clean(query);
        const options = Array.from(document.querySelectorAll('[role="listbox"] [role="option"], [role="option"], [data-qa*="combobox-item"], [data-radix-popper-content-wrapper] li, ul[role="listbox"] li, li[data-value]'));
        const match = options.find(el => clean(el.innerText || el.textContent || '').includes(q));
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
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'rating') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="button"], [role="radio"]'));
        const match = buttons.find(b => (b.innerText || '').trim() === val) || buttons[Math.min(parseInt(val) - 1, buttons.length - 1)];
        if (match) match.click();
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').trim().toLowerCase() === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (ok) ok.click();
      }, activeItem.target);
      await page.waitForTimeout(200);
      await page.keyboard.press(activeItem.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'ranking' || activeItem.type === 'multiselect') {
      await page.evaluate((val) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const parts = Array.isArray(val) ? val : val.split(',').map(s => s.trim()).filter(Boolean);
        const buttons = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [role="checkbox"], [role="button"], label'));
        for (const part of parts) {
          const cleanPart = clean(part);
          const match = buttons.find(b => {
            const raw = b.innerText.trim();
            const withoutBadge = raw.replace(/^[A-Z0-9]\s+/i, '').replace(/^[A-Z0-9]\n+/i, '').trim();
            const btnClean = clean(withoutBadge);
            return btnClean.includes(cleanPart) || cleanPart.includes(btnClean);
          });
          if (match) match.click();
        }
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').trim().toLowerCase() === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (ok) ok.click();
      }, activeItem.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'text') {
      await page.evaluate((val) => {
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;
        const input = activeBlock.querySelector('textarea, input[type="text"]');
        if (input) {
          input.focus();
          input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const ok = Array.from(activeBlock.querySelectorAll('button')).find(b => (b.innerText || '').trim().toLowerCase() === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (ok) ok.click();
      }, activeItem.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else {
      // radio
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
            break;
          }
        }
      }, { targets: activeItem.altTargets ? [activeItem.target, ...activeItem.altTargets] : [activeItem.target] });
    }
  }

  await browser.close();
})();
