module.exports = async function fillForm(page, row) {
  // Welcome Screen
  await page.getByRole('button', { name: /start|press enter/i }).click();
  await page.waitForTimeout(1200);

  // Question: Consent
  await page.getByText('A', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Confirmation / Qualifier
  await page.getByText('Y', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Age Bracket
  await page.getByText('C', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Gender
  await page.getByText('A', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Country of Origin / Residence
  await page.getByText('Type or select an option', { exact: false }).first().click();
  await page.getByPlaceholder('Type or select an option').fill(String(row['Country of Origin / Residence']));
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: String(row['Country of Origin / Residence']) }).click();
  await page.waitForTimeout(1000);

  // Question: Current Location / Country
  await page.getByText('Type or select an option', { exact: false }).first().click();
  await page.getByPlaceholder('Type or select an option').fill(String(row['Current Location / Country']));
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: String(row['Current Location / Country']) }).click();
  await page.waitForTimeout(1000);

  // Question: Employment / Student Status
  await page.getByText('A', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Education Level
  await page.getByText('C', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Field of Study
  await page.getByText('B', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Job Search Status
  await page.getByText('C', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Location / Setting
  await page.getByText('A', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Relocation / Next Plan
  await page.getByText('C', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: "How prepared do you feel for..."
  await page.locator('[aria-label="Continue Next question"]').click();
  await page.getByText('5', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: "To what extent does your..."
  await page.getByText('4', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Question c. of 22 (Rank / Priority)
  await page.getByText('Self-taught learning (Online courses, videos, personal projects)', { exact: false }).first().click();
  await page.getByText('Hands-on experience (Previous jobs, internships, volunteering)', { exact: false }).first().click();
  await page.getByText('Formal education (Classroom, university, school)', { exact: false }).first().click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Question d. of 22 ("Which human...")
  await page.getByText('D', { exact: false }).first().click();
  await page.getByText('G', { exact: false }).first().click();
  await page.getByText('H', { exact: false }).first().click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Frequency / AI or Tool usage
  await page.getByText('A', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: "How concerned are you about..."
  await page.getByRole('button', { name: String(row['"How concerned are you about..."']) }).click();
  await page.waitForTimeout(1000);

  // Question: "How strongly do you agree: '..."
  await page.getByText('4', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Qualifier question
  await page.getByText('N', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Key Challenge / Goal
  await page.getByText('Type or select an option', { exact: false }).first().click();
  await page.getByText('Job security & income stability', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Skill / Training interest
  await page.getByText('C', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Question k. of 56 ("What is the...")
  await page.getByText('E', { exact: false }).first().click();
  await page.getByText('G', { exact: false }).first().click();
  await page.getByText('B', { exact: false }).first().click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Scale / Score
  await page.getByText('4', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Question m. of 56 ("To secure...")
  await page.getByPlaceholder('Type your answer here...').fill(String(row['Question m. of 56 ("To secure...")']));
  await page.keyboard.press('Enter');
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Question a. of 56 ("Rank the...")
  await page.locator('[aria-label="Continue Next question"]').click();
  await page.getByText('Social impact: Ability to create real change in the community regardless of hierarchy.', { exact: false }).first().click();
  await page.getByRole('button', { name: String(row['Question a. of 56 ("Rank the...")']) }).click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Frequency / Occurrence
  await page.getByText('B', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Barrier / Obstacle
  await page.getByText('Type or select an option', { exact: false }).first().click();
  await page.getByText('Psychological: Fear of failure, fear of rejection, or lack of confidence in my own abilities.', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Scale / Rating
  await page.getByRole('button', { name: String(row['Scale / Rating']) }).click();
  await page.waitForTimeout(1000);

  // Question: Skill / Competency
  await page.getByText('D', { exact: false }).first().click();
  await page.getByText('F', { exact: false }).first().click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: "How supported do you feel by..."
  await page.getByText('4', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: "How comfortable and ready do..."
  await page.getByText('5', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Question i. of 56 ("Rate your...")
  await page.getByText('4', { exact: false }).first().click();
  await page.getByRole('button', { name: String(row['Question i. of 56 ("Rate your...")']) }).click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Question j. of 56 ("Who has the...")
  await page.getByText('Track record of impact', { exact: false }).first().click();
  await page.getByText('Ability to listen', { exact: false }).first().click();
  await page.getByText('Social media presence', { exact: false }).first().click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Question k. of 56 ("If...")
  await page.getByPlaceholder('Type your answer here...').fill(String(row['Question k. of 56 ("If...")']));
  await page.keyboard.press('Enter');
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: "Overall, how would you rate..."
  await page.locator('[aria-label="Continue Next question"]').click();
  await page.getByRole('button', { name: String(row['"Overall, how would you rate..."']) }).click();
  await page.waitForTimeout(1000);

  // Question: "In the past year, to what..."
  await page.getByRole('button', { name: String(row['"In the past year, to what..."']) }).click();
  await page.waitForTimeout(1000);

  // Question: "How comfortable would you..."
  await page.getByText('4', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Question d. of 56 ("What are...")
  await page.getByText('C', { exact: false }).first().click();
  await page.getByText('H', { exact: false }).first().click();
  await page.getByText('E', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Question f. of 56 ("What...")
  await page.locator('[aria-label="OK Next question"]').click();
  await page.getByText('4', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Question g. of 56 ("When you...")
  await page.getByText('D', { exact: false }).first().click();
  await page.getByText('C', { exact: false }).first().click();
  await page.getByText('A', { exact: false }).first().click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: "How much does uncertainty..."
  await page.getByText('B', { exact: false }).first().click();
  await page.getByText('F', { exact: false }).first().click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Question 16 of 56 ("Rate how...")
  await page.getByText('5', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Outlook / Sentiment
  await page.getByText('5', { exact: false }).first().click();
  await page.getByText('Speeches', { exact: false }).first().click();
  await page.getByText('None apply', { exact: false }).first().click();
  await page.getByText('None apply', { exact: false }).first().click();
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Frequency
  await page.locator('[aria-label="Continue Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: "How knowledgeable do you..."
  await page.getByText('C', { exact: false }).first().click();
  await page.getByText('A', { exact: false }).first().click();
  await page.getByText('7', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: "How much do you feel your..."
  await page.getByText('3', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Sentiment / Belief
  await page.getByText('A', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Challenge / Barrier
  await page.getByText('A', { exact: false }).first().click();
  await page.getByText('C', { exact: false }).first().click();
  await page.getByText('g.', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Question h. of 56 ("Faced with...")
  await page.getByText('4', { exact: false }).first().click();
  await page.waitForTimeout(1000);

  // Question: Question 18 of 56 ("If you...")
  await page.getByPlaceholder('Type your answer here...').fill(String(row['Question 18 of 56 ("If you...")']));
  await page.keyboard.press('Enter');
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

  // Question: Question 19 of 56 ("In one or...")
  await page.getByPlaceholder('Type your answer here...').fill(String(row['Question 19 of 56 ("In one or...")']));
  await page.keyboard.press('Enter');
  await page.locator('[aria-label="OK Next question"]').click();
  await page.waitForTimeout(1000);

};
