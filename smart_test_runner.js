const { chromium } = require('playwright');
const xlsx = require('xlsx');
const fs = require('fs');
const readline = require('readline');

// ==========================================
// 1. CONFIGURATION & SETUP
// ==========================================
const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';
const RECIPE_FILE = 'recipe_verified.js';

fs.writeFileSync(RECIPE_FILE, 'module.exports = async function fillForm(page, row) {\n');

function askTerminal(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans.trim()); }));
}

// ==========================================
// 2. COMPLETE SURVEY MAP
// ==========================================
const FORM_MAP = [
  // --- Section 1: Demographics ---
  { type: 'Q', inputType: 'radio', key: "Consent", target: "Yes, I consent", prompt: "Do you consent to participate and agree to the collection of your responses in accordance with GDPR?*" },
  { type: 'Q', inputType: 'radio', key: "Confirmation / Qualifier", target: "Yes", prompt: "Do you agree to be contacted by the survey partners for future research or opportunities?*" },
  { type: 'Q', inputType: 'radio', key: "Age Bracket", target: "–25", prompt: "What is your age?*" },
  { type: 'Q', inputType: 'radio', key: "Gender", target: "Man", prompt: "What is your gender?*" },
  { type: 'Q', inputType: 'dropdown', key: "Country of Origin / Residence", target: "Nepal", prompt: "Where are you from?*" },
  { type: 'Q', inputType: 'dropdown', key: "Current Location / Country", target: "Nepal", prompt: "Where do you currently live?*" },
  { type: 'Q', inputType: 'radio', key: "Employment / Student Status", target: "Full-time student", prompt: "What is your employment status?*" },
  { type: 'Q', inputType: 'radio', key: "Education Level", target: "Bachelor's", prompt: "What is the highest level of education you have completed or are currently pursuing?*" },
  { type: 'Q', inputType: 'radio', key: "Field of Study", target: "STEM", prompt: "Which of the following best describes your field of study or work?*" },
  { type: 'Q', inputType: 'radio', key: "Job Search Status", target: "Yes, actively", prompt: "Are you currently a member of a youth organization or community group?*" },
  { type: 'Q', inputType: 'radio', key: "Location / Setting", target: "Mid-sized city", prompt: "What type of community do you live in?*" },
  { type: 'Q', inputType: 'radio', key: "Relocation / Next Plan", target: "No, but I plan to", prompt: "Have you ever lived, studied, or worked in a country other than your own?*" },
  
  { type: 'BREAK', prompt: "Continue / Section Break 1" },

  // --- Section 2: Future of Work & Skills ---
  { type: 'Q', inputType: 'rating', key: "How prepared do you feel for...", target: "4", prompt: "How prepared do you feel for the current job market?*" },
  { type: 'Q', inputType: 'rating', key: "To what extent does your...", target: "3", prompt: "To what extent does your formal education equip you with skills actually demanded by employers today?*" },
  { type: 'Q', inputType: 'multiselect', key: "Question c. of 22 (Rank / Priority)", target: "Self-taught learning (Online), Hands-on experience (Previous)", prompt: "Please rank the following three options based on where you acquired the skills you currently use (or will use) for work:*" },
  { type: 'Q', inputType: 'multiselect', key: 'Question d. of 22 ("Which human...")', target: "Creative problem-solving, Resilience, Cross-cultural collaboration", prompt: "Which human-centric skills do you believe AI cannot replace?*" },
  { type: 'Q', inputType: 'radio', key: "Frequency / AI or Tool usage", target: "Daily", prompt: "How frequently do you productively use Artificial Intelligence (AI) tools in your daily tasks, studies, or work?*" },
  { type: 'Q', inputType: 'rating', key: "How concerned are you about...", target: "5", prompt: "How concerned are you about AI replacing your job or career path within 5 years?*" },
  { type: 'Q', inputType: 'rating', key: "How strongly do you agree: Traditional employment", target: "3", prompt: "How strongly do you agree: 'Traditional employment (stable job, linear career) is a realistic and desirable path for my generation.'*" },
  { type: 'Q', inputType: 'radio', key: "Qualifier question", target: "No", prompt: "Do you currently have an alternative source of income, side hustle, or financial emergency fund to sustain you if you lose your primary activity?*" },
  { type: 'Q', inputType: 'text', key: "Key Challenge / Goal", target: "Finding a first job", prompt: "What is your primary financial concern for the next 2 years?*" },
  { type: 'Q', inputType: 'radio', key: "Skill / Training interest", target: "No, but I want to", prompt: "Have you participated in a structured real-world project, community initiative, or volunteer program in the past 12 months?*" },
  { type: 'Q', inputType: 'multiselect', key: 'Question k. of 56 ("What is the...")', target: "My education covers it, Lack of time, I don't know what skills I", prompt: "What is the biggest barrier to gaining the skills you need for your career?*" },
  { type: 'Q', inputType: 'rating', key: "Scale / Score", target: "3", prompt: "How important is it that your career has positive social or environmental impact?*" },
  { type: 'Q', inputType: 'text', key: 'Question m. of 56 ("To secure...")', target: "Get more Practical Learning", prompt: "To secure the future of work for your generation, what is the most urgent action you demand from companies and universities?" },

  { type: 'BREAK', prompt: "Continue / Section Break 2" },

  // --- Section 3: Leadership & Youth Voice ---
  { type: 'Q', inputType: 'multiselect', key: 'Question a. of 56 ("Rank the...")', target: "Formal authority: Holding a", prompt: "Rank the following factors from 1 to 4 based on what defines a true leader today*" },
  { type: 'Q', inputType: 'radio', key: "Frequency / Occurrence", target: "Once", prompt: "In the past 12 months, how many times have you self-initiated or led a community project, social initiative, youth collective, or volunteer action?*" },
  { type: 'Q', inputType: 'text', key: "Barrier / Obstacle", target: "Systemic: Lack of networks,", prompt: "What is the primary barrier preventing you from taking on a formal or informal leadership role in your environment?*" },
  { type: 'Q', inputType: 'rating', key: "Scale / Rating 1", target: "5", prompt: "How much do you agree: 'Young people today have genuine influence over decisions that affect their communities or countries.'*" },
  { type: 'Q', inputType: 'multiselect', key: "Skill / Competency", target: "Cross-cultural communication", prompt: "Which leadership competencies do you most need to develop?*" },
  { type: 'Q', inputType: 'rating', key: "How supported do you feel by...", target: "5", prompt: "How supported do you feel by organizations around you in developing your leadership potential?*" },
  { type: 'Q', inputType: 'rating', key: "How strongly do you agree: Making decisions", target: "3", prompt: "How strongly do you agree: 'Making decisions about real projects has made me more confident in my ability to lead.'*" },
  { type: 'Q', inputType: 'rating', key: "How comfortable and ready do...", target: "4", prompt: "How comfortable and ready do you feel to claim and exercise a seat with full voting rights at high-level decision-making tables?*" },
  { type: 'Q', inputType: 'multiselect', key: 'Question i. of 56 ("Rate your...")', target: "Emerging Community Leaders (", prompt: "Rate your level of trust in the following figures when it comes to driving real, positive change in today's environment:*" },
  { type: 'Q', inputType: 'multiselect', key: 'Question j. of 56 ("Who has the...")', target: "Social media presence, Lived experience", prompt: "Who has the strongest ability to positively influence society? Rank the following options*" },
  { type: 'Q', inputType: 'text', key: 'Question k. of 56 ("If...")', target: "Awarness", prompt: "If governments, organizations and businesses want to effectively increase youth leadership, which action should they prioritize first?" },

  { type: 'BREAK', prompt: "Continue / Section Break 3" },

  // --- Section 4: Mental Health & Support (Part 1) ---
  { type: 'Q', inputType: 'rating', key: "Overall, how would you rate...", target: "4", prompt: "Overall, how would you rate your mental health, stress management, and emotional well-being over the past 3 months?*" },
  { type: 'Q', inputType: 'rating', key: "In the past year, to what...", target: "5", prompt: "In the past year, to what extent have mental health challenges or burnout limited your ability to take advantage of opportunities?*" },
  { type: 'Q', inputType: 'rating', key: "How comfortable would you...", target: "2", prompt: "How comfortable would you feel disclosing and openly discussing a mental health crisis or struggle with people around you?*" },
  { type: 'Q', inputType: 'multiselect', key: 'Question d. of 56 ("What are...")', target: "Relationships, Job market uncertainty, Climate anxiety", prompt: "What are the top source of stress in your life right now?*" },
  { type: 'Q', inputType: 'rating', key: "Scale / Rating 2", target: "4", prompt: "How strongly do you agree: 'Organizations I belong to take mental health seriously and act on it.'* (1)" },
  { type: 'Q', inputType: 'multiselect', key: 'Question f. of 56 ("What...")', target: "Clear protocols for deadline, On-site or subsidized free", prompt: "How strongly do you agree: 'Organizations I belong to take mental health seriously and act on it.'* (2)" },

  { type: 'BREAK', prompt: "Continue / Section Break 4" },

  // --- Section 5: Mental Health (Part 2) ---
  { type: 'Q', inputType: 'multiselect', key: 'Question g. of 56 ("When you...")', target: "Social media, Online communities", prompt: "When you feel overwhelmed or experience an emotional crisis, who do you primarily turn to for help?*" },
  { type: 'Q', inputType: 'rating', key: "How much does uncertainty...", target: "4", prompt: "How much does uncertainty about the future (career, climate, conflict) impact your mental well-being?" },
  { type: 'Q', inputType: 'rating', key: "How strongly do you agree: Young people today", target: "2", prompt: "How strongly do you agree: 'Young people today need more emotional resilience tools to navigate today's world.'" },
  { type: 'Q', inputType: 'radio', key: "Question 16 of 56 (Rate how...)", target: "Mental health days", prompt: "Level of Talk (Rhetoric): How much mental health is openly discussed*" },
  { type: 'Q', inputType: 'radio', key: "Outlook / Sentiment", target: "opportunity", prompt: "Level of Action (Reality): How effectively different actions are implemented when someone faces a crisis.*" },

  { type: 'BREAK', prompt: "Continue / Section Break 5" },

  // --- Section 6: Global Engagement & Outlook ---
  { type: 'Q', inputType: 'radio', key: "Frequency", target: "Monthly", prompt: "Through your connection to international youth networks, platforms, or cross-border organizations..." },
  { type: 'Q', inputType: 'rating', key: "How knowledgeable do you...", target: "5", prompt: "How frequently do you participate in global-reaching actions to influence international crises, wars, or climate emergencies?*" },
  { type: 'Q', inputType: 'rating', key: "How much do you feel your...", target: "5", prompt: "How knowledgeable do you consider yourself regarding the operations, policies, and decisions of multilateral organizations?*" },
  { type: 'Q', inputType: 'radio', key: "Sentiment / Belief", target: "Nothing — I've lost faith in", prompt: "How much do you feel your individual actions can influence global events like wars or political crises?*" },
  { type: 'Q', inputType: 'radio', key: "Challenge / Barrier", target: "No local entry point", prompt: "What do you expect from international institutions and world leaders when responding to current global conflicts?*" },
  { type: 'Q', inputType: 'rating', key: "Scale / Rating 3", target: "5", prompt: "What is the biggest barrier preventing you from engaging more in global networks or international opportunities?*" },
  { type: 'Q', inputType: 'text', key: 'Question h. of 56 ("Faced with...")', target: "Industry ready skills and updated syllabus", prompt: "How important is it that an organization you belong to has a global presence or international community?*" },
  { type: 'Q', inputType: 'text', key: 'Question 18 of 56 ("If you...")', target: "Skilled people not percentage based people", prompt: "Faced with current global context in this year 2026, what is your primary demand for international institutions and world leaders?*" },
  { type: 'Q', inputType: 'text', key: 'Question 19 of 56 ("In one or...")', target: "Getting Good Jobs and Setteling. To much demand in few sectors and lack of oppurtunties in few.", prompt: "If you could change ONE thing about the way your generation is perceived by institutions, what would it be?" },
  { type: 'Q', inputType: 'text', key: "Urgent Challenge 2026", target: "Quality education and practical skills over theoretical degrees.", prompt: "In one or two sentences: What do you believe is the single most urgent challenge young people face globally in 2026, and why?" }
];

