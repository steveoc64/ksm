'use strict';

//=============================================================================================================================
// KSMapper
//  
//  Main module definition for the Kriegspiel Map Editor Application

angular.module('KSMapper', [
  'ionic', 
  'config', 
  'KSMapper.controllers', 
  'KSMapper.services',
  'leaflet-directive', 
  'ngStorage',
  'ngOrderObjectBy'
])

.run([
  '$ionicPlatform',
  '$lookup',
  function(
    $ionicPlatform, 
    $lookup
  ){

    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
}])

.config([
  '$stateProvider',
  '$urlRouterProvider',
  '$ionicConfigProvider',
  function(
    $stateProvider, 
    $urlRouterProvider,
    $ionicConfigProvider
  ){

    // Always place tabs at the bottom - even on Android
    $ionicConfigProvider.tabs.position('bottom')

    $stateProvider
    
    .state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginController'
    })
    .state('map', {
      url: '/map/:slot',
      cache: false,
      templateUrl: 'templates/map.html',
      controller: 'MapController'
    }) 
    .state('main', {
      url: '/main',
      abstract: true,
      templateUrl: 'templates/main.html'
    })
    .state('main.games', {
      url: '/games',
      views: {
        'main-games': {
          templateUrl: 'templates/games.html',
          controller: 'mainController'
        }
      }
    })
    .state('main.scenarios', {
      url: '/scenarios',
      cache: false,
      views: {
        'main-scenarios': {
          templateUrl: 'templates/scenarios.html',
          controller: 'scenariosController'
        }
      }
    })
    .state('main.settings', {
      url: '/settings',
      views: {
        'main-settings': {
          templateUrl: 'templates/settings.html',
          controller: 'settingsController'
        }
      }
    })
    .state('main.manuals', {
      url: '/manuals',
      views: {
        'main-manuals': {
          templateUrl: 'templates/manuals.html',
          controller: 'manualsController'
        }
      }
    })
    .state('main.manuals.scale', {
      url: '/scale',
      views: {
        'manualContent': {
          templateUrl: 'manuals/scale.html'
        }
      }
    })
    .state('main.syslog', {
      url: '/syslog',
      views: {
        'main-syslog': {
          templateUrl: 'templates/syslog.html',
          controller: 'syslogController'
        }
      }
    })
    .state('main.logout', {
      url: '/logout',
      views: {
        'main-logout': {
          templateUrl: 'templates/logout.html',
          controller: 'logoutController'
        }
      }

    })

    // Default to the games menu
    $urlRouterProvider.otherwise('/main/games');

}]);
