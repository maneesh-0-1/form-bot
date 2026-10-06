# Typeform Autonomous Runner (`form-bot`)

An automated, adaptive, AI-driven survey runner built with Playwright and dynamic persona generation.

---

## 🛠️ Prerequisites on New Machine

1. **Node.js** (v18 or higher recommended):
   * Download & install from [nodejs.org](https://nodejs.org/).
2. **Git**:
   * Download & install from [git-scm.com](https://git-scm.com/).

---

## 🚀 Setup Steps (Step-by-Step)

### 1. Clone the Repository
Open a terminal (Command Prompt, PowerShell, or macOS/Linux Terminal) and run:
```bash
git clone https://github.com/maneesh-0-1/form-bot.git
cd form-bot
```

### 2. Install Project Dependencies
Install the required packages (`playwright`, `xlsx`):
```bash
npm install
```

### 3. Install Playwright Chromium Browser (Crucial!)
Playwright needs the Chromium browser binaries to automate the pages:
```bash
npx playwright install chromium
```
*(On Linux systems only, run `npx playwright install-deps chromium` if system library dependencies are needed).*

---

## ⚙️ (Optional) Environment Variables
The runner uses intelligent local persona synthesis by default. If you want online AI generation via Gemini or OpenAI, you can set:
```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your_api_key_here"

# Windows Command Prompt
set GEMINI_API_KEY=your_api_key_here

# macOS / Linux
export GEMINI_API_KEY="your_api_key_here"
```

---

## 🏃 Running the Automation

### Standard Run (Headless, 30 submissions):
```bash
npm start
```
*or:*
```bash
node autonomous_runner.js
```

### Visual / Headed Mode (Watch the browser on screen):
```bash
npm run start:headed
```
*or:*
```bash
node autonomous_runner.js --headed
```

### Custom Submission Count:
```bash
# Run 10 submissions in headed mode
node autonomous_runner.js --headed --count 10

# Run 5 submissions in headless mode
node autonomous_runner.js --count 5
```

### Dry-Run / Preview Mode (Fill everything but halt before final submit):
```bash
node autonomous_runner.js --headed --dry-run --count 1
```

---

## 📁 Key Files & Directories

* `autonomous_runner.js` — Core autonomous agent and navigation engine.
* `ai_response_generator.js` — Dynamic personas and AI answer generation.
* `debug_screenshots/` — Auto-saved screenshots for submitted forms, previews, and errors.
* `automation_debug.log` — Timestamped execution log file.
