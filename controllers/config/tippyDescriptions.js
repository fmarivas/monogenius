// tippyDescriptions.js
const pageDetails = require('./sidebarConfig'); // Importe o módulo pageDetails

const generateTippyDescriptions = () => {
  const descriptions = {};

  for (const category in pageDetails) {
    for (const key in pageDetails[category]) {
      if (pageDetails[category][key].description) {
        descriptions[key] = pageDetails[category][key].description;
      } else {
        // Gere uma descrição padrão se não existir uma
        descriptions[key] = `Acesse a página ${pageDetails[category][key].name}`;
      }
    }
  }

  return descriptions;
};

module.exports = generateTippyDescriptions;