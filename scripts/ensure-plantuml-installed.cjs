// @ts-check

const { join } = require('path');
const { existsSync } = require('fs');
const { writeFileSync } = require('fs');
const { workspaceRoot } = require('@nx/devkit');

function checkIfPlantUmlIsInstalled() {
  const exists = existsSync(join(workspaceRoot, 'tmp', 'plantuml.jar'));
  return exists;
}

async function downloadPlantUml() {
  const url =
    'https://github.com/plantuml/plantuml/releases/download/v1.2025.3/plantuml-mit-1.2025.3.jar';
  const response = await fetch(url);
  const data = await response.arrayBuffer();
  writeFileSync(join(workspaceRoot, 'tmp', 'plantuml.jar'), Buffer.from(data));
}

if (require.main === module) {
  (async () => {
    if (!checkIfPlantUmlIsInstalled()) {
      await downloadPlantUml();
    }
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
