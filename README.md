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
python example_publisher
# Now visit http://<your_ip_address>:9090/ in a decent web browser
```

### To-do

Most "impactful" stuff at the top:

* supervisor.d - a way to start processes on boot, and restart them thru a browser
* Add "Blank capture" option. Yes/no - default to user settings/no
* Add "Total breath" option. Yes/no - default to user settings/no
* Remove default trigger settings.
* "Filename" - single line input to be used by the data collector when generating file name
* Percentage completion of volume collected and time spent collecting. (both are already user-defined limits, and status is included in the transmitted data string.)
    We'll get the python to emit these values in JSON and just display them. No calculation in the viewer.
* Include a legend for the graph.
* Capture window options:
    Pump on  [5-95]% [rising/falling]
    Pump off [5-95]% [rising/falling]

Soonish:

* There will be more - primarily relating to a second capture system (let's start thinking about putting these options in tabs)
* Document the protocol a bit

When we get chance:

* Basic tests
* fabfile/similar - a way to deploy our stuff onto a clean fresh computer

### Misc. features

* Browsing and download of files in a results directory
