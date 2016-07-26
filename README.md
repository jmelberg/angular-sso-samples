#Okta AngularJS Examples
The following examples will provide you with custom AngularJS wrappers around the [Okta AuthSDK](http://developer.okta.com/docs/guides/okta_auth_sdk).

##Sample Scenarios
Currently, these samples use the module `OktaAuthClient` defined in the file `okta-angular.js`. The `OktaAuthClient` is an AngularJS wrapper for the AuthSDK implementation. To use the provided `authClient` and `widgetClient` wrappers, inject them into your module.

###OpenID Connect with Custom Login Interface
Demonstrates the OpenID Connect Implicit Flow - receiving an `id_token` and `token`:
  - Sign in with Password: Authenticates user with [name/password](http://developer.okta.com/docs/api/resources/authn.html#primary-authentication-with-public-application) and exchanges a [sessionToken](http://developer.okta.com/docs/api/resources/authn.html#session-token) for an `id_token` and `accessToken` (JWT)
  - Renew Token: Uses the current session with Okta to obtain a new `id_token` (JWT)
  - Decode Token: Decodes the current `id_token` revealing the encoded contents
  - Request Protected Resource (API): Uses the `token` as an OAuth2 Bearer Access Token to request a protected resources from an API (you must first authenticate)
  - Signout: Signs the user out of existing session

###Single-Page Web App (SPA) using [Okta Sign-In Widget](http://developer.okta.com/docs/api/resources/okta_signin_widget.html)
Demonstrates the OpenID Connect Implicit Flow - receiving an `id_token`:
  - Sign in using the [Okta Sign-In Widget](http://developer.okta.com/docs/api/resources/okta_signin_widget.html) following the [OpenID Connect](http://developer.okta.com/docs/api/resources/oidc.html#request-parameters) authentication flow
  - Renew Token: Exchanges the current `id_token` for a new `id_token`
  - Signout: Signs the user out of existing session

## Running the Sample with your Okta Organization

###Pre-requisites
This sample application was tested with an Okta org. If you do not have an Okta org, you can easily [sign up for a free Developer Okta org](https://www.okta.com/developer/signup/).

1. Verify OpenID Connect is enabled for your Okta organization. `Admin -> Applications -> Add Application -> Create New App -> OpenID Connect`
  - If you do not see this option, email [developers@okta.com](mailto:developers@okta.com) to enable it.
2. In the **Create A New Application Integration** screen, click the **Platform** dropdown and select **Single Page App (SPA)**
3. Press **Create**. When the page appears, enter an **Application Name**. Press **Next**.
4. Add **http://localhost:8080** to the list of *Redirect URIs*
5. Click **Finish** to redirect back to the *General Settings* of your application.
6. Copy the **Client ID**, as it will be needed for the Okta AuthSDK client configuration.
7. Enable [CORS access](http://developer.okta.com/docs/api/getting_started/enabling_cors.html) to your Okta organization
8. Finally, select the **People** tab and **Assign to People** in your organization.

To test out the [custom claims/scopes](http://openid.net/specs/openid-connect-core-1_0.html#AdditionalClaims) ability with the returned `accessToken`, additionally configure the following:

1. In the **Authorization Server** screen, click the **OAuth 2.0 Access Token** *Edit* button
2. Add the custom scope `gravatar`.
3. Add the custom claim *name* `user_email` and *value* `appuser.email`
4. Add the **gravatar** scope to your `app.js` file:
```javascript
// custom-login/app.js
app.run(function(authClient){
  ...
  clientScopes = ['openid', 'email', 'profile', 'groups', 'gravatar'];
});

```

## Using the Sample Application
Once the project is cloned, install [node.js](https://nodejs.org/en/download/) on your machine. Using [npm](https://nodejs.org/en/download/) install [http-server](https://www.npmjs.com/package/http-server).

    npm install http-server -g
    

**Usage:** `http-server [path] [options]`

Start the web server with `http-server`
    http-server [path] [options]
    
`[path]`is the root directory (e.g. `http-server angular-sso-samples/`)

**[Navigate](http://localhost:8080/)** to `http://localhost:8080/` to sign in.

## Using the Sample Server
The server receives the OAuth2 Bearer Access Token to request a protected resources from an API after JWT token validation. To run the server, first download the dependencies by running:
	
	npm install

Once installed, run `node server.js` to start the server on default port `:9000`.
