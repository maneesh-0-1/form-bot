const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(1000);

  async function getActiveBlock(page) {
    return await page.evaluateHandle(() => {
      // Find visible question counters
      const counters = Array.from(document.querySelectorAll('[data-qa="question-header-counter"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35) };
        })
        .filter(c => c.top >= 0 && c.top < window.innerHeight);

      if (counters.length > 0) {
        counters.sort((a, b) => a.dist - b.dist);
        const activeCounter = counters[0].el;
        // Return the closest block container
        return activeCounter.closest('[data-qa*="blocktype"], section, form, div[data-block-type]') || activeCounter.parentElement.parentElement;
      }

      // Statement / section break block
      const statements = Array.from(document.querySelectorAll('[data-qa*="statement"], [data-qa*="blocktype-statement"]'))
        .map(el => {
          const rect = el.getBoundingClientRect();
          return { el, top: rect.top, dist: Math.abs(rect.top - window.innerHeight * 0.35) };
        })
        .filter(c => c.top >= 0 && c.top < window.innerHeight);
      if (statements.length > 0) {
        statements.sort((a, b) => a.dist - b.dist);
        return statements[0].el;
      }

      return document.body;
    });
  }

  // Step 1
  let blockHandle = await getActiveBlock(page);
  let blockInfo = await blockHandle.evaluate(el => el.innerText);
  console.log('Step 1 active block text:\n', blockInfo);

  // Click Yes, I consent inside active block
  await page.evaluate(block => {
    const buttons = Array.from(block.querySelectorAll('button, [role="radio"], [role="button"], label'));
    const target = buttons.find(b => b.innerText.includes('Yes, I consent'));
    if (target) target.click();
  }, blockHandle);

  await page.waitForTimeout(800);

  // Step 2
  blockHandle = await getActiveBlock(page);
  blockInfo = await blockHandle.evaluate(el => el.innerText);
  console.log('\nStep 2 active block text:\n', blockInfo);

  // Click "Yes" inside active block
  const clickedStep2 = await page.evaluate(block => {
    const buttons = Array.from(block.querySelectorAll('button, [role="radio"], [role="button"], label'));
    // Match "Yes" as whole word or after badge
    const target = buttons.find(b => {
      const txt = b.innerText.trim();
      return txt === 'Yes' || /^[A-Z]\s+Yes$/i.test(txt) || txt.endsWith(' Yes') || txt.includes('Yes');
    });
    if (target) {
      target.click();
      return target.innerText;
    }
    return null;
  }, blockHandle);
  console.log('Clicked in step 2:', clickedStep2);

  await page.waitForTimeout(800);

  // Step 3
  blockHandle = await getActiveBlock(page);
  blockInfo = await blockHandle.evaluate(el => el.innerText);
  console.log('\nStep 3 active block text:\n', blockInfo);

  await browser.close();
})();
