/** Copyright © 2016, Okta, Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var url = require('url');
var restify = require('restify');
var passport = require('passport-restify');
var Strategy = require('passport-oauth2-jwt-bearer').Strategy;
var gravatar = require('gravatar');

var audience = 'ViczvMucBWT14qg3lAM1';
var issuer =   'https://example.oktapreview.com/as/ors71yywxk0GfFWmC0h7';

// var metadataUrl = 'http://rain.okta1.com:1802/.well-known/openid-configuration';
var metadataUrl = 'https://example.oktapreview.com/.well-known/openid-configuration';

// Database url
var url = 'mongodb://localhost:27017/'

var server = restify.createServer();
server.use(restify.bodyParser());
server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

server.use(passport.initialize());
var strategy = new Strategy({
  audience: audience,
  issuer: issuer,
  metadataUrl: metadataUrl,
  loggingLevel: 'debug'
}, function(token, done) {
  // done(err, user, info)
  return done(null, token);
});
passport.use(strategy);


// Add CORS Access
server.use(restify.CORS());
restify.CORS.ALLOW_HEADERS.push( "authorization"        );
restify.CORS.ALLOW_HEADERS.push( "withcredentials"      );
restify.CORS.ALLOW_HEADERS.push( "x-requested-with"     );
restify.CORS.ALLOW_HEADERS.push( "x-forwarded-for"      );
restify.CORS.ALLOW_HEADERS.push( "x-real-ip"            );
restify.CORS.ALLOW_HEADERS.push( "x-customheader"       );
restify.CORS.ALLOW_HEADERS.push( "user-agent"           );
restify.CORS.ALLOW_HEADERS.push( "keep-alive"           );
restify.CORS.ALLOW_HEADERS.push( "host"                 );
restify.CORS.ALLOW_HEADERS.push( "accept"               );
restify.CORS.ALLOW_HEADERS.push( "connection"           );
restify.CORS.ALLOW_HEADERS.push( "content-type"         );

server.get({path: '/protected'},
  passport.authenticate('oauth2-jwt-bearer', { session: false , scopes: ['gravatar']}),
  function respond(req, res, next) {
    console.log('Accessing protected resource as ' + req.user.user_email);

    if(scopes.indexOf('gravatar') > -1){
      // Send gavatar image
      res.send({'image' : "https:" + gravatar.url(req.user.user_email, {s: '200', r: 'pg', d: 'retro'}), 'name' : req.user.user_email});
    } else {
       res.send({'Error' : 'Scope "gravatar" not defined'});
    }
    return next();
  }
);


server.listen(9000, function() {
  console.log('listening: %s', server.url);
});