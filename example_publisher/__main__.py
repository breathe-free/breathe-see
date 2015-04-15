#!/usr/bin/env python
import socket
import sys
import os
import time
import random
import csv
import json
import random
from sentence_generator import make_sentence
from copy import deepcopy

# csv file columns are timestamp, pressure, CO2, ...
SAMPLE_DATA_DIR   = os.path.join(os.path.dirname(__file__), "sample_data")
SAMPLE_DATA       = os.path.join(SAMPLE_DATA_DIR, "1427199271-sample-breathing.csv")
SOCKET_PATH       = '/tmp/lucidity.socket'
TIME_WARP         = float(os.environ.get('TIME_WARP', 1.0))
MAX_LINES_AT_ONCE = int(os.environ.get('MAX_LINES_AT_ONCE', 1))

class SocketNotFound(Exception):
    pass

# Read in data from the example csv file
datapoints = []
with open(SAMPLE_DATA, 'rb') as csvfile:
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

except (SocketNotFound, socket.error), msg:
    print >>sys.stderr, "Error connecting to %s.\n\n%s." % (SOCKET_PATH, msg)
    sys.exit(1)

def receive(the_socket):
    # Act as an iterator.  Sometimes >1 message will have accumulated on the
    # socket by the time we come to read it.
    # Yield either None (if nothing received, buffer empty) or json decode line by line.
    rbuffer = ''
    while True:
        try:
            incoming = the_socket.recv(1024)
            rbuffer += incoming
        except socket.error:
            # nothing to read
            yield None
            continue

        while rbuffer.find("\n") != -1:
            line, rbuffer = rbuffer.split("\n", 1)
            try:
                yield json.loads(line)
            except ValueError, e:
                print >>sys.stderr, str(e)
                print >>sys.stderr, line




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

DEFAULT_SETTINGS = {
    "calibration_time":         3,
    "sample_collection_time":   3,
    "collection_control":       "c",
    "auto_triggers":            True,
    "collection_rate":          4,
    "collection_limit":         5,
}

class Publisher:
    def __init__(self):
        self.lines_buffered = 0
        self.index = 0
        self.buffer = ""
        self.state = None
        self.change_state(STATES.INITIALISING)
        self.user_settings = {
            "calibration_time":         5,
            "sample_collection_time":   2,
            "collection_control":       "p",
            "auto_triggers":            False,
            "collection_rate":          2,
            "collection_limit":         7,
        }
        self.settings = deepcopy(DEFAULT_SETTINGS)

    def change_state(self, new_state, message=None, severity=None):
        if self.state != new_state:
            message = "State changed to %s." % new_state
            severity = "info"

        self.state = new_state
        self.emit(message=message, severity="info")

    def emit(self, **kwargs):
        h = {"state": self.state}
        for key,val in kwargs.iteritems():
            h[key] = val
        output(json.dumps(h) + "\n")        

    def run(self):
        # Wait a while to simulate initialisation
        self.change_state(STATES.INITIALISING)
        time.sleep(3.0 / TIME_WARP)
        self.change_state(STATES.WAITING)

        # Loop until user hits Ctrl+C
        while True:
            try:
                # read from sock
                received = receive(sock).next()
                if received is not None and 'command' in received:
                    # act on information received
                    print "Received: %s" % received
                    
                    do_what = received['command']
                    if do_what == "stop":
                        self.change_state(STATES.WAITING)
                    
                    elif do_what == "start":
                        self.emit(message="Using settings: " + json.dumps(received['settings']), severity="info", results_dir=SAMPLE_DATA_DIR)
                        self.change_state(STATES.CALIBRATING)

                    elif do_what == "request_state":
                        self.emit()
                    
                    elif do_what == "request_settings_current":
                        self.emit(settings=self.settings, results_dir=SAMPLE_DATA_DIR)
                    
                    elif do_what == "apply_settings_default":
                        self.settings = deepcopy(DEFAULT_SETTINGS)
                        self.emit(settings=self.settings, message="Loaded default settings.", severity="info")
                    
                    elif do_what == "apply_settings_user":
                        self.settings = deepcopy(self.user_settings)
                        self.emit(settings=self.settings, message="Loaded user settings.", severity="info")
                    
                    elif do_what == "save_settings":
                        self.user_settings = received['settings']
                        self.settings = deepcopy(self.user_settings)
                        self.emit(settings=self.settings, message="Saved user settings.", severity="info")

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

                # Emit some random debugging every now and then
                if self.state == STATES.WAITING:
                    if random.random() < 0.1:
                        self.emit(message="Waiting" + "." * random.randint(2,5))
                else:
                    x = random.random()
                    if x < 0.05:
                        self.emit(message="ERROR: " + make_sentence(), severity="error")
                    elif x < 0.1:
                        self.emit(message="WARNING: " + make_sentence(), severity="warning")
                    elif x < 0.5:
                        self.emit(message=make_sentence())

                time.sleep(0.2 / TIME_WARP)

            except KeyboardInterrupt:
                break

p = Publisher()
p.run()

sock.close()

print "Finished."