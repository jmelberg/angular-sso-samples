# AngularJS Okta Sign-In Widget 
Single-Page Web Application (SPA) sample using the [Okta Sign-In Widget](http://developer.okta.com/docs/api/resources/okta_signin_widget.html)

### Configure the Sample Application
Update the **baseUrl**, **clientId**, **redirectUri**, and **scopes** preceeding `login-widget-oidc` in your `login-widget-oidc/app.js` file:
```javascript
app.run(function(widgetClient){
  oktaSignIn = widgetClient.create({
    baseUrl: "https://example.oktapreview.com",
      // OAuth Options
      clientId: "CLIENT_ID",
      redirectUri: "http://localhost:8080",
      scheme: "OAUTH2",
      authParams: {
        responseType: "id_token",
        responseMode: "okta_post_message",
        scope : [
            "openid", "email", "profile", "address", "phone"
        ]
      }
    });
    oktaAuth = widgetClient;
});
```

### ID Token
Configured into the `oktaSignIn` object is the `responseType: 'id_token'`. Using [Implicit Flow](https://tools.ietf.org/html/rfc6749#section-1.3.2), an `idToken` is returned when authenticated

### Renew ID Token
Exchanges the current `id_token` for a new one

```javascript
$scope.renewIdToken = function() {
    oktaAuth.renewIdToken($scope.auth.idToken)
    .then(function(res){
      // do something
    })
  }
```

###Refresh Session
Updates the current session object using the [Sign-in Widget SDK](http://developer.okta.com/docs/api/resources/okta_signin_widget.html)

```javascript
$scope.refreshSession = function() {
    oktaAuth.refreshSession()
    .then(function(res){
      // do something
    }, function(err){
      // error
    });
  }
```

###Close Session
Terminates the current session object

```javascript
$scope.closeSession = function() {
    oktaAuth.closeSession()
    .then(function(res){
      // do something
      });
  }
```
