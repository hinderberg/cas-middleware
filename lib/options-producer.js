var querystring = require('querystring');

module.exports = function (options) {
  if (!options) {
    throw new Error('Missing options');
  }

  if (!options.host) {
    throw new Error('Missing host');
  }

  if (!options.service) {
    throw new Error('Missing service');
  }

  options.loginUrl = options.host + '/cas/login?' + querystring.stringify({service: options.service});
  options.serviceValidate = options.host + '/cas/serviceValidate?';

  return options;
};