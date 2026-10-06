const fs = require('fs');
const path = require('path');

// Optional API Keys from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Diverse Nepal Persona Archetypes across different cities, backgrounds, ages, and focuses
const PERSONA_PROFILES = [
  {
    role: "Computer Science & AI Student",
    field: "STEM (Science, Technology, Engineering, Math)",
    education: "Bachelor's degree (in progress or completed)",
    employment: "Full-time student",
    age: "22–25",
    gender: "Man",
    country: "Nepal",
    community: "Mid-sized city / Urban",
    aiUsage: "Daily",
    focus: "tech education, AI literacy, and practical software internships"
  },
  {
    role: "Young Business & Finance Analyst",
    field: "Business, Finance, or Economics",
    education: "Bachelor's degree (in progress or completed)",
    employment: "Employed full-time",
    age: "22–25",
    gender: "Woman",
    country: "Nepal",
    community: "Megacity / Major metropolis",
    aiUsage: "Several times a week",
    focus: "financial inclusion, fair wages, inflation, and youth entrepreneurship"
  },
  {
    role: "Digital Media & UI/UX Designer",
    field: "Arts, Design, or Media",
    education: "Vocational / Technical training",
    employment: "Self-employed / Freelance",
    age: "18–21",
    gender: "Woman",
    country: "Nepal",
    community: "Small town / Suburban",
    aiUsage: "Daily",
    focus: "creative expression, freelance job security, and mental wellbeing"
  },
  {
    role: "Environmental & Climate Policy Researcher",
    field: "Social Sciences, Law, or Humanities",
    education: "Master's degree or higher",
    employment: "Employed part-time",
    age: "26–30",
    gender: "Non-binary / gender diverse",
    country: "Nepal",
    community: "Mid-sized city / Urban",
    aiUsage: "Occasionally / Monthly",
    focus: "climate action, sustainable development, and youth policy seats"
  },
  {
    role: "Public Health & Medical Graduate",
    field: "Healthcare or Life Sciences",
    education: "Bachelor's degree (in progress or completed)",
    employment: "Unemployed / Looking for work",
    age: "22–25",
    gender: "Man",
    country: "Nepal",
    community: "Mid-sized city / Urban",
    aiUsage: "Several times a week",
    focus: "mental health resources, public health accessibility, and research funding"
  },
  {
    role: "Civil Engineering & Infrastructure Apprentice",
    field: "STEM (Science, Technology, Engineering, Math)",
    education: "Vocational / Technical training",
    employment: "Employed full-time",
    age: "22–25",
    gender: "Man",
    country: "Nepal",
    community: "Rural area",
    aiUsage: "Rarely or never",
    focus: "rural infrastructure, disaster resilience, and technical trade certifications"
  },
  {
    role: "Grassroots Community Youth Organizer",
    field: "Social Sciences, Law, or Humanities",
    education: "High School or equivalent",
    employment: "Self-employed / Freelance",
    age: "18–21",
    gender: "Woman",
    country: "Nepal",
    community: "Small town / Suburban",
    aiUsage: "Several times a week",
    focus: "civic participation, grassroots seed funding, and youth mental health awareness"
  },
  {
    role: "Tourism & Hospitality Specialist",
    field: "Business, Finance, or Economics",
    education: "Bachelor's degree (in progress or completed)",
    employment: "Employed part-time",
    age: "26–30",
    gender: "Man",
    country: "Nepal",
    community: "Mid-sized city / Urban",
    aiUsage: "Occasionally / Monthly",
    focus: "sustainable eco-tourism, local economic sovereignty, and fair gig-economy labor"
  },
  {
    role: "Agritech & Sustainable Farming Researcher",
    field: "STEM (Science, Technology, Engineering, Math)",
    education: "Bachelor's degree (in progress or completed)",
    employment: "Self-employed / Freelance",
    age: "22–25",
    gender: "Woman",
    country: "Nepal",
    community: "Rural area",
    aiUsage: "Weekly",
    focus: "smart agriculture, climate resilience for smallholders, and rural youth cooperatives"
  },
  {
    role: "Remote Software Developer & Freelancer",
    field: "STEM (Science, Technology, Engineering, Math)",
    education: "Self-taught / Non-formal",
    employment: "Self-employed / Freelance",
    age: "18–21",
    gender: "Man",
    country: "Nepal",
    community: "Megacity / Major metropolis",
    aiUsage: "Daily",
    focus: "remote work parity, digital remittance equity, and accessible AI tooling"
  },
  {
    role: "Community Health Worker & Medical Intern",
    field: "Healthcare or Life Sciences",
    education: "Bachelor's degree (in progress or completed)",
    employment: "Employed part-time",
    age: "22–25",
    gender: "Woman",
    country: "Nepal",
    community: "Small town / Suburban",
    aiUsage: "Several times a week",
    focus: "mental wellness parity, primary healthcare outreach, and youth telehealth"
  },
  {
    role: "Renewable Energy & Clean Grid Engineer",
    field: "STEM (Science, Technology, Engineering, Math)",
    education: "Master's degree or higher",
    employment: "Employed full-time",
    age: "26–30",
    gender: "Man",
    country: "Nepal",
    community: "Mid-sized city / Urban",
    aiUsage: "Several times a week",
    focus: "decentralized solar/hydro power, equitable green jobs, and climate finance"
  }
];

