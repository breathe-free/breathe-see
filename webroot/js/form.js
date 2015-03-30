'use strict'

// Declare app with dependencies
var breatheSeeApp = angular.module('breatheSeeApp', ['faye']);

// Create Faye client for UI
breatheSeeApp.factory('Faye', [
  '$faye', function($faye) {
    return $faye("/faye");
  }
]);

breatheSeeApp.controller('MainCtrl', function ($scope, $http, Faye) {

    // Subscribe for state changes
    Faye.subscribe("/state", function(data) {
        $scope.state = data.state;
        $scope.commsActive = true;
        if (data.message) {
            $scope.addMessage(data);
        }
        if (data.settings) {
            $scope.settings = data.settings;
        }

        if (($scope.state != 'disconnected') && (angular.equals({}, $scope.settings))) {
            $scope.sendCmd('request_settings_current');
        }
    });

    // Function for sending commands to the back end
    $scope.sendCmd = function(cmd, settings) {
        var p =  {command:cmd, commandType:"command"};
        if (settings) {
            p['settings'] = settings;
        }
        Faye.publish("/commands", p);
        $scope.state = "";  // wait for the back end to tell us about state changes, don't assume anything.
    }

    // What to do when new message received
    $scope.addMessage = function(data) {
        $scope.messages.push(data);
        if ($scope.messages.length > $scope.maxMessages) {
            // discard oldest messages
            $scope.messages = $scope.messages.slice(-$scope.maxMessages);
        }
    }

    // Handle form buttons for settings
    $scope.saveSettings = function(form) {
        $scope.sendCmd('save_settings', $scope.settings);
    }
    $scope.loadSettings = function(whichSettings) {
        $scope.sendCmd("apply_settings_" + whichSettings);
    }

    // Initialise
    $scope.state = "";
    $scope.messages = [];
    $scope.sendCmd("request_settings_current");
    $scope.maxMessages = 50;
    $scope.settings = {};
    $scope.commsActive = false;

    // Is the state known?
    $scope.stateIsKnown = function() {
        return $scope.state.length > 0;
    }

    // Is the state 'bad' - in the sense that it makes no sense to try to do anything?
    $scope.badState = function() {
        return (
         ($scope.state == "initialising")
         || ($scope.state == "disconnected")
         || !$scope.stateIsKnown()
         );
    }

    // What should we show on the state changer button?
    $scope.getStateButtonLabel = function() {
        if (
            ($scope.state == "disconnected")
            || (($scope.state == "") && (!$scope.commsActive))
        ) return "Disconnected";
        if ($scope.state == "") return "Busy...";
        if ($scope.badState()) return "Wait...";
        if ($scope.state == "waiting") return "Start";
        return "Stop";
    }

    // Advance state.  If waiting, start.  Otherwise, stop.
    $scope.advanceState = function() {
        var cmd = ($scope.state == "waiting") ? "start":"stop";
        if (cmd == "start") {
            // send settings chosen by user
            $scope.sendCmd(cmd, $scope.settings);
        } else {
            $scope.sendCmd(cmd);
        }
    }

});
