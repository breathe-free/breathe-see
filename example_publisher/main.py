#!/usr/bin/env python
import socket
import sys
import os
import time
import random
import csv
import json

# csv file columns are timestamp, pressure, CO2, ...
EXAMPLE_DATA      = os.path.join(os.path.dirname(__file__), "1427199271-sample-breathing.csv")
SOCKET_PATH       = '/tmp/lucidity.socket'
TIME_WARP         = float(os.environ.get('TIME_WARP', 1.0))
MAX_LINES_AT_ONCE = int(os.environ.get('MAX_LINES_AT_ONCE', 1))

class SocketNotFound(Exception):
    pass

# Read in data from the example csv file
datapoints = []
with open(EXAMPLE_DATA, 'rb') as csvfile:
    datareader = csv.reader(csvfile)
    for row in datareader:
        datapoints.append([float(x) for x in row])

# Try and connect to socket.  If any error, print out error and output to stdout instead.
try:
    # Make sure the socket exists
    if not os.path.exists(SOCKET_PATH):
        raise SocketNotFound("No socket at %s" % SOCKET_PATH)

    # Create a UDS socket
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

    sock.setblocking(0)   # important - don't block on reads
    sock.connect(SOCKET_PATH)
    output = sock.sendall
    def receive(the_socket):
        # Return either None (if nothing received)
        # or the JSON-decoded contents of any incoming message
        try:
            return json.loads(the_socket.recv(1024))
        except ValueError:
            print >>sys.stderr, str(ValueError)
        except socket.error:
            return None

except (SocketNotFound, socket.error), msg:
    print >>sys.stderr, msg
    print >>sys.stderr, "Will output to STDOUT instead of socket, starting in 2 sec."
    time.sleep(2)

    def printout(s):
        print >>sys.stdout, s
    output = printout
    receive = lambda x: None

# Until user hits Ctrl+C, send sample data down the socket.
lines_buffered = 0
index = 0
output_text = ""
mode = "running"
while True:
    try:
        # read from sock
        received = receive(sock)
        if received is not None:
            print "Received: %s" % received
            if received['command'] == "stop_sampling":
                mode = "stopped"
            if received['command'] == "start_sampling":
                mode = "running"

        datapoint = datapoints[index]

        # Replace the first member of datapoint with the current timestamp
        datapoint[0] = time.time()

        output_text += ",".join([str(x) for x in datapoint]) + "\n"
        lines_buffered += 1

        # Deliberately lumpy output.  Output data if the 'buffer' is full, or on a random spin.
        if lines_buffered >= MAX_LINES_AT_ONCE or random.random() < 0.3:
            if mode == "running":
                output( output_text )

            output_text = ""
            lines_buffered = 0

        # increment index and loop back round
        index += 1
        if index >= len(datapoints):
            index = 0

        time.sleep(0.2 / TIME_WARP)
    except KeyboardInterrupt:
        break

sock.close()

print "Finished."