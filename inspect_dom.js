const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://form.typeform.com/to/zx9C41uZ');
  await page.waitForTimeout(2000);
  const startBtn = page.getByRole('button', { name: /start|press enter/i }).first();
  if (await startBtn.isVisible()) await startBtn.click();
  await page.waitForTimeout(1000);

  const domInfo = await page.evaluate(() => {
    // Check all elements with text or roles or classes
    const all = Array.from(document.querySelectorAll('*'));
    const results = [];
    for (const el of all) {
      const qa = el.getAttribute('data-qa') || '';
      const role = el.getAttribute('role') || '';
      const ariaHidden = el.getAttribute('aria-hidden');
      const tag = el.tagName.toLowerCase();
      if (qa || ['h1','h2','h3','main','form','section'].includes(tag) || role) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.top <= window.innerHeight) {
          results.push({
            tag,
            qa,
            role,
            ariaHidden,
            rect: { top: Math.round(rect.top), height: Math.round(rect.height), left: Math.round(rect.left), width: Math.round(rect.width) },
            text: el.innerText ? el.innerText.trim().replace(/\s+/g, ' ').slice(0, 60) : ''
          });
        }
      }
    }
    return results;
  });

  console.log('Detected elements:');
  console.log(JSON.stringify(domInfo.slice(0, 25), null, 2));

  // Now click Yes, I consent
  const choice = page.locator('button:has-text("Yes, I consent"), label:has-text("Yes, I consent")').first();
  await choice.click({ force: true });
  await page.waitForTimeout(1000);

  const afterInfo = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, [role="heading"], [data-qa*="title"], [data-qa*="question"]'))
      .map(el => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          qa: el.getAttribute('data-qa'),
          rect: { top: Math.round(rect.top), height: Math.round(rect.height) },
          text: el.innerText ? el.innerText.trim().replace(/\s+/g, ' ') : ''
        };
      })
      .filter(h => h.rect.top >= 0 && h.rect.top < window.innerHeight && h.text);
    return headings;
  });

  console.log('\nHeadings visible after clicking consent:');
  console.log(JSON.stringify(afterInfo, null, 2));

  await browser.close();
})();
