#!/usr/bin/env python
import socket
import sys
import os
import time
import random

server_address = '/tmp/lucidity.socket'

# Make sure the socket exists
if not os.path.exists(server_address):
    raise Exception("No socket at %s" % server_address)

# Create a UDS socket
sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

# Try and connect to socket.  Output any error and fall over.
try:
    sock.connect(server_address)
except socket.error, msg:
    print >>sys.stderr, msg
    sys.exit(1)

# Until user hits Ctrl+C, generate 1000 datapoints every so often
# and push them down the socket.
while True:
    try:
        data = []
        for i in range(0,999):   # 1000 data points
            data.append(str(random.randint(100,900)))
        
        sock.sendall(",".join(data) + "\n")
        time.sleep(0.2)
    except KeyboardInterrupt:
        break

sock.close()

print "Finished."