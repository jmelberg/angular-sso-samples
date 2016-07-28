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
 *	Assign "oktaClient" and "oktaAuth" as two global constants shared
 *	between controllers.
 *	
 *	Run the "authClient" config with defined args
 */
app.value("oktaClient", undefined);
app.value("oktaAuth", undefined);
app.value("clientScopes", undefined);

app.run(function(authClient){
	oktaClient = authClient.create({
		baseUrl: "https://example.oktapreview.com",
		id: "CLIENT_ID",
		redirect: "http://localhost:8080/"
	});
	oktaAuth = authClient;
	clientScopes = [
		'openid',
		'email',
		'profile',
		'groups'
		];
});

/**
 *	External API call
 */
var API_URL = "http://localhost:9000/protected"

/**
 *	Renders Home view
 *
 *	@var $scope.session 			: 	Live/Closed session (Bool)
 *	@var $scope.auth 				: 	User response (JSON)
 *	@var $scope.userInfo  			: 	Id Token and/or Access Token (JSON)	 
 *	@var $scope.decodedIdToken 		: 	Decoded header, claims, and signiture of ID token (JSON)
 *	@var $scope.sessionObject 		: 	Session object (JSON)
 *	@var $scope.img 				: 	Gravatar image URL
 *	@var $scope.imageName 			: 	Name of Gravatar user 
 *
 */
app.controller("HomeController",
	function($scope, $window, $location, $timeout, $route, $anchorScroll, $http, authClient) {
		var auth = $window.localStorage["auth"];
		var userInfo = $window.localStorage["userInfo"];
		var session = $window.localStorage["session"];
		var sessionObject = $window.localStorage["sessionObject"]
		var decodedIdToken = $window.localStorage["decodedIdToken"];
		var img = $window.localStorage["image"];
		var imageName = $window.localStorage["imageName"];
		
		// Update scope
		$scope.session = session;
		$scope.auth = !angular.isUndefined(auth) ? JSON.parse(auth) : undefined;
		$scope.userInfo = !angular.isUndefined(userInfo) ? JSON.parse(userInfo) : undefined;
		$scope.sessionObject = !angular.isUndefined(sessionObject) ? JSON.parse(sessionObject) : undefined;
		$scope.decodedIdToken = !angular.isUndefined(decodedIdToken) ? JSON.parse(decodedIdToken) : undefined;
		$scope.img = !angular.isUndefined(img) ? img : undefined;
		$scope.imgName = !angular.isUndefined(imageName) ? imageName : undefined;
		
		/**
		 *	Gets the Id and Access Token
		 */
		$scope.getTokens = function(auth) {
			var options = {
				'token' : auth.transaction.sessionToken,
				'responseType' : ['id_token', 'token'], // Requires list for multiple inputs
				'scopes' : clientScopes
			};
			oktaAuth.getTokens(options)
			.then(function(res){
				$window.localStorage["userInfo"] = angular.toJson(res);
				refresh(100);
				$location.hash("userInfoAnchor");
	  			$anchorScroll();
			}, function(err){
				console.error(err);
			});
		}

		/**
		 *	Calls external server to return Gavatar image url and name
		 */
		$scope.apiCall = function(token) {
			api_url = API_URL;
			$http({
				method : "GET",
				url : api_url,
				headers : {
					"Content-Type": undefined,
					Authorization : "Bearer " + token,
				} 
			}).then(function(res){
				if(res.data.Error){
					console.error(res.data.Error);
				} else {
					$window.localStorage["image"] = res.data.image;
					$window.localStorage["imageName"] = res.data.name;
					$scope.img = res.data.image;
					$scope.imgName = res.data.name;
					$location.hash("imgAnchor");
					$anchorScroll();
				}
			});
		}

		/**
		 *	Refreshes the current session 
		 */
		$scope.refreshSession = function() {
			oktaAuth.refreshSession()
			.then(function(res){
				$window.localStorage["sessionObject"] = angular.toJson(res);
				refresh(100);
				$location.hash("sessionAnchor");
	  			$anchorScroll();
			}, function(err){
				console.log(err);
			});
		}
		
		/**
		 *	Closes the current session
		 */
		$scope.closeSession = function() {
			oktaAuth.closeSession()
			.then(function(res){
				$window.localStorage["session"] = false;
				refresh(100);
				$location.hash("userResponseAnchor");
	  			$anchorScroll();
	  		}, function(err){
	  			console.log(err)
	  		});
		}

		/**
		 *	Refreshes Id token and updates $scope
		 */
		$scope.renewIdToken = function() {
			// The access token cannot be refreshed - cached access token saved
			oktaAuth.renewIdToken(clientScopes)
			.then(function(res){
				$window.localStorage["userInfo"] = angular.toJson({
					"idToken" : res.idToken,
					"accessToken" : JSON.parse($window.localStorage["userInfo"]).accessToken
				});
				refresh(100);
		      	$location.hash("userInfoAnchor");
	  		  	$anchorScroll();
			}, function(err){
				// handle error
			});
	  	}

	  	/**
	  	 *	Decodes the current Id token
	  	 */
	  	$scope.decodeIdToken = function(token) {
	  		oktaAuth.decodeIdToken(token)
	  		.then(function(res){
	  			$window.localStorage["decodedIdToken"] = angular.toJson(res);
	  			refresh(100);
	  			$location.hash("decodeAnchor");
	  			$anchorScroll();
	  		}, function(err){
	  			console.error(err + " can not be decoded");
	  		});
	  	}

	  	/**
		 *	Refreshes the current page given time duration until refresh
	  	 */
		function refresh(duration){
			setTimeout(function() {$route.reload();}, duration);
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
			$timeout(function() {
				oktaAuth.signout()
				.then(function(res){
					console.log(res);
					clearStorage();
					$location.url("/login");
				}, function(err){
					console.log(err);
				});
			}, 100);
		}
});

/**
 *	Authenticates the user with custom login UI using AuthSDK
 *
 * 	Stores the response object in localStorage and sets the current session to true
 */
app.controller("LoginController",
	function($scope, $window, $location, $timeout, $route, authClient){
		$scope.authenticate = function(user) {
			var res = authClient.login(user.email, user.password);
			res.then(function(res){
				// update storage
				$window.localStorage["auth"] = res.auth;
				$window.localStorage["session"] = res.session;
				oktaClient.session.setCookieAndRedirect(res.sessionToken,
							oktaClient.options.redirectUri+"custom-login/#");
			}, function(err) {
				$timeout(function () {
	        		$scope.$apply(function () {	$scope.error = err.Error; });
	    		}, 100);
			});
		}
});
