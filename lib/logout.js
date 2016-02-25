var request = require('superagent');

module.exports = function (options) {

  return function (req, res) {
    request
      .get(options.logoutUrl)
      .end(function (err, response) {

        if (err) {
          return res.redirect(301, options.service);
        }

        req.session.destroy(function () {
          return res.redirect(307, options.logoutUrl);
        });

      });
  }
};