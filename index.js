var optionsProducer = require('./lib/options-producer');
var loginChecker = require('./lib/login-checker');
var logoutEventReceiver = require('./lib/logout-event-receiver');


module.exports = function(app, options) {
  options = optionsProducer(options);

  app.use(loginChecker(options));
  app.use(logoutEventReceiver(options));
};