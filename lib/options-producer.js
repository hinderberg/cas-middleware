var querystring = require('querystring');
var RoutePattern = require('route-pattern');

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

  if (!options.logoutEventHandler || typeof options.logoutEventHandler !== 'function' ) {
    throw new Error('Missing logoutEventHandler');
  }

  options.loginUrl = options.host + '/cas/login?' + querystring.stringify({service: options.service});
  options.serviceValidate = options.host + '/cas/serviceValidate?';
  options.logoutUrl = options.host + '/cas/logout?' + querystring.stringify({service: options.service});
  options.ignoredRoutes = (options.ignoredRoutes || []).map(function(route) {
    return RoutePattern.fromString(route);
  });

  return options;
};