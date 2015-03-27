"use strict"

var express          = require('express');
var app              = express();
var sockfile         = '/tmp/lucidity.socket';
var faye             = require('faye');
var deflate          = require('permessage-deflate');
var bayeux           = new faye.NodeAdapter({mount: '/faye', timeout: 45});
bayeux.addWebsocketExtension(deflate);
var fayeClient       = bayeux.getClient();
fayeClient.addWebsocketExtension(deflate);
var net              = require('net');
var fs               = require('fs');
var htmlroot         = 'webroot';
var port             = 9090;
var bufferPublishing = false;  // set to True to only publish every so often
var publishInterval  = 250;    // ms.  Ignored unless bufferPublishing is true


// Inter-process comms with other process
console.log('Looking for socket %s', sockfile);

// Delete socket if it exists
if (fs.existsSync(sockfile)) {
	console.log('Deleting existing socket');
	fs.unlinkSync(sockfile);
}

// Set up - create the socket and accept max 1 connection
var otherProcess = false;
var unixServer = net.createServer(function(client) {
  // TODO - handle errors, etc.

  console.info('Client connected.');
  otherProcess = client;

  // handle any data the client sends to us
  client.on('data', handleSocketData);

  client.on('end', function() {
    console.info('Client disconnected.');
    otherProcess = false;
    fayeClient.publish('/state', {state: 'disconnected'});
  });
});
unixServer.listen(sockfile);
unixServer.maxConnections = 1;

function sendCommand(command) {
  if (otherProcess.writable) {
    otherProcess.write(JSON.stringify(command));
  } else {
    //console.log('nodbody there');
  }
}

var buffer = '';
function handleSocketData(data) {
    var newData = data.toString();

    // Buffer input and split on \n
    // Call onData once per line.
    buffer += newData;
    while (buffer.indexOf('\n') > 0) {
      // Extract first line from buffer and pass to onData
      var line = buffer.split('\n')[0];
      onData(line);

      // Remove first line from buffer, rinse and repeat
      buffer = buffer.substring(buffer.indexOf('\n') + 1);
    }
}

var bufferedlines = [];
function onData(line) {

  // Parse JSON and immediately transmit.
  if (line.indexOf("{") >= 0) {
    fayeClient.publish("/state", JSON.parse(line));
    return;
  }

  bufferedlines.push(line);
  if (!bufferPublishing) {
    // publish right away
    publishAndClear();
  }
}

function publishAndClear() {
  if (bufferedlines.length > 0) {
    fayeClient.publish('/data', {data: bufferedlines});
    bufferedlines = [];    
  }
}
if (bufferPublishing) {
  // run publishAndClear every so often.
  setInterval(publishAndClear, publishInterval);  
}

// Define Express app
app.use('/', express.static(htmlroot));

// Start up the server
var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('HTTP server on http://%s:%s', host, port);
});

// Use Faye on the Express app for passing messages to/from browsers
bayeux.attach(server);

// Listen for any commands, just pass them on
fayeClient.subscribe('/commands', function(command) {
  if ((command.command == 'request_state') && (!otherProcess.writable)) {
    fayeClient.publish('/state', {state: 'disconnected'});
    return;
  }
  sendCommand(command);
});