const xlsx = require('xlsx');

// Read the vertical sheet
const wb = xlsx.readFile('Typeform Survey Responses Template.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

// Map rows into horizontal keys & values
const singleRow = {};
data.forEach(item => {
  const colName = item['Question Identifier / Prompt Clue'] || `Step_${item['Step / Item #']}`;
  singleRow[colName] = item['Selected Answer / Response Value'];
});

// Create new horizontal sheet
const newWb = xlsx.utils.book_new();
const newSheet = xlsx.utils.json_to_sheet([singleRow]); // Row 1 is dummy data
xlsx.utils.book_append_sheet(newWb, newSheet, 'Responses');
xlsx.writeFile(newWb, 'data_ready.xlsx');

console.log('Created data_ready.xlsx with columns formatted properly!');