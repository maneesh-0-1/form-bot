const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { generateUniqueSurveyResponses } = require('./ai_response_generator');

(async () => {
  console.log('Starting targeted Q16 inspector...');
  const dynamicProfile = await generateUniqueSurveyResponses();
  const { answers } = dynamicProfile;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://form.typeform.com/to/zx9C41uZ', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible({ timeout: 4000 })) {
    await startBtn.click({ force: true });
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
    { match: /where are you from/i, type: 'dropdown', target: 'Nepal' },
    { match: /where do you currently live/i, type: 'dropdown', target: 'Nepal' },
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
    { match: /most urgent action you demand from companies and universities/i, type: 'text', target: answers.demandCompaniesText || "Foster youth opportunities" },
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
    { match: /which action should they prioritize first/i, type: 'text', target: answers.priorityActionText || "Empower youth leadership" },
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
      console.log('\n🎯 FOUND Q16! Capturing full DOM details...');
      
      const q16Data = await page.evaluate(() => {
        const clean = str => (str || '').replace(/\s+/g, ' ').trim();
        const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"], [data-qa*="counter"]'))
          .map(el => ({ el, top: el.getBoundingClientRect().top, text: el.innerText.trim() }))
          .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
        counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
        const activeBlock = counters[0]?.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || document.body;

        // Find all radio groups, fieldsets, or lists
        const groups = Array.from(activeBlock.querySelectorAll('fieldset, [role="radiogroup"], [data-qa*="group"], [data-qa*="matrix-row"], [data-qa*="rating"]')).map(g => ({
          tag: g.tagName,
          role: g.getAttribute('role'),
          qa: g.getAttribute('data-qa'),
          text: clean(g.innerText).slice(0, 100),
          radiosCount: g.querySelectorAll('button, [role="radio"]').length
        }));

        // Find all elements with role="radio" or buttons inside the active block
        const allElements = Array.from(activeBlock.querySelectorAll('button, [role="radio"], [data-radix-collection-item], label')).map(el => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            role: el.getAttribute('role'),
            qa: el.getAttribute('data-qa'),
            value: el.getAttribute('value'),
            text: clean(el.innerText),
            top: Math.round(r.top),
            left: Math.round(r.left),
            width: Math.round(r.width),
            height: Math.round(r.height),
            cx: Math.round(r.left + r.width / 2),
            cy: Math.round(r.top + r.height / 2)
          };
        }).filter(e => e.width > 0 && e.height > 0 && e.top >= 0 && e.top < window.innerHeight);

        return {
          title: clean(activeBlock.querySelector('[data-qa*="block-title"], legend, h1, h2, h3')?.innerText),
          groups,
          allElements,
          innerHtml: activeBlock.innerHTML
        };
      });

      fs.writeFileSync(path.join(__dirname, 'q16_exact_dump.json'), JSON.stringify(q16Data, null, 2));
      await page.screenshot({ path: path.join(__dirname, 'q16_exact_screen.png') });
      console.log('Saved Q16 dump to q16_exact_dump.json and screenshot to q16_exact_screen.png');
      console.log('All elements:', JSON.stringify(q16Data.allElements, null, 2));
      break;
    }

    let activeItem = items.find(it => it.match.test(before.rawTitle) || it.match.test(before.text));
    if (!activeItem && (before.type === 'statement' || /future of work|youth leadership|mental health|global engagement/i.test(before.rawTitle))) {
      activeItem = { type: 'break', target: 'Continue' };
    }

    if (!activeItem) {
      console.log(`[Step ${step}] Statement / Unmatched: "${before.title}"`);
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
        const btns = Array.from(document.querySelectorAll('button'));
        const cont = btns.find(b => (b.innerText || '').toLowerCase().includes('continue') || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (cont) cont.click();
      });
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'dropdown') {
      await page.evaluate(() => {
        const trig = document.querySelector('button[data-qa*="combobox-trigger"], [role="combobox"]') || document.querySelector('button');
        if (trig) trig.click();
      });
      await page.waitForTimeout(300);
      await page.keyboard.type('Nepal', { delay: 40 });
      await page.waitForTimeout(400);
      await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('[role="option"], [data-qa*="combobox-item"], li'));
        const m = opts.find(o => (o.innerText || '').toLowerCase().includes('nepal'));
        if (m) m.click(); else if (opts.length) opts[0].click();
      });
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        const ok = document.querySelector('button[data-qa*="ok-button"]');
        if (ok) ok.click();
      });
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'rating') {
      await page.evaluate((val) => {
        const btns = Array.from(document.querySelectorAll('button, [role="button"], [role="radio"]'));
        const m = btns.find(b => (b.innerText || '').trim() === val);
        if (m) m.click();
        const ok = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase() === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (ok) ok.click();
      }, activeItem.target);
      await page.keyboard.press(activeItem.target);
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'ranking' || activeItem.type === 'multiselect') {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="radio"], [role="checkbox"], label')).slice(0, 3);
        btns.forEach(b => b.click());
        const ok = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase() === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (ok) ok.click();
      });
      await page.keyboard.press('Enter');
    } else if (activeItem.type === 'text') {
      await page.evaluate((val) => {
        const inp = document.querySelector('textarea, input[type="text"]');
        if (inp) {
          inp.focus();
          inp.value = val;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const ok = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').toLowerCase() === 'ok' || (b.getAttribute('data-qa') || '').includes('ok-button'));
        if (ok) ok.click();
      }, activeItem.target);
      await page.keyboard.press('Enter');
    } else {
      await page.evaluate(({ targets }) => {
        const clean = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const btns = Array.from(document.querySelectorAll('button, [role="radio"], label'));
        for (const t of targets) {
          const ct = clean(t);
          const m = btns.find(b => {
            const raw = clean((b.innerText || '').replace(/^[A-Z0-9]\s+/i, ''));
            return raw === ct || raw.includes(ct) || ct.includes(raw.slice(0, 6));
          });
          if (m) { m.click(); break; }
        }
      }, { targets: activeItem.altTargets ? [activeItem.target, ...activeItem.altTargets] : [activeItem.target] });
    }
  }

  await browser.close();
})();
