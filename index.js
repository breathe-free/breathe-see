"use strict"

var express      = require('express');
var app          = express();
var sockfile     = '/tmp/lucidity.socket';
var faye         = require('faye');
var bayeux       = new faye.NodeAdapter({mount: '/faye', timeout: 45});
var fayeClient   = bayeux.getClient();
var net          = require('net');
var fs           = require('fs');
var htmlroot     = 'webroot';
var port         = 9090;


// Inter-process comms with other process
console.log('Looking for socket %s', sockfile);

// Delete socket if it exists
if (fs.existsSync(sockfile)) {
	console.log('Deleting existing socket');
	fs.unlinkSync(sockfile);
}

// Set up - create the socket and listen for data.
var unixServer = net.createServer(function(client) {
	client.on('data', handleSocketData);
	// TODO - handle disconnect, errors, etc.
});
unixServer.listen(sockfile);

function handleSocketData(data) {
    var newData = data.toString();
    // TODO buffer until some separator character comes along.
    // Newline \n would be a good choice I think.
    // Otherwise, we are assuming that 
    fayeClient.publish('/data', { data: newData });
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