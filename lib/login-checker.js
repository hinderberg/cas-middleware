var querystring = require('querystring');
var urlParser = require('url').parse;
var request = require('superagent');
var parseString = require('xml2js').parseString;

function validateTicket(ticket) {
  return /^ST-.{29,256}$/.test(ticket);
}

function getTicketIfPresentInUrl(url) {
  if (!url) {
    return false;
  }

  var parsedUrl = urlParser(url, true);

  if (parsedUrl.query &&
    parsedUrl.query.ticket
    ) {
    return parsedUrl.query.ticket;
  }

  return false;
}

function setTicket(req, res, next, ticket, options) {
  var validationUrl = options.serviceValidate +
    querystring.stringify({
      service: options.service,
      ticket: ticket});

  request.get(validationUrl, function (response) {
    if (!response.ok) {
      return res.redirect(301, options.loginUrl);
    }
    parseString(response.text, function (err, result) {
      if (err) {
        return res.redirect(301, options.loginUrl);
      }

      var serviceResponse = result['cas:serviceResponse'];

      if (serviceResponse) {
        var authenticationSuccess = serviceResponse['cas:authenticationSuccess'];

        if (authenticationSuccess) {
          var username = '';
          if (authenticationSuccess.length === 1) {
            var firstUserElement = authenticationSuccess[0];
            var firstUser = firstUserElement['cas:user'];
            username = firstUser[0];
          }

          req.session.cas = {
            st: ticket,
            user: username
          };

          if (options.loggedInEventHandler && typeof options.loggedInEventHandler === 'function') {
            options.loggedInEventHandler(req.session);
          }

          return next();

        } else {
          return res.redirect(301, options.loginUrl);
        }
      }

    });
  });
}

function shouldIgnoreRequest(req, options) {
  for(var i=0; i<options.ignoredRoutes.length; i++) {
    if(options.ignoredRoutes[i].matches(req.url)) {
      return true;
    }
  }
  return false;
}

module.exports = function (options) {

  return function (req, res, next) {
    if(shouldIgnoreRequest(req, options)) {
      return next();
    }

    var ticket = getTicketIfPresentInUrl(req.url);

    if (ticket) {
      if (!validateTicket(ticket)) {
        return res.redirect(307, options.loginUrl);
      }

      if (!req.session || !req.session.cas || !req.session.cas.st) {
        return setTicket(req, res, next, ticket, options);

      } else {
        return next();
      }
    } else if (req.session && req.session.cas && req.session.cas.st) {
      next();
    } else {
      return res.redirect(301, options.loginUrl);
    }
  }
};