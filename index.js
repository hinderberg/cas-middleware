var optionsProducer = require('./lib/options-producer');
var loginChecker = require('./lib/login-checker');
var logoutEventReceiver = require('./lib/logout-event-receiver');
var logout = require('./lib/logout');

module.exports = function(app, options) {
  options = optionsProducer(options);

  app.use(loginChecker(options));
  app.use(logoutEventReceiver(options));
  app.post('/logout', logout(options));
};