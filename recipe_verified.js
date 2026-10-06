module.exports = async function fillForm(page, row) {
  // Welcome Screen
  await page.getByRole('button', { name: /start|press enter/i }).first().click({ force: true });
  await page.waitForTimeout(800);

  // Step: "Consent"
  try { const choice = page.locator('button:has-text("' + String(row["Consent"]).trim() + '"), label:has-text("' + String(row["Consent"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Confirmation / Qualifier"
  try { const choice = page.locator('button:has-text("' + String(row["Confirmation / Qualifier"]).trim() + '"), label:has-text("' + String(row["Confirmation / Qualifier"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Age Bracket"
  try { const choice = page.locator('button:has-text("' + String(row["Age Bracket"]).trim() + '"), label:has-text("' + String(row["Age Bracket"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Gender"
  try { const choice = page.locator('button:has-text("' + String(row["Gender"]).trim() + '"), label:has-text("' + String(row["Gender"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Country of Origin / Residence"
  try {
    const trigger = page.locator('[role="combobox"], [data-qa*="dropdown"], input[placeholder*="Type or select"]').first();
    if (await trigger.isVisible({ timeout: 600 })) { await trigger.click({ force: true }); await page.waitForTimeout(200); }
    await page.keyboard.type("Nepal", { delay: 50 });
    await page.waitForTimeout(250);
    const opt = page.locator('[role="option"]:has-text("Nepal"), button:has-text("Nepal")').first();
    if (await opt.isVisible({ timeout: 600 })) await opt.click({ force: true }); else await page.keyboard.press('Enter');
  } catch(e) { await page.keyboard.press('Enter'); }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Current Location / Country"
  try {
    const trigger = page.locator('[role="combobox"], [data-qa*="dropdown"], input[placeholder*="Type or select"]').first();
    if (await trigger.isVisible({ timeout: 600 })) { await trigger.click({ force: true }); await page.waitForTimeout(200); }
    await page.keyboard.type("Nepal", { delay: 50 });
    await page.waitForTimeout(250);
    const opt = page.locator('[role="option"]:has-text("Nepal"), button:has-text("Nepal")').first();
    if (await opt.isVisible({ timeout: 600 })) await opt.click({ force: true }); else await page.keyboard.press('Enter');
  } catch(e) { await page.keyboard.press('Enter'); }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Employment / Student Status"
  try { const choice = page.locator('button:has-text("' + String(row["Employment / Student Status"]).trim() + '"), label:has-text("' + String(row["Employment / Student Status"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Education Level"
  try { const choice = page.locator('button:has-text("' + String(row["Education Level"]).trim() + '"), label:has-text("' + String(row["Education Level"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Field of Study"
  try { const choice = page.locator('button:has-text("' + String(row["Field of Study"]).trim() + '"), label:has-text("' + String(row["Field of Study"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Job Search Status"
  try { const choice = page.locator('button:has-text("' + String(row["Job Search Status"]).trim() + '"), label:has-text("' + String(row["Job Search Status"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Location / Setting"
  try { const choice = page.locator('button:has-text("' + String(row["Location / Setting"]).trim() + '"), label:has-text("' + String(row["Location / Setting"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Relocation / Next Plan"
  try { const choice = page.locator('button:has-text("' + String(row["Relocation / Next Plan"]).trim() + '"), label:has-text("' + String(row["Relocation / Next Plan"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Section Break
  try { const btn = page.locator('button:has-text("Continue"), button:has-text("OK")').first(); if (await btn.isVisible({ timeout: 400 })) await btn.click({ force: true }); else await page.keyboard.press('Enter'); } catch(e){ await page.keyboard.press('Enter'); }
  await page.waitForTimeout(500);

  // Step: "How prepared do you feel for..."
  try { const btn = page.locator('button:has-text("4")').first(); if (await btn.isVisible({ timeout: 300 })) await btn.click({ force: true }); else await page.keyboard.press("4"); } catch(e){ await page.keyboard.press("4"); }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "To what extent does your..."
  try { const btn = page.locator('button:has-text("3")').first(); if (await btn.isVisible({ timeout: 300 })) await btn.click({ force: true }); else await page.keyboard.press("3"); } catch(e){ await page.keyboard.press("3"); }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Question c. of 22 (Rank / Priority)"
  for (const part of String(row["Question c. of 22 (Rank / Priority)"]).split(',')) {
    const el = page.locator('button:has-text("' + part.trim() + '"), label:has-text("' + part.trim() + '")').first();
    if (await el.isVisible({ timeout: 300 })) { await el.click({ force: true }); await page.waitForTimeout(150); }
  }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Question d. of 22 (\"Which human...\")"
  for (const part of String(row["Question d. of 22 (\"Which human...\")"]).split(',')) {
    const el = page.locator('button:has-text("' + part.trim() + '"), label:has-text("' + part.trim() + '")').first();
    if (await el.isVisible({ timeout: 300 })) { await el.click({ force: true }); await page.waitForTimeout(150); }
  }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Frequency / AI or Tool usage"
  try { const choice = page.locator('button:has-text("' + String(row["Frequency / AI or Tool usage"]).trim() + '"), label:has-text("' + String(row["Frequency / AI or Tool usage"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "How concerned are you about..."
  try { const btn = page.locator('button:has-text("5")').first(); if (await btn.isVisible({ timeout: 300 })) await btn.click({ force: true }); else await page.keyboard.press("5"); } catch(e){ await page.keyboard.press("5"); }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "How strongly do you agree: Traditional employment"
  try { const btn = page.locator('button:has-text("3")').first(); if (await btn.isVisible({ timeout: 300 })) await btn.click({ force: true }); else await page.keyboard.press("3"); } catch(e){ await page.keyboard.press("3"); }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Qualifier question"
  try { const choice = page.locator('button:has-text("' + String(row["Qualifier question"]).trim() + '"), label:has-text("' + String(row["Qualifier question"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Key Challenge / Goal"
  try {
    const input = page.locator('input:visible, textarea:visible').first();
    if (await input.isVisible({ timeout: 500 })) { await input.fill(String(row["Key Challenge / Goal"])); await page.keyboard.press('Enter'); }
    else { const choice = page.locator('button:has-text("' + String(row["Key Challenge / Goal"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 400 })) await choice.click({ force: true }); }
  } catch(e) { await page.keyboard.press('Enter'); }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Skill / Training interest"
  try { const choice = page.locator('button:has-text("' + String(row["Skill / Training interest"]).trim() + '"), label:has-text("' + String(row["Skill / Training interest"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 500 })) await choice.click({ force: true }); } catch(e){}
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Question k. of 56 (\"What is the...\")"
  for (const part of String(row["Question k. of 56 (\"What is the...\")"]).split(',')) {
    const el = page.locator('button:has-text("' + part.trim() + '"), label:has-text("' + part.trim() + '")').first();
    if (await el.isVisible({ timeout: 300 })) { await el.click({ force: true }); await page.waitForTimeout(150); }
  }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Scale / Score"
  try { const btn = page.locator('button:has-text("3")').first(); if (await btn.isVisible({ timeout: 300 })) await btn.click({ force: true }); else await page.keyboard.press("3"); } catch(e){ await page.keyboard.press("3"); }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Step: "Question m. of 56 (\"To secure...\")"
  try {
    const input = page.locator('input:visible, textarea:visible').first();
    if (await input.isVisible({ timeout: 500 })) { await input.fill(String(row["Question m. of 56 (\"To secure...\")"])); await page.keyboard.press('Enter'); }
    else { const choice = page.locator('button:has-text("' + String(row["Question m. of 56 (\"To secure...\")"]).trim() + '")').first(); if (await choice.isVisible({ timeout: 400 })) await choice.click({ force: true }); }
  } catch(e) { await page.keyboard.press('Enter'); }
  try { const ok = page.locator('button:has-text("OK"), button:has-text("Continue")').first(); if (await ok.isVisible({ timeout: 200 })) await ok.click({ force: true }); } catch(e){}
  await page.waitForTimeout(300);

  // Section Break
  try { const btn = page.locator('button:has-text("Continue"), button:has-text("OK")').first(); if (await btn.isVisible({ timeout: 400 })) await btn.click({ force: true }); else await page.keyboard.press('Enter'); } catch(e){ await page.keyboard.press('Enter'); }
  await page.waitForTimeout(500);