const finalRowData = {};
FORM_MAP.filter(item => item.type === 'Q').forEach(item => {
  finalRowData[item.key] = item.target;
});

// ==========================================
// 3. FAST & ACCURATE DOM HELPERS
// ==========================================
async function getActiveCardText(page) {
  return await page.evaluate(() => {
    // Target the visible question title or active slide container
    const active = document.querySelector('[data-qa*="active-screen"], [aria-current="step"], div[data-block-type], h2, [role="heading"]');
    if (active) return active.innerText.trim().replace(/\s+/g, ' ').slice(0, 80);
    return document.body.innerText.trim().replace(/\s+/g, ' ').slice(0, 60);
  });
}

async function waitForScreenChange(page, initialText, maxWaitMs = 1500) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const current = await getActiveCardText(page);
    // Verified screen change: current text must not match initial text and must have valid content
    if (current && current !== initialText) {
      return true;
    }
    await page.waitForTimeout(80);
  }
  return false;
}

async function safeClick(locator) {
  try {
    await locator.click({ timeout: 1200, force: true });
    return true;
  } catch (e) {
    return false;
  }
}

async function passContinueScreen(page) {
  console.log(`⏩ [Section Break] Clicking Continue...`);
  try {
    const btn = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("OK")').first();
    if (await btn.isVisible({ timeout: 400 })) {
      await safeClick(btn);
    } else {
      await page.keyboard.press('Enter');
    }
  } catch (e) {
    await page.keyboard.press('Enter');
  }

  fs.appendFileSync(RECIPE_FILE, `  // Section Break\n  try { const btn = page.locator('button:has-text("Continue"), button:has-text("OK")').first(); if (await btn.isVisible({ timeout: 400 })) await btn.click({ force: true }); else await page.keyboard.press('Enter'); } catch(e){ await page.keyboard.press('Enter'); }\n  await page.waitForTimeout(500);\n\n`);
  await page.waitForTimeout(600);
}

