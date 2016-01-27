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

  if (parsedUrl.query && parsedUrl.query.ticket) {
    return parsedUrl.query.ticket;
  }

  return false;
}

function setTicket(req, res, next, ticket, options, originUrl) {
  var validationUrl = options.serviceValidate + querystring.stringify({
    service: originUrl,
    ticket: ticket});

  request.get(validationUrl, function (response) {
    if (!response.ok) {
      return res.redirect(301, originUrl);
    }
    parseString(response.text, function (err, result) {
      if (err) {
        return res.redirect(301, originUrl);
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
        }

        return res.redirect(301, originUrl);
      }
    });
  });
}

function shouldIgnoreRequest(req, options) {
  return options.ignoredRoutes.some(function(element) {
    return element.matches(req.url);
  });
}

function stripTicketFromUrl(url) {
  return url.replace(/(ticket=[\w-\d]*[&])|([&]ticket=[\w\d-]*)|([?]ticket=[\w\d-]*)/, "");
}

function getCasLoginUrl(options, serviceUrl) {
  return options.host + '/cas/login?' + querystring.stringify({service: serviceUrl});
}

module.exports = function (options) {
  return function (req, res, next) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

    if(shouldIgnoreRequest(req, options)) {
      return next();
    }

    var ticket = getTicketIfPresentInUrl(req.url);
    var originUrl = options.service || stripTicketFromUrl(fullUrl);

    if (ticket) {
      if (!validateTicket(ticket)) {
        return res.redirect(307, originUrl);
      }

      if (!req.session || !req.session.cas || !req.session.cas.st) {
        return setTicket(req, res, next, ticket, options, originUrl);

      } else {
        return next();
      }
    } else if (req.session && req.session.cas && req.session.cas.st) {
      next();
    } else {
      return res.redirect(301, getCasLoginUrl(options, originUrl));
    }
  };
};
