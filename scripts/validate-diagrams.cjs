// Run plantuml via java and validate the output
// @ts-check

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const diagramsDir = path.join(__dirname, '..', 'docs', 'diagrams');
const plantumlJar = path.join(__dirname, '..', 'tmp', 'plantuml.jar');

// Get all .puml files
const pumlFiles = fs
  .readdirSync(diagramsDir)
  .filter((file) => file.endsWith('.puml'));

console.log('Validating PlantUML diagrams...\n');

pumlFiles.forEach((file) => {
  const filePath = path.join(diagramsDir, file);
  console.log(`Validating ${filePath}`);

  // Just run PlantUML syntax check (will throw if invalid)
  execSync(`java -jar "${plantumlJar}" -syntax "${filePath}"`, {
    stdio: 'pipe',
  });
});

console.log('\nAll diagrams validated successfully!');
