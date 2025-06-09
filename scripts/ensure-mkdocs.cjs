const { execSync } = require('child_process');

function checkIfPythonInstalled() {
  try {
    execSync('python --version');
    return true;
  } catch (error) {
    return false;
  }
}

function checkIfMkdocsInstalled() {
  try {
    execSync('mkdocs --version');
    return true;
  } catch (error) {
    return false;
  }
}

function installMkdocs() {
  execSync('pip install mkdocs');
}

function installMkdocsMaterial() {
  execSync('pip install mkdocs-material');
}

function installMkdocsPlantuml() {
  execSync('pip install mkdocs_puml');
}

if (require.main === module) {
  if (!checkIfPythonInstalled()) {
    console.error('Python is not installed');
    console.error(
      'Please install Python and try again. I recommend using pyenv, but its not necessary.'
    );
    process.exit(1);
  }
  if (!checkIfMkdocsInstalled()) {
    installMkdocs();
    installMkdocsMaterial();
    installMkdocsPlantuml();
  }
}

module.exports = {
  checkIfPythonInstalled,
  checkIfMkdocsInstalled,
  installMkdocs,
};
