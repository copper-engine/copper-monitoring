var merge = require('webpack-merge');
var prodEnv = require('./prod.env');

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  API_LOCATION: '"/static/dev/"',
  API_NAME: '"/api/api.json"',
});
