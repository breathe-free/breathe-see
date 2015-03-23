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
  });
});
unixServer.listen(sockfile);
unixServer.maxConnections = 1;

function sendInstruction(instruction) {
  if (otherProcess.writable) {
    otherProcess.write(instruction);
  } else {
    //console.log('nodbody there');
  }
}

var buffer = '';
function handleSocketData(data) {
    var newData = data.toString();

    // Buffer input and split on \n
    // Call onDataRow once per row.
    buffer += newData;
    while (buffer.indexOf('\n') > 0) {
      // Extract first row from buffer and pass to onDataRow
      var row = buffer.split('\n')[0];
      onDataRow(row);

      // Remove first row from buffer, rinse and repeat
      buffer = buffer.substring(buffer.indexOf('\n') + 1);
    }
}

var bufferedRows = [];
function onDataRow(row) {
  bufferedRows.push(row);
  if (!bufferPublishing) {
    // publish right away
    publishAndClear();
  }
}

function publishAndClear() {
  if (bufferedRows.length > 0) {
    fayeClient.publish('/data', {data: bufferedRows});
    bufferedRows = [];    
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

// Listen for any instructions
fayeClient.subscribe('/instructions', function(data) {
  sendInstruction(data.instruction);
});