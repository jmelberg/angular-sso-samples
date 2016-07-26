# AngularJS Custom Login Example
Single-Page Web Application (SPA) sample using a custom login interface

### Configure the Sample Application
Update the **baseUrl**, **id**, **redirect**, and **scopes** in your `custom-login/app.js` file:
```javascript
app.run(function(authClient){
	oktaClient = authClient.create({
		baseUrl: "https://example.oktapreview.com",
		id: "CLIENT_ID",
		redirect: "http://localhost:8080/"
	});
	oktaAuth = authClient;
	clientScopes = ['openid', 'email', 'profile', 'groups', 'gravatar'];
});
```

Update the **API_URL** with the endpoint `/protected` if you are using [custom claims/scopes](http://openid.net/specs/openid-connect-core-1_0.html#AdditionalClaims):
```javascript
var API_URL = 'http://localhost:9000/protected'
```
The **API_URL** connects the sample application to `server.js` to verify the access token.

**IMPORTANT:** The server looks for the claim value `user_email`, configured in a previous step.

###Get Tokens
Using the [Okta AuthSDK](http://developer.okta.com/docs/guides/okta_auth_sdk), a user is authenticated and returned an `idToken` and `accessToken`.

```javascript
$scope.getTokens = function(auth) {
	var options = {
		'token' : auth.transaction.sessionToken,
		'scopes' : clientScopes
	};
	oktaAuth.getTokens(options)
	.then(function(res){
		// do something
	}, function(err){
		// err
	});
  }
```
###Refresh Session
Updates the current session object

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
	}, function(err){
	  	console.log(err)
	});
  }
```

###Renew Id Token
If the current session is valid, returns a new ID Token

```javascript
$scope.renewIdToken = function() {
    oktaAuth.renewIdToken(clientScopes)
	.then(function(res){
		// do something
	}, function(err){
		// error
	});
  }
```

###Decode ID Token
Decodes raw ID Token

```javascript
$scope.decodeIdToken = function(token) {
	oktaAuth.decodeIdToken(token)
	.then(function(res){
	  	// do something
	}, function(err){
	  	console.error(err + " can not be decoded");
	});
  }

```

###Call External API
Returns JSON object with [Gavatar](https://en.gravatar.com/site/implement/) URL and name from [custom claim](http://openid.net/specs/openid-connect-core-1_0.html#AdditionalClaims).
```json
// Example response
{
	"image" : "www.gravatar.com/avatar/<image_hash>",
	"name" 	: "example@okta.com"
}
```