async function fillQuestion(page, item, val) {
  if (!val) return true;
  const initialText = await getActiveCardText(page);

  try {
    // 1. Dropdown Selectors (Country & Location dropdowns)
    if (item.inputType === 'dropdown') {
      console.log(`   👉 Dropdown: Searching and picking "${val}"...`);
      // Find the dropdown input or placeholder trigger
      const trigger = page.locator('[role="combobox"], [data-qa*="dropdown"], input[placeholder*="Type or select"], input[placeholder*="search"]').first();
      if (await trigger.isVisible({ timeout: 800 })) {
        await safeClick(trigger);
        await page.waitForTimeout(200);
        await page.keyboard.type(val, { delay: 60 });
        await page.waitForTimeout(300);

        // Click matching option in dropdown list
        const option = page.locator(`[role="option"]:has-text("${val}"), div[role="listbox"] div:has-text("${val}"), button:has-text("${val}")`).first();
        if (await option.isVisible({ timeout: 1000 })) {
          await safeClick(option);
        } else {
          await page.keyboard.press('Enter');
        }
      } else {
        // Fallback: type directly and hit Enter
        await page.keyboard.type(val, { delay: 50 });
        await page.keyboard.press('Enter');
      }
    }
    // 2. Rating / Scale
    else if (item.inputType === 'rating' || /^[0-9]$/.test(val)) {
      console.log(`   👉 Rating/Scale: Sending '${val}'...`);
      const numBtn = page.locator(`button:has-text("${val}"), div[role="button"]:has-text("${val}")`).first();
      if (await numBtn.isVisible({ timeout: 300 })) {
        await safeClick(numBtn);
      } else {
        await page.keyboard.press(val);
      }
    }
    // 3. Multi-Select / Ranking
    else if (item.inputType === 'multiselect' && val.includes(',')) {
      const parts = val.split(',').map(s => s.trim()).filter(Boolean);
      console.log(`   👉 Multiselect (${parts.length} items)...`);
      for (const part of parts) {
        const el = page.locator(`button:has-text("${part}"), label:has-text("${part}"), div[role="button"]:has-text("${part}")`).first();
        if (await el.isVisible({ timeout: 400 })) {
          await safeClick(el);
          await page.waitForTimeout(150);
        }
      }
    }
    // 4. Radio / Single-Choice
    else if (item.inputType === 'radio') {
      console.log(`   👉 Radio Choice: Clicking "${val}"...`);
      const choice = page.locator(`button:has-text("${val}"), label:has-text("${val}"), div[role="button"]:has-text("${val}")`).first();
      if (await choice.isVisible({ timeout: 600 })) {
        await safeClick(choice);
      } else {
        const firstChunk = val.split(',')[0].trim();
        const altChoice = page.locator(`button:has-text("${firstChunk}"), label:has-text("${firstChunk}")`).first();
        if (await altChoice.isVisible({ timeout: 400 })) {
          await safeClick(altChoice);
        }
      }
    }
    // 5. Standard Text Input
    else {
      const input = page.locator('input:visible, textarea:visible').first();
      if (await input.isVisible({ timeout: 500 })) {
        console.log(`   👉 Text Input: Filling "${val}"...`);
        await input.fill(val);
        await page.keyboard.press('Enter');
      }
    }

    // Auto-click OK/Continue button if it appears
    try {
      const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first();
      if (await ok.isVisible({ timeout: 250 })) await safeClick(ok);
    } catch (e) {}

    return await waitForScreenChange(page, initialText);
  } catch (err) {
    console.log(`   ⚠️ Notice: ${err.message.split('\n')[0]}`);
    return false;
  }
}