// Natural perspective prefixes reflecting authentic youth voices from Nepal
const PERSPECTIVE_PREFIXES = [
  "",
  "",
  "In Nepal, ",
  "Speaking from Nepal, ",
  "From our local experience in Nepal, ",
  "For youth in developing regions like Nepal, ",
  "From a young Nepali professional's perspective, ",
  "In our regional context, ",
  "As emerging leaders in South Asia, ",
  "To create genuine opportunities here, ",
  "From a grassroots student viewpoint in Kathmandu, ",
  "Facing today's global market, ",
  "As young innovators from Nepal, ",
  "Looking at our local job market, ",
  "From the perspective of young graduates, ",
  "In developing nations, ",
  "To prevent talent drain, ",
  "Speaking for our generation, ",
  "From an emerging tech researcher's perspective, ",
  "In my view as a youth in Nepal, "
];

// Combinatorial Generative Sentence Synthesizer for truly dynamic natural text
const TEXT_COMPONENTS = {
  future_of_work_actions: [
    "Bridge theoretical coursework with paid industry apprenticeships",
    "Integrate practical modern tools, AI literacy, and portfolio building into core curricula",
    "Establish direct mentorship channels with tech enterprises and agile startups",
    "Prioritize real-world problem solving, cross-disciplinary execution, and certified bootcamps",
    "Replace outdated rote examinations with client-based projects and collaborative hackathons",
    "Subsidize technical certifications and open-source contributions within university accreditation",
    "Mandate paid internships and workplace mentorship as a compulsory graduation milestone",
    "Create dynamic university-industry incubators offering seed microgrants for student projects",
    "Foster remote internships with international companies to overcome geographic limitations",
    "Align academic syllabi directly with emerging digital economies and green technology sectors",
    "Equip university labs with modern computational infrastructure and open-access research tools",
    "Provide transparent entry-level compensation baselines and ban unpaid student internships",
    "Partner with global open-source communities to give students verifiable production experience",
    "Incentivize local tech companies to hire and train graduates through government-subsidized apprenticeships",
    "Offer modular micro-credentials in data analytics, cloud architecture, and machine learning",
    "Decentralize tech education by funding digital hubs in secondary cities and rural colleges",
    "Bridge the gap between academia and the freelance gig economy through contract negotiation coaching",
    "Establish university innovation funds that finance student-led software and hardware prototypes",
    "Co-design degree programs with industry practitioners rather than purely academic committees",
    "Provide accessible hardware grants so students from lower-income backgrounds can access modern PCs",
    "Incorporate digital entrepreneurship, financial management, and tax literacy into higher education",
    "Cultivate interdisciplinary programs combining environmental science with software engineering",
    "Sponsor university participation in global open-source hackathons and research symposiums",
    "Implement continuous syllabus reviews every two years to keep pace with rapid technological evolution"
  ],
  future_of_work_goals: [
    "to ensure graduates have verifiable skills demanded by the modern global economy.",
    "so emerging talent can transition smoothly without severe entry-level friction.",
    "enabling youth from developing nations to compete fairly in international markets.",
    "to eliminate the persistent gap between academic theory and workplace execution.",
    "fostering resilient career trajectories in an increasingly automated world.",
    "ensuring that talent from regions like Nepal can access global opportunities with dignity.",
    "mitigating youth brain drain through high-value local innovation ecosystems.",
    "empowering graduates to become job creators rather than job seekers.",
    "so students do not spend years studying obsolete technologies.",
    "allowing young professionals to build financial stability and dignified livelihoods.",
    "creating sustainable career pipelines in renewable energy, digital media, and software.",
    "democratizing access to high-earning digital careers for rural and underrepresented youth.",
    "building institutional confidence and retaining skilled youth within our domestic economy."
  ],

  youth_leadership_actions: [
    "Institutionalize formal voting seats for youth on corporate boards and municipal committees",
    "Provide accessible, non-bureaucratic seed grants and transparent mentorship for grassroots projects",
    "Dismantle rigid seniority barriers and sponsor young innovators to lead public pilot initiatives",
    "Create decentralized youth policy incubators with direct legislative consultation rights",
    "Fund community leadership academies focusing on negotiation, governance, and public advocacy",
    "Establish nationwide youth advisory councils with binding review power on long-term policies",
    "Incentivize cross-generational co-leadership models in civil society organizations",
    "Empower student-led initiatives with direct access to local municipal budgets and planning sessions",
    "Guarantee transparent accountability mechanisms so youth recommendations directly translate into policy",
    "Appoint qualified young professionals to state advisory boards on technology, climate, and education",
    "Establish transparent public funding channels for community initiatives led by young citizens",
    "Lower the minimum age requirements for political candidacy and public administrative posts",
    "Create digital civic feedback platforms allowing youth to vote and deliberate on local policies",
    "Protect and celebrate youth activists who challenge corruption and promote institutional transparency",
    "Fund grassroots leadership workshops in rural districts outside major metropolitan capitals",
    "Form youth-led parliamentary watch committees to monitor public spending on youth programs",
    "Encourage universities to treat student union governance as practical civic policy training"
  ],
  youth_leadership_goals: [
    "so that policies genuinely reflect the lived realities of upcoming generations.",
    "ensuring decisions regarding education, climate, and labor aren't made without youth input.",
    "to build institutional trust and empower ethical, forward-looking governance.",
    "unlocking grassroots innovation where traditional bureaucracy frequently stalls.",
    "transforming youth from symbolic token voices into genuine decision-makers.",
    "creating sustainable community resilience powered by young visionaries.",
    "restoring faith in democratic institutions among disillusioned young citizens.",
    "allowing young leaders to tackle urgent systemic issues with fresh urgency and courage.",
    "ensuring public budgets are invested in long-term infrastructure rather than short-term politics.",
    "empowering ethical youth leaders who prioritize planetary sustainability and social equity."
  ],

  important_skills_core: [
    "Continuous cognitive adaptability, prompt engineering, and critical analytical reasoning",
    "Interdisciplinary agility and the capacity to rapidly unlearn and master emerging technologies",
    "Resilient, ethical problem-solving within automated and AI-assisted workflows",
    "High emotional intelligence, cross-cultural empathy, and collaborative communication",
    "Data-driven strategic synthesis combined with proactive self-directed learning",
    "Digital self-efficacy, systems thinking, and discernment in high-noise information environments",
    "Practical digital fluency, ethical reasoning, and bilingual project negotiation"
  ],
  important_skills_reasons: [
    "because fixed degree knowledge depreciates faster than ever in the AI era.",
    "allowing young professionals to reinvent themselves across shifting career landscapes.",
    "as technical tools evolve while human empathy and discernment remain irreplaceable.",
    "to thrive in unpredictable labor markets without succumbing to chronic career anxiety.",
    "enabling proactive leadership rather than passive technological disruption.",
    "providing young innovators the agility to solve complex localized challenges."
  ],

  world_leader_priorities: [
    "Decisively fund clean energy transitions, affordable housing, and transparent open governance",
    "Dismantle economic gatekeeping, invest in digital infrastructure, and protect youth mental wellness",
    "Incentivize skills-based hiring over legacy pedigree and eliminate predatory student debt",
    "Prioritize ethical AI safety standards and democratize global access to computational resources",
    "Shift focus from short-term electoral gains to sustainable youth employment and climate resilience",
    "Guarantee formal youth representation in climate diplomacy and multilateral economic forums",
    "Establish equitable global trade corridors and remove arbitrary visa barriers for young scholars",
    "Invest heavily in regional digital connectivity so developing economies participate fully in the AI age",
    "Impose strict multilateral limits on military escalation and redirect defense budgets to education",
    "Create an international climate reparations fund supporting youth-led adaptation in vulnerable nations",
    "Establish a global digital commons ensuring free educational materials and scientific research for all",
    "Hold multinational corporations accountable for fair wages, remote labor rights, and data sovereignty",
    "Treat global youth unemployment as an urgent international emergency requiring joint funding",
    "Protect freedom of expression and open digital civic spaces against state censorship"
  ],
  world_leader_appeals: [
    "because our generation will inherit the consequences of today's deferred decisions.",
    "to rebuild faith in multilateral institutions before systemic crises become irreversible.",
    "ensuring that progress is equitable and no developing region is left behind.",
    "as young people deserve an economy grounded in dignity, sustainability, and real opportunity.",
    "enabling fair participation for developing nations like Nepal in international multilateral forums.",
    "because planetary boundaries and youth economic survival cannot wait for bureaucratic delay.",
    "to prevent millions of ambitious young minds from slipping into permanent economic precarity.",
    "ensuring that the technological leap forwards benefits ordinary people rather than an elite few.",
    "so that peace, environmental stability, and youth welfare take precedence over geopolitical rivalry."
  ],

  youth_vision_themes: [
    "A borderless, equitable economy where relentless curiosity and talent outweigh geographic origin",
    "A sustainable society driven by conscious technology, accessible mental healthcare, and living wages",
    "A future where youth are active co-architects of policy rather than passive spectators",
    "Democratized opportunities in emerging green and digital industries for every background",
    "An inclusive global landscape where automation empowers human creativity instead of displacing workers",
    "Recognizing young people as essential innovators with high adaptability rather than an inexperienced demographic",
    "Viewing our generation not as fragile or entitled, but as extraordinarily resilient innovators",
    "An acknowledgment that youth are leading climate action, digital transformation, and social justice",
    "Moving past the stereotype of youth apathy and recognizing our profound civic engagement",
    "Recognizing that young professionals from the Global South carry world-class technical potential",
    "Replacing condescending institutional attitudes with genuine trust in youth capability and integrity"
  ],
  youth_vision_outcomes: [
    "fostering collective resilience, dignity, and shared prosperity worldwide.",
    "empowering local communities while remaining globally interconnected.",
    "enabling every young person to build a fulfilling life without burnout or fear.",
    "harmonizing technological advancement with planetary boundaries and human ethics.",
    "giving youth the institutional support to lead sustainable progress in their home countries.",
    "building mutual respect across generations to solve existential 21st-century challenges.",
    "ensuring young innovators are given the resources to scale solutions for their communities.",
    "creating an open society where merit and dedication triumph over hereditary privilege."
  ],

  urgent_challenges_topic: [
    "Accelerating climate disruption and equitable access to decentralized clean energy grids",
    "The widening global skills-to-employment gap and escalating youth economic precariousness",
    "Establishing ethical, decentralized AI governance to avoid extreme technological monopolies",
    "The surging mental health crisis compounded by runaway cost of living and housing unaffordability",
    "Rebuilding institutional trust and democratic participation in an era of algorithmic polarization",
    "Mitigating severe regional economic inequalities and providing fair opportunities for Global South youth",
    "The severe lack of quality jobs causing involuntary mass migration and regional brain drain",
    "Persistent digital divides that leave rural youth disconnected from high-value remote work",
    "The erosion of educational affordability alongside escalating credentials inflation",
    "Geopolitical instability and conflict that disrupts youth education, livelihoods, and safety"
  ],
  urgent_challenges_urgency: [
    "because failure to act immediately will permanently lock upcoming generations into systemic insecurity.",
    "as this determines whether technological progress benefits humanity or deepens global inequality.",
    "because without immediate policy interventions, societal cohesion and planetary stability are at risk.",
    "since young people cannot build prosperous futures on an environmentally and economically destabilized planet.",
    "ensuring youth are not forced to migrate abroad simply to find dignified livelihoods.",
    "because mental burnout and economic hopelessness among youth threaten global progress.",
    "as delay will leave vulnerable nations facing catastrophic ecological and financial shocks alone.",
    "to ensure that our generation inherits a livable planet with genuine economic prospects."
  ]
};

