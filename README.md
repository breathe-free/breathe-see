## breathe-see

Getting data from a sampling device to a web browser in (near) real-time.

### Set up

Requirements:

* something that can write to a unix socket (example publisher provided in python)
* nodejs (working with v0.10.28 for now)
* bower
* decent web browser

```
# After a git clone...
cd breathe-free
npm install
bower install
node index.js & # run server in the background
python example_publisher/main.py
# Now visit http://<your_ip_address>:9090/ in a decent web browser
```

### To-do

* Allow static browsing of results directory
* Basic tests?
* Document the protocol a bit
* Investigate supervisor.d
* fabfile/similar
* Add pump on and off percentage user settings below automatic trigger setting option.
* Display percentage completion of volume collected and time spent collecting. (both are already user-defined limits, and status is included in the transmitted data string.)
* include a legend for the graph.
* "Invert capture window" option - will be  a useful development option to see what is being missed. Boolean.
* More complex capture window options - lets talk about this. Needs a graphical description!
* Add "Blank capture" option
* Add "Total breath" option
* There will be more - primarily relating to a second capture system (lets start thinking about putting these options in tabs)