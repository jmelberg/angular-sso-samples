var http = require('http');
var url = require('url');
var path = require('path');
var os = require('os');
var yargs = require('yargs');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-okta-oidc-bearer').Strategy;
var gravatar = require('gravatar');

var OktaConfig = {
  orgUrl: 'https://example.oktapreview.com',
  clientId: 'CLIENT_ID',
  };

/**
 * Globals
 */

var app = express();
var httpServer = http.createServer(app);

/**
 * Arguments
 */

console.log();
console.log('loading configuration...');
var argv = yargs
  .usage('\nSimple API Server with OAuth 2.0 Bearer Token Security\n\n' +
      'Usage:\n\t$0 -iss {url} -aud {uri}', {
    port: {
      description: 'Web Server Listener Port',
      required: true,
      alias: 'p',
      default: 9000
    },
    issuer: {
      description: 'OpenID Connect Provider Issuer URL',
      required: true,
      alias: 'iss',
      default: OktaConfig.orgUrl
    },
    audience: {
      description: 'ID Token Audience URI (ClientID)',
      required: true,
      alias: 'aud',
      default: OktaConfig.clientId
    }
  })
  .example('\t$0 --iss https://example.okta.com --aud ANRZhyDh8HBFN5abN6Rg', '')
  .argv;


console.log();
console.log('Listener Port:\n\t' + argv.port);
console.log('OIDC Issuer URL:\n\t' + argv.issuer);
console.log('Audience URI:\n\t' + argv.audience);
console.log();

/**
 * Middleware
 */

app.use(logger('dev'));
app.use('/', express.static(__dirname));
app.use(bodyParser.json());
app.use(passport.initialize());
passport.use(new Strategy({
  audience: argv.audience,
  metadataUrl: url.resolve(argv.issuer, '/.well-known/openid-configuration'),
  loggingLevel: 'debug'
}, function(token, done) {
  return done(null, token);
}));

// Add headers for xsite requests
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  next();
});

app.get('/profile',
  passport.authenticate('okta-oidc-bearer', { session: false }),
  function(req, res) {
    res.json(req.user);
  });

app.get('/protected',
  passport.authenticate('okta-oidc-bearer', { session: false }),
  function(req, res) {

    console.log('Accessing protected resource as ' + req.user.user_email);
    res.set('Content-Type', 'application/json');

    var scopes = req.user.scp;

    if(scopes.indexOf('gravatar') > -1){
      // Send gavatar image
      res.send({'image' : gravatar.url(req.user.user_email, {s: '200', r: 'x', d: 'retro'}), 'name' : req.user.user_email});

    } else{ res.send({'Error' : 'Scope "gravatar" not defined'}); }
});

/**
 * Start API Web Server
 */

console.log('starting server...');
app.set('port', argv.port);
httpServer.listen(app.get('port'), function() {
  var scheme   = argv.https ? 'https' : 'http',
      address  = httpServer.address(),
      hostname = os.hostname();
      baseUrl  = address.address === '0.0.0.0' ?
        scheme + '://' + hostname + ':' + address.port :
        scheme + '://localhost:' + address.port;

  console.log('listening on port: ' + app.get('port'));
  console.log();
});
