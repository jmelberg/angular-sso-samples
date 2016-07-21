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
app.value("widget", undefined);
app.run(function(widgetClient){
	oktaSignIn = widgetClient.create({
		baseUrl: "https://example.oktapreview.com",
	    // OAuth Options
	    clientId: "CLIENT_ID",
	  	redirectUri: "http://localhost:8080/",
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
  	widget = true;
});

/**
 *	Renders Okta Sign In Widget with OAuth Options
 *
 *	Stores response object and current session into localStorage
 */
app.controller("LoginController", 
	function($scope, $location, $window, $timeout) {
		/**
		 *	Refreshes the page to reload the Sign-In Widget
		 *	
		 *	Workaround for known widget issue
		 */
		if(widget == false){
			widget = true;
			$window.location.reload();
		}

		/* Check for existing session */
		oktaAuth.checkSession()
		.then(function(res){
			if("auth" in res){
				$window.localStorage["auth"] = angular.toJson(res.auth);
	        	$window.localStorage["session"] = res.session;
	        	widget = false;
	        	$timeout(function(){
	            	$location.path("/login-widget-oidc/#");
	        	}, 100);
			} else {
	            $location.path("/login-widget-oidc/#");
			}
		}, function(err){
			console.error(err);
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




