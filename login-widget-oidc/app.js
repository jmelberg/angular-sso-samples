/* 	Author: Jordan Melberg */
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

var app = angular.module("app", ["ngRoute", "OktaAuthClient"]);

app.config(function ($routeProvider) {
	$routeProvider
	.when("/", {
		templateUrl: "views/home.html",
		controller: "HomeController"
	})
	.when("/login", {
		templateUrl: "views/login.html",
		controller: "LoginController"
	})
	.otherwise({redirectTo: "/"});
});

/**
 * 	Okta Sign In Widget configuration
 *	
 *	Assign "oktaClient" and "oktaAuth" as two global constants shared
 *	between controllers.
 *	
 *	Run the "widgetClient" config with defined args
 */
app.value("oktaSignIn", undefined);
app.value("oktaAuth", undefined);
app.run(function(widgetClient){
	oktaSignIn = widgetClient.create({
		baseUrl: "https://example.oktapreview.com",
	    clientId: "79arVRKBcBEYMuMOXrYF",
	  	redirectUri: "http://localhost:8080/",
	  	scheme: "OAUTH2",
	  	authParams: {
	    	responseType: "id_token",
	    	responseMode: "okta_post_message",
	    	scope : [
	      		"openid",
	      		"email",
	      		"profile",
	      		"address",
	      		"phone"
	    	]
	  	}
  	});
  	oktaAuth = widgetClient;
});

/**
 *	Renders Okta Sign In Widget with OAuth Options
 *
 *	Stores response object and current session into localStorage
 */
app.controller("LoginController", 
	function($scope, $location, $window, $timeout) {
		/* Check for existing session */
		oktaAuth.existingSession()
		.then(function(exists){
			// Session exists
			$location.path("/login-widget-oidc/#");
		}, function(show){
			// Try catch for known widget issue -> reloads page (e.g. 'Backbone' error)
			try {
				oktaAuth.launchWidget()
				.then(function(res){
					if("auth" in res){
						$window.localStorage["auth"] = angular.toJson(res.auth);
			        	$window.localStorage["session"] = res.session;
			        	$timeout(function(){
			            	$location.path("/login-widget-oidc/#");
			        	}, 100);
					}
				}, function(err){ console.error(err);}
				);
			} catch (e){
				$window.location.reload();
			}
		});
		
});

/**
 *	Renders Home view
 *
 *	@var $scope.session 		: 	Live/Closed session (Bool)
 *	@var $scope.auth 			: 	User response (JSON)
 *	@var $scope.sessionObject 	: 	Session object (JSON)
 *
 */
app.controller("HomeController", function($scope, $window, $location,
	$timeout, $route, $anchorScroll, $http) {

	var session = $window.localStorage["session"];
	var auth = $window.localStorage["auth"];
	var sessionObject = $window.localStorage["sessionObject"];
	displayWidget = false;
	/* Update page scope */
	$scope.session = session;
	$scope.auth = !angular.isUndefined(auth) ? JSON.parse(auth) : undefined;
	$scope.sessionObject = !angular.isUndefined(sessionObject) ? JSON.parse(sessionObject) : undefined;

	/**
	 *	Refreshes the current session if active
	 *	
	 *	Updates localStorage with return values and refreshes the page to show updates
	 */
	$scope.refreshSession = function() {
		oktaAuth.refreshSession()
		.then(function(res){
			$window.localStorage["sessionObject"] = angular.toJson(res);
			refresh(100);
			$location.hash("sessionAnchor");
  			$anchorScroll();
		}, function(err){
			$window.localStorage["session"] = err;
			$location.path("#/login");
		});
	}

	/**
	 *	Closes the current live session
	 */
	$scope.closeSession = function() {
		oktaAuth.closeSession()
		.then(function(res){
			$window.localStorage["session"] = false;
			refresh(100);
			$location.hash("userResponseAnchor");
	  		$anchorScroll();
	  	});
	}

	/**
	 *	Renews the current Id token
	 */
	$scope.renewIdToken = function() {
		oktaAuth.renewIdToken($scope.auth.idToken)
		.then(function(res){
			$window.localStorage["auth"] = angular.toJson(res);
			refresh(100);
			$location.hash("responseAnchor");
			$anchorScroll();
		})
	}

	/**
	 *	Refreshes the current page given time duration until refresh
	 */
	function refresh(duration){
		setTimeout(function() {	$route.reload(); }, duration);
	}

	/**
	 *	Clears the localStorage saved in the web browser and scope variables
	 */
	function clearStorage(){
		$window.localStorage.clear();
		$scope = $scope.$new(true);
	}

	/**
	 *	Signout method called via button selection
	 */
	$scope.signout = function() {
		oktaAuth.signout()
		.then(function(res){
			console.log(res);
			clearStorage();
			$location.path("/login");
		}, function(err){
			console.log(err);
		});
	};
});




