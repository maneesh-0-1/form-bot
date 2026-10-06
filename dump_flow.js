const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(800);

  async function getActiveBlock() {
    return await page.evaluate(() => {
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => ({ el, text: el.innerText.trim(), top: el.getBoundingClientRect().top }))
        .filter(c => c.top >= -50 && c.top < window.innerHeight && c.text);
      if (counters.length === 0) {
        return { counter: 'statement', text: document.body.innerText.slice(0, 200) };
      }
      counters.sort((a, b) => Math.abs(a.top - window.innerHeight * 0.35) - Math.abs(b.top - window.innerHeight * 0.35));
      const activeCounter = counters[0];
      const block = activeCounter.el.closest('[data-qa*="blocktype"], section, form, div[data-block-type], div[data-qa-block="true"]') || activeCounter.el.parentElement.parentElement;
      return {
        counter: activeCounter.text,
        text: block.innerText.replace(/\s+/g, ' ').trim()
      };
    });
  }

  // Q1
  console.log('Q1 Block:', await getActiveBlock());
  await page.locator('button:has-text("Yes, I consent")').first().click({ force: true });
  await page.waitForTimeout(400);
  const ok1 = page.locator('button[data-qa*="ok-button"]').first();
  if (await ok1.isVisible()) await ok1.click({ force: true });
  await page.waitForTimeout(800);

  // Q2
  console.log('Q2 Block:', await getActiveBlock());
  await page.locator('button:has-text("Yes")').last().click({ force: true });
  await page.waitForTimeout(400);
  const ok2 = page.locator('button[data-qa*="ok-button"]').first();
  if (await ok2.isVisible()) await ok2.click({ force: true });
  await page.waitForTimeout(800);

  // Q3
  console.log('Q3 Block:', await getActiveBlock());
  // Let's see what happens when clicking 22-25
  const btn22 = page.locator('button:has-text("22–25")').first();
  console.log('Clicking 22-25...');
  await btn22.click({ force: true });
  await page.waitForTimeout(400);
  const ok3 = page.locator('button[data-qa*="ok-button"]').first();
  if (await ok3.isVisible()) await ok3.click({ force: true });
  await page.waitForTimeout(1000);

  // Next screen after Q3
  console.log('Screen after Q3:', await getActiveBlock());

  // Let's check all visible counters on screen
  const allCounters = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
      .map(el => ({ text: el.innerText.trim(), top: Math.round(el.getBoundingClientRect().top) }));
  });
  console.log('All counters in DOM after Q3:', allCounters);

  await browser.close();
})();
