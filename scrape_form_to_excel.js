const { chromium } = require('playwright');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const FORM_URL = 'https://form.typeform.com/to/zx9C41uZ';
const EXCEL_OUTPUT = path.join(__dirname, 'Typeform_Learned_Schema.xlsx');
const JSON_OUTPUT = path.join(__dirname, 'learned_form_knowledge.json');

// Reference Question Rules for Advancing During Scrape
const RULES = [
  // Section 1: Demographics
  { key: "Consent", match: /consent/i, type: 'radio', target: "Yes, I consent", defaultOptions: ["Yes, I consent", "No, I do not consent"] },
  { key: "Contact", match: /agree to be contacted/i, type: 'radio', target: "Yes", defaultOptions: ["Yes", "No"] },
  { key: "Age", match: /what is your age/i, type: 'radio', target: "22–25", defaultOptions: ["Under 18", "18–21", "22–25", "26–30", "31+"] },
  { key: "Gender", match: /what is your gender/i, type: 'radio', target: "Man", defaultOptions: ["Woman", "Man", "Non-binary / gender diverse", "Prefer not to say"] },
  { key: "Origin Country", match: /where are you from/i, type: 'dropdown', target: "Nepal", defaultOptions: ["Nepal", "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "Other"] },
  { key: "Current Country", match: /where do you currently live/i, type: 'dropdown', target: "Nepal", defaultOptions: ["Nepal", "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "Other"] },
  { key: "Employment", match: /employment status/i, type: 'radio', target: "Full-time student", defaultOptions: ["Full-time student", "Employed full-time", "Employed part-time", "Self-employed / Freelance", "Unemployed / Looking for work", "Other"] },
  { key: "Education", match: /highest level of education/i, type: 'radio', target: "Bachelor's", defaultOptions: ["High School or equivalent", "Vocational / Technical training", "Bachelor's degree (in progress or completed)", "Master's degree or higher", "Self-taught / Non-formal"] },
  { key: "Field of Study", match: /field of study/i, type: 'radio', target: "STEM", defaultOptions: ["STEM (Science, Technology, Engineering, Math)", "Business, Finance, or Economics", "Social Sciences, Law, or Humanities", "Arts, Design, or Media", "Healthcare or Life Sciences", "Other"] },
  { key: "Youth Organization", match: /member of a youth organization/i, type: 'radio', target: "Yes, actively", defaultOptions: ["Yes, actively", "Yes, occasionally", "No, but interested", "No, not interested"] },
  { key: "Community Type", match: /type of community/i, type: 'radio', target: "Mid-sized city", defaultOptions: ["Megacity / Major metropolis", "Mid-sized city / Urban", "Small town / Suburban", "Rural area"] },
  { key: "Lived Abroad", match: /lived, studied, or worked in a country other than/i, type: 'radio', target: "No, but I plan to", defaultOptions: ["Yes, permanently / long-term", "Yes, temporarily (study/work)", "No, but I plan to", "No, and no immediate plans"] },

  // Section 2: Future of Work & Skills
  { key: "Job Market Prep", match: /how prepared do you feel for the current job market/i, type: 'rating', target: "4", defaultOptions: ["1 (Very unprepared)", "2", "3", "4", "5 (Very prepared)"] },
  { key: "Formal Education Equip", match: /formal education equip you/i, type: 'rating', target: "3", defaultOptions: ["1 (Not at all)", "2", "3", "4", "5 (Extremely well)"] },
  { key: "Skills Acquisition Ranking", match: /rank the following three options based on where you acquired/i, type: 'ranking', target: ["Self-taught learning", "Hands-on experience", "Formal education"], defaultOptions: ["Self-taught learning", "Hands-on experience", "Formal education"] },
  { key: "Human Centric Skills", match: /human-centric skills do you believe ai cannot replace/i, type: 'multiselect', target: ["Creative problem-solving", "Resilience", "Cross-cultural collaboration"], defaultOptions: ["Creative problem-solving", "Emotional intelligence & empathy", "Critical thinking & ethical reasoning", "Resilience & adaptability", "Cross-cultural collaboration & communication", "Leadership & mobilization"] },
  { key: "AI Tools Frequency", match: /how frequently do you productively use artificial intelligence/i, type: 'radio', target: "Daily", defaultOptions: ["Daily", "Several times a week", "Occasionally / Monthly", "Rarely or never"] },
  { key: "AI Replacement Concern", match: /how concerned are you about ai replacing your job/i, type: 'rating', target: "5", defaultOptions: ["1 (Not concerned at all)", "2", "3", "4", "5 (Extremely concerned)"] },
  { key: "Traditional Employment", match: /traditional employment/i, type: 'rating', target: "3", defaultOptions: ["1 (Strongly disagree)", "2", "3", "4", "5 (Strongly agree)"] },
  { key: "Alternative Income / Emergency", match: /alternative source of income, side hustle/i, type: 'radio', target: "No", defaultOptions: ["Yes, multiple sources", "Yes, a single side hustle", "No, relying on primary income/studies", "No"] },
  { key: "Financial Concern", match: /primary financial concern for the next 2 years/i, type: 'radio', target: "Inflation, rising cost", defaultOptions: ["Inflation, rising cost of living", "Finding a first job / unemployment", "Housing affordability", "Student debt / loan repayment", "Stagnant wages"] },
  { key: "Structured Real World Project", match: /structured real-world project, community initiative/i, type: 'radio', target: "No, but I want to", defaultOptions: ["Yes, multiple projects", "Yes, once", "No, but I want to", "No, not interested"] },
  { key: "Skills Barrier", match: /biggest barrier to gaining the skills/i, type: 'multiselect', target: ["My education covers it", "Lack of time", "I don't know what skills I"], defaultOptions: ["High cost of quality training", "Lack of time / busy with work or study", "Lack of mentorship / professional networks", "Don't know which skills are needed", "My education covers it"] },
  { key: "Career Impact Importance", match: /how important is it that your career has positive social/i, type: 'rating', target: "3", defaultOptions: ["1 (Not important)", "2", "3", "4", "5 (Essential / Top priority)"] },
  { key: "Demand to Companies/Universities", match: /to secure the future of work for your generation/i, type: 'text', target: "More practical learning and industry partnerships", defaultOptions: ["[AI Generated Short Text Answer]"] },

  // Section 3: Youth Leadership
  { key: "Leadership Factors Rank", match: /rank the following factors from 1 to 4 based on what defines a true leader/i, type: 'ranking', target: ["Inspirational vision", "Empowering others", "Formal authority", "Peer trust"], defaultOptions: ["Inspirational vision", "Empowering others", "Formal authority", "Peer trust & authenticity"] },
  { key: "Initiated Community Project", match: /how many times have you self-initiated or led a community project/i, type: 'radio', target: "Once", defaultOptions: ["Never", "Once", "2–3 times", "4+ times"] },
  { key: "Leadership Barrier", match: /primary barrier preventing you from taking on a formal or informal leadership/i, type: 'radio', target: "Systemic: Lack of networks", defaultOptions: ["Systemic: Lack of networks & resources", "Fear of failure or criticism", "Lack of experience / mentorship", "Time constraints & burn-out", "No clear opportunities"] },
  { key: "Youth Representation Influence", match: /young people today have genuine influence over decisions/i, type: 'rating', target: "5", defaultOptions: ["1 (No influence)", "2", "3", "4", "5 (Major influence)"] },
  { key: "Leadership Competencies", match: /which of these leadership competencies/i, type: 'multiselect', target: ["Cross-cultural communication", "Communication", "Decision"], defaultOptions: ["Strategic vision & planning", "Emotional intelligence & active listening", "Cross-cultural communication", "Decisiveness under pressure", "Fundraising & resource mobilization", "Community organizing"] },
  { key: "Community Support", match: /how supported do you feel by.*organizations around you/i, type: 'rating', target: "5", defaultOptions: ["1 (Not supported at all)", "2", "3", "4", "5 (Fully supported)"] },
  { key: "Making Decisions Impact", match: /making decisions about real projects/i, type: 'rating', target: "3", defaultOptions: ["1 (Low impact)", "2", "3", "4", "5 (High impact)"] },
  { key: "Leadership Role Readiness", match: /how comfortable and ready do you feel to.*claim and exercise a seat/i, type: 'rating', target: "4", defaultOptions: ["1 (Not ready)", "2", "3", "4", "5 (Completely ready)"] },
  { key: "Trust in Figures", match: /rate your level of trust in the following figures/i, type: 'radio', target: "Emerging Community Leaders", defaultOptions: ["Elected politicians", "Corporate / Tech CEOs", "Emerging Community Leaders", "Academic / Scientific experts", "Independent journalists"] },
  { key: "Positive Influence Society Rank", match: /who has the strongest ability to positively influence society/i, type: 'ranking', target: ["Social media", "Lived experience", "Institutional"], defaultOptions: ["Social media creators & influencers", "Youth grassroots organizers", "Scientists & innovators", "Policy makers & governments"] },
  { key: "Priority Action Youth Leadership", match: /if governments, organizations and businesses want to effectively increase youth leadership/i, type: 'text', target: "Provide accessible funding, mentorship, and seats at policy tables", defaultOptions: ["[AI Generated Short Text Answer]"] },

  // Section 4 & 5: Mental Health
  { key: "Mental Wellbeing Rate", match: /overall, how would you rate your mental health/i, type: 'rating', target: "4", defaultOptions: ["1 (Poor)", "2 (Fair)", "3 (Good)", "4 (Very good)", "5 (Excellent)"] },
  { key: "Burnout Limiting Opportunities", match: /mental health challenges or burnout limited your ability/i, type: 'rating', target: "5", defaultOptions: ["1 (Never)", "2", "3", "4", "5 (Frequently / Severely)"] },
  { key: "Disclosing Crisis Comfort", match: /how comfortable would you feel disclosing and openly discussing/i, type: 'rating', target: "2", defaultOptions: ["1 (Very uncomfortable)", "2", "3", "4", "5 (Very comfortable)"] },
  { key: "Stress Drivers", match: /what are the top source of stress in your life/i, type: 'multiselect', target: ["Relationships", "Job market uncertainty", "Climate anxiety"], defaultOptions: ["Financial pressures / cost of living", "Academic workload & career pressure", "Job market uncertainty", "Relationships & family expectations", "Social media & digital overload", "Climate anxiety & global instability"] },
  { key: "Institution Mental Health Seriousness", match: /organizations i belong to take mental health seriously/i, type: 'rating', target: "4", defaultOptions: ["1 (Strongly disagree)", "2", "3", "4", "5 (Strongly agree)"] },
  { key: "Institution Support Initiatives", match: /what concrete, accessible mental health resources does your educational/i, type: 'multiselect', target: ["Clear protocols", "On-site or subsidized"], defaultOptions: ["On-site or subsidized counseling / therapy", "Clear protocols for mental health days / extensions", "Peer support groups & workshops", "Mental wellness apps & digital subscriptions", "None of the above"] },
  { key: "Turn to for Help", match: /when you feel overwhelmed or experience an emotional crisis/i, type: 'multiselect', target: ["Social media", "Online communities"], defaultOptions: ["Close friends or peers", "Family members", "Professional therapist / counselor", "Online communities & forums", "Self-help books & mindfulness apps", "I keep it to myself"] },
  { key: "Future Uncertainty Impact", match: /how much does uncertainty about the future.*impact your mental/i, type: 'rating', target: "4", defaultOptions: ["1 (No impact)", "2", "3", "4", "5 (Severe impact)"] },
  { key: "Emotional Resilience Tools", match: /young people today need more emotional resilience tools/i, type: 'rating', target: "2", defaultOptions: ["1 (Strongly disagree)", "2", "3", "4", "5 (Strongly agree)"] },
  { key: "Workplace 2 Aspects Matrix", match: /rate how your university, school, or workplace currently performs regarding the following two aspects/i, type: 'matrix', target: "3, 3", defaultOptions: ["Row 1: Mental wellbeing support & resources (1-5)", "Row 2: Career preparation & practical training (1-5)"] },
  { key: "AI Opportunities Outlook", match: /artificial intelligence will create more opportunities than it eliminates/i, type: 'radio', target: "opportunity", defaultOptions: ["Agree: It will create more opportunities", "Disagree: It will eliminate more opportunities", "Uncertain / Neutral"] },

  // Section 6: Global Engagement & Outlook
  { key: "Follow International News", match: /how often do you follow international news/i, type: 'radio', target: "Monthly", defaultOptions: ["Daily", "A few times a week", "Weekly", "Monthly", "Rarely or never"] },
  { key: "SDG Knowledge", match: /how knowledgeable do you feel about the sustainable development goals/i, type: 'rating', target: "5", defaultOptions: ["1 (Not familiar at all)", "2", "3", "4", "5 (Very knowledgeable)"] },
  { key: "Individual Actions Contribute", match: /how much do you feel your individual actions can contribute/i, type: 'rating', target: "5", defaultOptions: ["1 (No contribution)", "2", "3", "4", "5 (Significant contribution)"] },
  { key: "Global Institution Trust", match: /which global institution do you have the most trust in/i, type: 'radio', target: "Nothing — I've lost faith in", defaultOptions: ["United Nations (UN)", "World Health Organization (WHO)", "World Bank / IMF", "International Court of Justice (ICJ)", "Nothing — I've lost faith in global institutions"] },
  { key: "Engaging Obstacle", match: /what is the greatest obstacle preventing you from engaging/i, type: 'radio', target: "No local entry point", defaultOptions: ["Lack of financial resources", "No local entry points or organizations", "Lack of time due to daily survival/work", "Disillusionment with bureaucracy", "Language or travel barriers"] },
  { key: "Global Cooperation Optimism", match: /how optimistic are you that global cooperation can solve/i, type: 'rating', target: "5", defaultOptions: ["1 (Extremely pessimistic)", "2", "3", "4", "5 (Extremely optimistic)"] },
  { key: "Important Mindset Skill", match: /faced with rapid global change, what is the single most important skill/i, type: 'text', target: "Industry ready skills, critical thinking, and rapid adaptability", defaultOptions: ["[AI Generated Short Text Answer]"] },
  { key: "Policy Demand World Leader", match: /if you had 5 minutes with a world leader/i, type: 'text', target: "Prioritize youth employment, quality education, and transparent leadership", defaultOptions: ["[AI Generated Short Text Answer]"] },
  { key: "Youth Vision Summary", match: /in one or two sentences, summarize your vision/i, type: 'text', target: "Equal access to opportunity, fair living wages, and practical modern education", defaultOptions: ["[AI Generated Short Text Answer]"] },
  { key: "Urgent Challenge 2026", match: /what is the single most urgent challenge the world must address by 2030/i, type: 'text', target: "Quality education, economic equality, and climate sustainability.", defaultOptions: ["[AI Generated Short Text Answer]"], isFinal: true }
];

(async () => {
  console.log('================================================================');
  console.log('📊 COMPILING FORM SCHEMA & KNOWLEDGE INTO EXCEL & JSON');
  console.log('================================================================\n');

  const rows = RULES.map((r, idx) => {
    let section = 'Section 1: Demographics';
    if (idx >= 12 && idx < 25) section = 'Section 2: Future of Work & Skills';
    else if (idx >= 25 && idx < 36) section = 'Section 3: Leadership & Youth Voice';
    else if (idx >= 36 && idx < 47) section = 'Section 4 & 5: Mental Health & Support';
    else if (idx >= 47) section = 'Section 6: Global Engagement & Outlook';

    return {
      'Item Number': idx + 1,
      'Key Identifier': r.key,
      'Section': section,
      'Question Title / Regex Match': r.match.source,
      'Input Type': r.type.toUpperCase(),
      'Options Count': r.defaultOptions.length,
      'Available Options List': r.defaultOptions.join(' | '),
      'Sample / Default Choice': Array.isArray(r.target) ? r.target.join(', ') : r.target,
      'AI Generative Text Required': r.type === 'text' ? 'YES' : 'NO'
    };
  });

  // Save to JSON
  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(RULES, null, 2), 'utf-8');
  console.log(`✅ Saved schema JSON to: ${JSON_OUTPUT}`);

  // Save to Excel
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 12 }, // Item Number
    { wch: 30 }, // Key Identifier
    { wch: 35 }, // Section
    { wch: 50 }, // Question Title / Regex Match
    { wch: 14 }, // Input Type
    { wch: 14 }, // Options Count
    { wch: 75 }, // Available Options List
    { wch: 40 }, // Sample / Default Choice
    { wch: 26 }  // AI Generative Text Required
  ];

  xlsx.utils.book_append_sheet(wb, ws, 'Typeform Learned Schema');
  xlsx.writeFile(wb, EXCEL_OUTPUT);

  console.log(`📊 Successfully written Excel spreadsheet: ${EXCEL_OUTPUT}`);
  console.log(`Total questions structured: ${rows.length}`);
})();
