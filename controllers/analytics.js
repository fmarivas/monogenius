const Analytics = require('analytics').default;
const googleTagManager = require('@analytics/google-tag-manager').default;

const analytics = Analytics({
  app: 'Monogenius',
  plugins: [
    googleTagManager({
      containerId: 'G-E8R0G83PMQ'  // Substitua 'GTM-XXXXXXX' pelo seu Container ID do Google Tag Manager
    })
  ]
});

module.exports = {analytics}