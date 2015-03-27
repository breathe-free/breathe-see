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
    Faye.subscribe("/state", function(msg) {
        $scope.state = msg.state;
    });

    // Function for sending commands to the back end
    $scope.sendCmd = function(cmd) {
        Faye.publish("/commands", {command:cmd, commandType:"command"});
    }

    // Initialise
    $scope.state = "";
    $scope.sendCmd("request_state");

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
        if ($scope.state == "") return "Busy...";
        if ($scope.badState()) return "Wait...";
        if ($scope.state == "waiting") return "Start";
        return "Stop";
    }

    // Advance state.  If waiting, start.  Otherwise, stop.
    $scope.advanceState = function() {
        var cmd = ($scope.state == "waiting") ? "start":"stop";
        $scope.sendCmd(cmd);
        $scope.state = "";  // wait for the back end to tell us about state change, don't assume anything.
    }

});