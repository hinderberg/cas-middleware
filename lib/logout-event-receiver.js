module.exports = function(options) {

  return function(req, res, next) {

    for (var param in req.body) {

      if (/<samlp:SessionIndex>(.*)<\/samlp:SessionIndex>/.exec(req.body[param])) {
        var st = RegExp.$1;

        options.logoutEventHandler(st);

        return res.redirect(301, options.loginUrl);
      }
    }

    return next();
  }

};