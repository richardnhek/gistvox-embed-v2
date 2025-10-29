// Test if the embed template has any issues
const { readFileSync } = require('fs');

const embedCode = readFileSync('api/embed/[id].js', 'utf8');

// Extract the HTML template literal
const templateMatch = embedCode.match(/const html = `([\s\S]*?)`;\s*$/m);
if (templateMatch) {
  const template = templateMatch[1];
  console.log('Template found, length:', template.length);
  
  // Check for unescaped backticks
  const unescapedBackticks = template.match(/[^\\]`/g);
  if (unescapedBackticks) {
    console.log('Found unescaped backticks:', unescapedBackticks.length);
  }
  
  // Check for problematic template literals
  const nestedTemplates = template.match(/\$\{[^}]*\}/g);
  if (nestedTemplates) {
    console.log('Found template substitutions:', nestedTemplates.length);
    nestedTemplates.slice(0, 10).forEach(t => console.log('  -', t));
  }
} else {
  console.log('Could not find template literal');
}
