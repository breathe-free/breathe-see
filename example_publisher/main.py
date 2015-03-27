#!/usr/bin/env python
import socket
import sys
import os
import time
import random
import csv
import json
import random

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

def enum(**enums):
    return type('Enum', (), enums)

STATES = enum(
    INITIALISING = "initialising",
    WAITING      = "waiting",
    CALIBRATING  = "calibrating",
    ANALYSING    = "analysing",
    COLLECTING   = "collecting",
)
ACTIVE_STATES = [ STATES.CALIBRATING, STATES.ANALYSING, STATES.COLLECTING ]

class Publisher:
    def __init__(self):
        self.lines_buffered = 0
        self.index = 0
        self.buffer = ""
        self.change_state(STATES.INITIALISING)

    def change_state(self, new_state):
        self.state = new_state
        self.emit_state()

    def emit_state(self):
        output(json.dumps({"state":self.state}) + "\n")        

    def run(self):
        # Wait a while to simulate initialisation
        self.change_state(STATES.INITIALISING)
        time.sleep(3.0 / TIME_WARP)
        self.change_state(STATES.WAITING)

        # Loop until user hits Ctrl+C
        while True:
            try:
                # read from sock
                received = receive(sock)
                if received is not None:
                    # act on information received
                    print "Received: %s" % received
                    if received['command'] == "stop":
                        self.change_state(STATES.WAITING)
                    if received['command'] == "start":
                        self.change_state(STATES.CALIBRATING)
                    if received['command'] == "request_state":
                        self.emit_state()

                # While running...
                if self.state in ACTIVE_STATES:
                    # ...cycle through active states to simulate instrument doing things
                    if random.random() < 0.03:
                        current = ACTIVE_STATES.index(self.state)
                        next = ( current + 1 ) % len(ACTIVE_STATES)
                        self.change_state(ACTIVE_STATES[next])

                # Get data (ultimately this comes from the sample file)
                datapoint = datapoints[self.index]

                # Replace the first member of datapoint with the current timestamp
                datapoint[0] = time.time()

                # Fourth column of data should be zero unless we are in collecting state
                if self.state != STATES.COLLECTING:
                    datapoint[3] = 0

                # Put comma-separated line of data into the buffer
                self.buffer += ",".join([str(x) for x in datapoint]) + "\n"
                self.lines_buffered += 1

                # Output data if the 'buffer' is full, or on a random spin.
                if self.lines_buffered >= MAX_LINES_AT_ONCE or random.random() < 0.3:
                    if self.state in ACTIVE_STATES:
                        output( self.buffer )

                    self.buffer = ""
                    self.lines_buffered = 0

                # Move to next data point.  Increment self.index and loop back round
                self.index += 1
                if self.index >= len(datapoints):
                    self.index = 0

                time.sleep(0.2 / TIME_WARP)

            except KeyboardInterrupt:
                break

p = Publisher()
p.run()

sock.close()

print "Finished."