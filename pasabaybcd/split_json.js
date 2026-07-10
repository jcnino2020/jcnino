const fs = require('fs');
const path = require('path');

const seedFile = path.join(__dirname, 'mongodb_seed.json');
try {
  const data = fs.readFileSync(seedFile, 'utf8');
  const json = JSON.parse(data);
  
  for (const [key, value] of Object.entries(json)) {
    if (Array.isArray(value)) {
      const outFile = path.join(__dirname, `${key}.json`);
      fs.writeFileSync(outFile, JSON.stringify(value, null, 2));
      console.log(`Created ${key}.json with ${value.length} records.`);
    }
  }
} catch (e) {
  console.error("Error:", e);
}
