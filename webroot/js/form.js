'use strict'

// Declare app with dependencies
var breatheSeeApp = angular.module('breatheSeeApp', ['faye']);

// Create Faye client for UI
breatheSeeApp.factory('Faye', [
  '$faye', function($faye) {
    return $faye("/faye");
  }
]);

// Ensure trim() present for strings
if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

breatheSeeApp.controller('MainCtrl', function ($scope, $http, Faye) {

    // Subscribe for state changes
    Faye.subscribe("/state", function(data) {

        // Reset tube id when state becomes 'waiting'.
        if (($scope.state == '') && (data.state == 'waiting')) {
            $scope.settings.tube_id = null;
        }

        $scope.state = data.state;
        $scope.commsActive = true;
        if (data.message) {
            $scope.addMessage(data);
        }
        if (data.settings) {
            $scope.settings = data.settings;
        }
        if (data.version) {
            $scope.versionInfo.backend = data.version.trim();
        }
        if (data.results_dir) {
            $scope.resultsAvailable = true;
        }
        if (data.collection_completion) {
            $scope.collectionCompletion = data.collection_completion;
        }
        if (data.is_simulation) {
            // It seems we are talking to a development publisher.  Enable nudge button etc.
            $scope.clientIsSimulation = true;
            $scope.nudgeClient = function(e) {
                $scope.sendCmd('nudge');
            }
        }

        // Request current settings if we are connected and don't yet have any.
        if (($scope.state != 'disconnected') && (angular.equals({}, $scope.settings))) {
            $scope.sendCmd('request_settings_current');
        }
    });

    // Request version
    $http.get('/version').success(function(data) {
        $scope.versionInfo.ui = data.trim();
    }).error(function() {
        console.log('Couldn\'t get version.');
    });

    // Function for sending commands to the back end
    $scope.sendCmd = function(cmd, settings, timestamp) {
        var p =  {command:cmd, commandType:"command"};
        if (settings) {
            p['settings'] = settings;
        }
        if (timestamp) {
            p['timestamp'] = timestamp;
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
    $scope.resultsAvailable = false;
    $scope.collectionCompletion = {
        volume: 0,
        time:   0
    };
    $scope.clientIsSimulation = false;  // Only set to true for testing/development purposes
    $scope.versionInfo = {
        ui:      'unknown',
        backend: 'unknown'
    };

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
            // Refuse to progress unless Tube ID has been supplied
            if (!($scope.settings.tube_id)) {
                document.getElementById("tube_id").focus();
                alert('Tube ID is required.');
                return;
            }
            // send settings chosen by user
            $scope.sendCmd(cmd, $scope.settings, Math.floor(Date.now() / 1000));
        } else {
            $scope.sendCmd(cmd);
        }
    }

});