function getRandomElement(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Generate dynamic, unique natural language text every single call
function synthesizeDynamicText(type) {
  const prefix = getRandomElement(PERSPECTIVE_PREFIXES);
  const templateIdx = Math.floor(Math.random() * 5);
  let body = "";

  switch (type) {
    case 'future_of_work_demand': {
      const action = getRandomElement(TEXT_COMPONENTS.future_of_work_actions);
      const goal = getRandomElement(TEXT_COMPONENTS.future_of_work_goals);
      const actLower = action.charAt(0).toLowerCase() + action.slice(1);
      
      if (templateIdx === 0) {
        body = `${actLower} ${goal}`;
      } else if (templateIdx === 1) {
        body = `universities and employers must immediately ${actLower} ${goal}`;
      } else if (templateIdx === 2) {
        body = `we urgently demand that institutions ${actLower}, ${goal}`;
      } else if (templateIdx === 3) {
        body = `the most pressing priority is to ${actLower} ${goal}`;
      } else {
        body = `companies and academia should collaboratively ${actLower} ${goal}`;
      }
      break;
    }
    case 'youth_leadership_action': {
      const action = getRandomElement(TEXT_COMPONENTS.youth_leadership_actions);
      const goal = getRandomElement(TEXT_COMPONENTS.youth_leadership_goals);
      const actLower = action.charAt(0).toLowerCase() + action.slice(1);

      if (templateIdx === 0) {
        body = `${actLower} ${goal}`;
      } else if (templateIdx === 1) {
        body = `governments must prioritize to ${actLower} ${goal}`;
      } else if (templateIdx === 2) {
        body = `the primary step forward is to ${actLower}, ${goal}`;
      } else if (templateIdx === 3) {
        body = `institutions should actively ${actLower} ${goal}`;
      } else {
        body = `to empower young voices, leaders should ${actLower} ${goal}`;
      }
      break;
    }
    case 'world_leader_speech': {
      const priority = getRandomElement(TEXT_COMPONENTS.world_leader_priorities);
      const appeal = getRandomElement(TEXT_COMPONENTS.world_leader_appeals);
      const priLower = priority.charAt(0).toLowerCase() + priority.slice(1);

      if (templateIdx === 0) {
        body = `${priLower}, ${appeal}`;
      } else if (templateIdx === 1) {
        body = `world leaders must ${priLower} ${appeal}`;
      } else if (templateIdx === 2) {
        body = `in 2026, international bodies must urgently ${priLower}, ${appeal}`;
      } else if (templateIdx === 3) {
        body = `we call on global institutions to ${priLower} ${appeal}`;
      } else {
        body = `the urgent global mandate is to ${priLower}, ${appeal}`;
      }
      break;
    }
    case 'youth_vision_summary': {
      const theme = getRandomElement(TEXT_COMPONENTS.youth_vision_themes);
      const outcome = getRandomElement(TEXT_COMPONENTS.youth_vision_outcomes);
      const themeLower = theme.charAt(0).toLowerCase() + theme.slice(1);

      if (templateIdx === 0) {
        body = `our vision is centered on ${themeLower}, ${outcome}`;
      } else if (templateIdx === 1) {
        body = `we want institutions to embrace ${themeLower}, ${outcome}`;
      } else if (templateIdx === 2) {
        body = `I want our generation to be seen through ${themeLower}, ${outcome}`;
      } else if (templateIdx === 3) {
        body = `society should recognize that we represent ${themeLower}, ${outcome}`;
      } else {
        body = `we need to shift the narrative towards ${themeLower}, ${outcome}`;
      }
      break;
    }
    case 'urgent_challenge': {
      const topic = getRandomElement(TEXT_COMPONENTS.urgent_challenges_topic);
      const urgency = getRandomElement(TEXT_COMPONENTS.urgent_challenges_urgency);
      const topLower = topic.charAt(0).toLowerCase() + topic.slice(1);

      if (templateIdx === 0) {
        body = `the most urgent priority is ${topLower}, ${urgency}`;
      } else if (templateIdx === 1) {
        body = `the single most critical issue is ${topLower}, ${urgency}`;
      } else if (templateIdx === 2) {
        body = `young people globally face ${topLower}, ${urgency}`;
      } else if (templateIdx === 3) {
        body = `without question, ${topLower} is the primary emergency, ${urgency}`;
      } else {
        body = `we must urgently confront ${topLower}, ${urgency}`;
      }
      break;
    }
    default: {
      body = "prioritize actionable skills development, transparent governance, and inclusive economic policies for youth.";
      break;
    }
  }

  // Clean and format text
  let finalResult = prefix ? `${prefix}${body}` : `${body.charAt(0).toUpperCase() + body.slice(1)}`;
  finalResult = finalResult.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
  if (!/[.!?]$/.test(finalResult)) finalResult += '.';
  return finalResult;
}

// Online AI Generator using Gemini API or OpenAI if key is present; otherwise uses combinatorial synthesizer
async function generateWithOnlineAI(prompt, topic, fallbackType) {
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a young person in Nepal answering a global youth survey. Answer concisely in 1-2 authentic, compelling sentences (15-25 words). Prompt: ${prompt}`
            }]
          }]
        })
      });
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text && text.length > 8) return text.replace(/^["']|["']$/g, '');
    } catch (e) {
      console.warn(`[AI Generator] Online Gemini request failed: ${e.message}`);
    }
  } else if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a young respondent in Nepal answering a global future survey. Answer concisely in 1-2 authentic, thoughtful sentences (15-25 words).' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 60,
          temperature: 0.95
        })
      });
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 8) return text.replace(/^["']|["']$/g, '');
    } catch (e) {
      console.warn(`[AI Generator] Online OpenAI request failed: ${e.message}`);
    }
  }

  return synthesizeDynamicText(fallbackType || topic);
}

/**
 * Generate a complete, unique, and coherent response profile for the survey.
 * All choices are dynamically randomized per run, while strictly pinning Nepal.
 */
async function generateUniqueSurveyResponses() {
  const persona = getRandomElement(PERSONA_PROFILES);
  console.log(`\n🎭 Generated Random Submission Persona: [${persona.role}] (${persona.country}, Age: ${persona.age}, Gender: ${persona.gender})`);

  // Dynamically generate unique AI answers for all text fields
  const q26Text = await generateWithOnlineAI(
    `What concrete action should universities and companies take to secure the future of work for youth? Focus on ${persona.focus}.`,
    "future_of_work_demand",
    "future_of_work_demand"
  );

  const q38Text = await generateWithOnlineAI(
    `What single priority action should governments take to increase youth leadership?`,
    "youth_leadership_action",
    "youth_leadership_action"
  );

  const q59Text = await generateWithOnlineAI(
    `Faced with current global context in 2026, what is your primary demand for international institutions and world leaders?`,
    "world_leader_speech",
    "world_leader_speech"
  );

  const q60Text = await generateWithOnlineAI(
    `If you could change ONE thing about the way your generation is perceived by institutions, what would it be?`,
    "youth_vision_summary",
    "youth_vision_summary"
  );

  const q61Text = await generateWithOnlineAI(
    `What do you believe is the single most urgent challenge young people face globally in 2026, and why?`,
    "urgent_challenge",
    "urgent_challenge"
  );

  // Dynamic Ratings with randomized human variation (1 to 5)
  const randRating = (base) => {
    const delta = (Math.random() > 0.5 ? 1 : (Math.random() < 0.35 ? -1 : 0));
    return Math.max(1, Math.min(5, (base || 3) + delta)).toString();
  };

  return {
    persona,
    answers: {
      // Demographics - Strictly Nepal
      consent: "Yes, I consent",
      contact: Math.random() > 0.4 ? "Yes" : "No",
      age: getRandomElement(["18–21", "22–25", "26–30", "Under 18"]),
      gender: getRandomElement(["Woman", "Man", "Non-binary / gender diverse", "Prefer not to say"]),
      originCountry: "Nepal",
      currentCountry: "Nepal",
      employment: getRandomElement(["Full-time student", "Employed full-time", "Employed part-time", "Self-employed / Freelance", "Unemployed / Looking for work"]),
      education: getRandomElement(["Bachelor's degree (in progress or completed)", "Master's degree or higher", "Vocational / Technical training", "High School or equivalent"]),
      fieldOfStudy: getRandomElement(["STEM (Science, Technology, Engineering, Math)", "Business, Finance, or Economics", "Social Sciences, Law, or Humanities", "Arts, Design, or Media", "Healthcare or Life Sciences"]),
      youthOrg: getRandomElement(["Yes, actively", "Yes, occasionally", "No, but interested"]),
      community: getRandomElement(["Megacity / Major metropolis", "Mid-sized city / Urban", "Small town / Suburban", "Rural area"]),
      livedAbroad: getRandomElement(["No, but I plan to", "Yes, temporarily (study/work)", "No, and no immediate plans"]),

      // Section 2: Future of Work
      jobPrepRating: randRating(3),
      formalEdEquipRating: randRating(3),
      skillsAcquisitionRank: shuffleArray(["Self-taught learning", "Hands-on experience", "Formal education"]),
      humanCentricSkills: shuffleArray(["Creative problem-solving", "Emotional intelligence & empathy", "Critical thinking & ethical reasoning", "Resilience & adaptability", "Cross-cultural collaboration & communication"]).slice(0, 2 + Math.floor(Math.random() * 2)),
      aiUsage: getRandomElement(["Daily", "Several times a week", "Occasionally / Monthly"]),
      aiConcernRating: randRating(3),
      traditionalEmploymentRating: randRating(3),
      sideHustle: getRandomElement(["No", "Yes, a single side hustle", "Yes, multiple sources"]),
      financialConcern: getRandomElement(["Inflation, rising cost of living", "Finding a first job / unemployment", "Housing affordability", "Student debt / loan repayment", "Stagnant wages"]),
      realWorldProject: getRandomElement(["No, but I want to", "Yes, once", "Yes, multiple projects"]),
      skillsBarrier: shuffleArray(["High cost of quality training", "Lack of time / busy with work or study", "Lack of mentorship / professional networks", "Don't know which skills are needed", "My education covers it"]).slice(0, 2),
      careerImpactRating: randRating(4),
      demandCompaniesText: q26Text,

      // Section 3: Youth Leadership
      leadershipFactorsRank: shuffleArray(["Inspirational vision", "Empowering others", "Formal authority", "Peer trust & authenticity"]),
      initiatedProjects: getRandomElement(["Once", "2–3 times", "Never", "4+ times"]),
      leadershipBarrier: getRandomElement(["Systemic: Lack of networks & resources", "Fear of failure or criticism", "Lack of experience / mentorship", "Time constraints & burn-out", "No clear opportunities"]),
      youthInfluenceRating: randRating(3),
      leadershipCompetencies: shuffleArray(["Strategic vision & planning", "Emotional intelligence & active listening", "Cross-cultural communication", "Decisiveness under pressure", "Fundraising & resource mobilization"]).slice(0, 2),
      communitySupportRating: randRating(4),
      decisionMakingRating: randRating(4),
      leadershipReadinessRating: randRating(4),
      trustInFigures: getRandomElement(["Emerging Community Leaders", "Academic / Scientific experts", "Independent journalists", "Corporate / Tech CEOs"]),
      societyInfluenceRank: shuffleArray(["Social media creators & influencers", "Youth grassroots organizers", "Scientists & innovators", "Policy makers & governments"]),
      priorityActionText: q38Text,

      // Section 4 & 5: Mental Health
      mentalHealthRating: randRating(3),
      burnoutRating: randRating(3),
      disclosingComfortRating: randRating(3),
      stressSources: shuffleArray(["Financial pressures / cost of living", "Academic workload & career pressure", "Job market uncertainty", "Relationships & family expectations", "Social media & digital overload", "Climate anxiety & global instability"]).slice(0, 3),
      institutionMentalHealthRating: randRating(3),
      mentalHealthResources: shuffleArray(["On-site or subsidized counseling / therapy", "Clear protocols for mental health days / extensions", "Peer support groups & workshops", "Mental wellness apps & digital subscriptions"]).slice(0, 2),
      emotionalCrisisHelp: shuffleArray(["Close friends or peers", "Family members", "Professional therapist / counselor", "Online communities & forums", "Self-help books & mindfulness apps"]).slice(0, 2),
      futureUncertaintyImpact: randRating(4),
      resilienceToolsRating: randRating(4),
      matrixPerformance: `${randRating(3)}, ${randRating(3)}`,
      aiOpportunitiesOutlook: getRandomElement(["Agree: It will create more opportunities", "Disagree: It will eliminate more opportunities", "Uncertain / Neutral"]),

      // Section 6: Global Engagement
      globalTangibleOpps: getRandomElement(["1–2", "None", "3–5"]),
      globalActionsFreq: getRandomElement(["Monthly", "Occasionally", "Weekly", "Several times a year"]),
      multilateralKnowledgeRating: randRating(3),
      individualActionInfluenceRating: randRating(3),
      conflictResponseExpectation: getRandomElement([
        "Immediate ceasefires and protection of civilians",
        "Enforceable international law and accountability",
        "Direct humanitarian corridors and youth aid distribution",
        "Diplomatic peace negotiations led by neutral parties"
      ]),
      globalEngageObstacle: getRandomElement([
        "Lack of financial resources",
        "No local entry points or organizations",
        "Lack of time due to daily survival/work",
        "Disillusionment with bureaucracy",
        "Language or travel barriers"
      ]),
      orgGlobalPresenceRating: randRating(4),
      demandCompaniesText2026: q59Text,
      youthVisionText: q60Text,
      urgentChallengeText: q61Text
    }
  };
}

module.exports = {
  PERSONA_PROFILES,
  TEXT_COMPONENTS,
  generateUniqueSurveyResponses,
  generateWithOnlineAI,
  synthesizeDynamicText
};
