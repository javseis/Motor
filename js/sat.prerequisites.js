/** @module SAT.Prerequisites */
/**
* Modulo verifica los prerequisitos necesarios para correr la app
*
* (c) SAT 2013, Iván González
*/
/*global namespace:false, FormsBuilder:false, SAT: false, AppDeclaracionesSAT:false, ko:false, Base64:false */

"use strict";

(function() {
	namespace("SAT.Prerequisites", verify);

	var minimumBrowserSupports = { /*FireFox: 25,*/ Chrome: 25, IE: 9, Safari: 6 };
	var versionSilverlightRequired = "5.0.61118.0";
	var urlDownloadSilverligth = "";
	var userAgent = navigator.userAgent.toLowerCase();

	function verify() {
		init();

		showModalIfInvalidBrowsers();
		if (isValidBrowser()) {
			hasSilverlight();
		}
	}

	function init () {
		$.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());
		// $.browser.firefox = /firefox/.test(navigator.userAgent.toLowerCase());

		if ($.browser.chrome) {
			userAgent = userAgent.substring(userAgent.indexOf('chrome/') + 7);
			userAgent = userAgent.substring(0, userAgent.indexOf('.'));
			$.browser.version = userAgent;
			$.browser.safari = false;
		}

		if ($.browser.safari) {
			userAgent = userAgent.substring(userAgent.indexOf('version/') + 8);
			userAgent = userAgent.substring(0, userAgent.indexOf('.'));
			$.browser.version = userAgent;
		}
	}

	function showModalIfInvalidBrowsers() {
		if (!isValidBrowser()) {
			$("#modalSupportBrowsers").modal("show");
		}
	}

	function isValidBrowser() {
		var isValid = false;

		if ($.browser.chrome) {
			isValid = parseInt($.browser.version) >= minimumBrowserSupports.Chrome;
		}
		// else if ($.browser.firefox) {
		//     isValid = parseInt($.browser.version) >= minimumBrowserSupports.FireFox;
		// }
		else if ($.browser.safari) {
			isValid = parseInt($.browser.version) >= minimumBrowserSupports.Safari;
		}
		else if ($.browser.msie || $.browser.mozilla) {
			isValid = parseInt($.browser.version) >= minimumBrowserSupports.IE;
		}
		return isValid;
	}

	function hasSilverlight() {
		if (!Silverlight.isInstalled(versionSilverlightRequired))
			$("#modalSupportSilverlight").modal("show");
	}
}) ();