function appendRecipeStep(item, val) {
  const safeKey = item.key.replace(/"/g, '\\"');
  const strVal = String(val).trim();

  let code = `  // Step: "${safeKey}"\n`;
  if (item.inputType === 'dropdown') {
    code += `  try {\n    const trigger = page.locator('[role="combobox"], [data-qa*="dropdown"], input[placeholder*="Type or select"]').first();\n    if (await trigger.isVisible({ timeout: 600 })) { await trigger.click({ force: true }); await page.waitForTimeout(200); }\n    await page.keyboard.type("${strVal}", { delay: 50 });\n    await page.waitForTimeout(250);\n    const opt = page.locator('[role="option"]:has-text("${strVal}"), button:has-text("${strVal}")').first();\n    if (await opt.isVisible({ timeout: 600 })) await opt.click({ force: true }); else await page.keyboard.press('Enter');\n  } catch(e) { await page.keyboard.press('Enter'); }\n`;
  } else if (item.inputType === 'rating' || /^[0-9]$/.test(strVal)) {
    code += `  try { const btn = page.locator('button:has-text("${strVal}")').first(); if (await btn.isVisible({ timeout: 300 })) await btn.click({ force: true }); else await page.keyboard.press("${strVal}"); } catch(e){ await page.keyboard.press("${strVal}"); }\n`;
  } else if (item.inputType === 'multiselect' && strVal.includes(',')) {
    code += `  for (const part of String(row["${safeKey}"]).split(',')) {\n    const el = page.locator('button:has-text("' + part.trim() + '"), label:has-text("' + part.trim() + '")').first();\n    if (await el.isVisible({ timeout: 300 })) { await el.click({ force: true }); await page.waitForTimeout(150); }\n  }\n`;
  } else if (item.inputType === 'radio') {
    code += `  try { const choice = page.locator('button:has-text("' + String(row["${safeKey}"]).trim() + '"), label:has-text("' + String(row["${safeKey}"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}\n`;
  } else {
    code += `  try {\n    const input = page.locator('input:visible, textarea:visible').first();\n    if (await input.isVisible({ timeout: 500 })) { await input.fill(String(row["${safeKey}"])); await page.keyboard.press('Enter'); }\n    else { const choice = page.locator('button:has-text("' + String(row["${safeKey}"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 400 })) await choice.click({ force: true }); }\n  } catch(e) { await page.keyboard.press('Enter'); }\n`;
  }
  code += `  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}\n  await page.waitForTimeout(300);\n\n`;

  fs.appendFileSync(RECIPE_FILE, code);
}

// ==========================================
// 4. MAIN EXECUTION RUNNER
// ==========================================
async function run() {
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 30 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to form...');
  await page.goto(FORM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  page.setDefaultTimeout(2000);

  // Auto handle Welcome Screen if present
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible({ timeout: 2000 })) {
    console.log('Clicking Start...');
    await safeClick(startBtn);
    fs.appendFileSync(RECIPE_FILE, `  // Welcome Screen\n  await page.getByRole('button', { name: /start|press enter/i }).first().click({ force: true });\n  await page.waitForTimeout(800);\n\n`);
    await page.waitForTimeout(800);
  }

  let stepIdx = 0;
  while (stepIdx < FORM_MAP.length) {
    const item = FORM_MAP[stepIdx];

    if (item.type === 'BREAK') {
      console.log(`\n⏩ [Section Break] ${item.prompt}`);
      await passContinueScreen(page);
      stepIdx++;
      continue;
    }

    const targetVal = item.target;

    console.log(`\n👉 [${stepIdx + 1}/${FORM_MAP.length}] ${item.prompt.slice(0, 50)}...`);
    console.log(`   Type: [${item.inputType.toUpperCase()}] | Target: "${targetVal}"`);

    let advanced = false;
    try {
      advanced = await fillQuestion(page, item, targetVal);
    } catch (e) {
      advanced = false;
    }

    if (advanced) {
      console.log(`   ⚡ Succeeded (Screen Advanced)!`);
      appendRecipeStep(item, targetVal);
      stepIdx++;
      continue;
    }

    // Fallback prompt only if the screen genuinely did not advance
    console.log(`\n⚠️  NOT ADVANCED FOR: "${item.key}"`);
    console.log(`   - If answered in browser: Press [ENTER]`);
    console.log(`   - "b" : Section Break / Continue`);
    console.log(`   - "c" : Missing Question`);

    while (true) {
      const cmd = (await askTerminal('Command: ')).toLowerCase();

      if (cmd === 'b') {
        await passContinueScreen(page);
        break;
      } else if (cmd === 'c') {
        const newCol = await askTerminal('Enter new question label: ');
        finalRowData[newCol] = 'Answered';
        appendRecipeStep({ key: newCol, inputType: 'text' }, 'Answered');
        break;
      } else {
        console.log(`👍 Answer confirmed for "${item.key}". Advancing...`);
        appendRecipeStep(item, targetVal);
        stepIdx++;
        break;
      }
    }
  }

  fs.appendFileSync(RECIPE_FILE, '};\n');

  // Save the synchronized Excel dataset
  const finalWb = xlsx.utils.book_new();
  const finalSheet = xlsx.utils.json_to_sheet([finalRowData]);
  xlsx.utils.book_append_sheet(finalWb, finalSheet, 'Responses');
  xlsx.writeFile(finalWb, 'data_final.xlsx');

  console.log('\n======================================================');
  console.log('🎉 SCRIPT EXECUTION FINISHED CLEANLY WITH ZERO FREEZES!');
  console.log('📁 recipe_verified.js');
  console.log('📁 data_final.xlsx');
  console.log('======================================================');

  await page.waitForTimeout(5000);
  await browser.close();
}

run();