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
 

/**
 *	Custom Angular Wrapper for the Okta AuthSDK
 *
 *	To Use:
 * 		Inject "OktaAuthClient" into your modules,
 *		followed by "authClient" in your controllers, directives,
 *		etc. if using a custom login form
 *
 *		Inject "widgetClient" in your controllers, directives,
 *		etc if using the sign in widget
 */

angular
.module("OktaAuthClient", [])
.factory("authClient", function($q) {
	var auth;
	/**
	 *	Creates the Okta Authentication binding
	 */
	var create = function(options) {
		auth = new OktaAuth({
			url: options.baseUrl,
			clientId : options.id,
			redirectUri: options.redirect
		});
		return auth;
	};

	/**
	 *	Uses the Okta AuthSDK to establish a session given
	 *	"username" and "password"	
	 */
	var login = function(email, password) {
		var deferred = $q.defer();
		auth.signIn({
			username: email,
			password: password
		})
		.then(function(transaction) {
			switch(transaction.status) {
				case "SUCCESS":
					var auth = angular.toJson({
						"user": email,
						"transaction": transaction
					});
					deferred.resolve({
						"auth" : auth,
						"session" : true,
						"sessionToken" : transaction.sessionToken
					});
				default:
					deferred.reject({
						"Error" : "Cannot handle the " + transation.status + " status"
					});
			}
		})
		.fail(function(err) {
			deferred.reject({"Error" : err });
		});
		return deferred.promise;
	};

	/**
	 *	Given a sessionToken, returns "idToken", "accessToken",
	 *	and user "clams"
	 */
	var getTokens = function(options) {
		var deferred = $q.defer();
		if(auth.session.exists()){
			auth.idToken.authorize({
				sessionToken: options.token,
				scope : options.scopes
			}).then(function(res) {
				deferred.resolve({
					"idToken" : res.idToken,
					"accessToken" : res.accessToken,
					"claims" : res.claims
				});
			});
		}
		return deferred.promise;
	}

	/**
	 *	Refreshes the current session
	 */
	var refreshSession = function() {
		var deferred = $q.defer();
		auth.session.exists()
		.then(function(res) {
			if(res == true) {
				auth.session.refresh()
				.then(function(success){
					deferred.resolve(success);
				});
			}
		})
		.fail(function(err){deferred.reject(err);});
		return deferred.promise;
	}

	/**
	 * 	Closes the current session
	 */
	var closeSession = function() {
		var deferred = $q.defer();
		auth.session.close()
		.finally(function(){
			deferred.resolve("Closed Session");
		})
		.fail(function(err){deferred.reject(err);});
		return deferred.promise;
	}

	/**
	 *	Renews the current ID token
	 */
	var renewIdToken = function(options) {
		var scopes = {'scope' : options};
		var deferred = $q.defer();
		auth.idToken.refresh(scopes)
		.then(function(res) {
			deferred.resolve({
				"idToken" : res.idToken,
				"claims" : res.claims
			});
		})
		.fail(function(err){deferred.reject(err);});
		return deferred.promise;
	}

	/**
	 *	Given an "idToken" or "accessToken", it decodes the
	 *	header, payload, and signiture
	 */
	var decodeIdToken = function(token) {
		var deferred = $q.defer();
		var decoded = auth.idToken.decode(token);
		if (!angular.isUndefined(decoded)){
			deferred.resolve(decoded);
		} else {
			deferred.reject(token);
		}
		return deferred.promise;
	}

	/**
	 *	Logs the user out of the current session
	 */
	var signout = function() {
		var deferred = $q.defer();
		auth.session.exists()
		.then(function(exists){
			if(exists) {
				auth.signOut();
			}
			deferred.resolve("Signed out");
		})
		.fail(function(err){
			deferred.reject(err);
		});
		return deferred.promise;
	}

	/**
	 *	Return functions
	 */
	return {
		create : create, 
		login : login,
		getTokens : getTokens,
		refreshSession : refreshSession,
		closeSession : closeSession,
		renewIdToken : renewIdToken,
		decodeIdToken : decodeIdToken,
		signout : signout
	}
})

/********************************************************/
/********************************************************/

/********************************************************/
/********************************************************/

/**
 *	Wrapper for Sign-In Widget
 */	
.factory("widgetClient", function($q) {
	var auth;

	/**
	 *	Creates the Okta Authentication binding
	 */
	var create = function(options) {
		auth = new OktaSignIn({
			baseUrl : options.baseUrl,
			clientId : options.clientId,
			redirectUri : options.redirectUri,
			authScheme : options.authScheme,
			authParams : options.authParams
		});
		return auth;
	};

	/**
	 *	Checks for existing session if not present, it
	 *	uses the Okta Widget AuthSDK to load the
	 *	Okta Sign-In Widget	
	 */
	var existingSession = function() {
		var deferred = $q.defer();
		auth.session.exists(function(exists){
			if(exists) {
				// Active session
				deferred.resolve(true);
			} else {
				// No active session found
				deferred.reject();
			}
		});
		return deferred.promise;
	} 
		
	/**
	 *	Launches the sign in widget
	 */
	 var launchWidget = function() {
	 	var deferred = $q.defer();
	 	auth.renderEl(
	        { el: "#okta-login-container" },
	        function(res){
	           	 if (res.status === "SUCCESS") {
	           	 	deferred.resolve({
	           	 		"auth" : res,
	           	 		"session" : true
	           	 	});
	            } else {
	            	deferred.reject(res);
	            }
	        }
		);
		return deferred.promise;
	 }


	/**
	 *	Refreshes the current session
	 */
	var refreshSession = function() {
		var deferred = $q.defer();
		auth.session.refresh(function(res) {
			if(res.status === "INACTIVE"){
				deferred.reject(false);
			} else {
				deferred.resolve(res);
			}
		})
		return deferred.promise;
	}

	/**
	 * 	Closes the current session
	 */
	var closeSession = function() {
		var deferred = $q.defer();
		auth.session.close(function(){
			deferred.resolve("Closed Session");
		});
		return deferred.promise;
	}
	
	/**
	 *	Renews the current ID token
	 */
	var renewIdToken = function(token){
		var deferred = $q.defer();
		auth.idToken.refresh(token, function(newToken){
			deferred.resolve(newToken);
		});
		return deferred.promise;
	}

	/**
	 *	Logs the user out of the current session
	 */
	var signout = function() {
		var deferred = $q.defer();
		auth.session.exists(function(exists){
			if(exists){
				auth.signOut();
				deferred.resolve("Signed out");
			} else {
				deferred.reject("Already Signed Out");
			}
		});
		return deferred.promise;
	}

	/**
	 *	Return functions
	 */
	return {
		create : create, 
		existingSession : existingSession,
		launchWidget : launchWidget,
		refreshSession : refreshSession,
		closeSession : closeSession,
		renewIdToken : renewIdToken,
		signout : signout
	}
});