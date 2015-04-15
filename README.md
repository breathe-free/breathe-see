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

* Soonish:

* There will be more - primarily relating to a second capture system (let's start thinking about putting these options in tabs)
* Document the protocol a bit

When we get chance:

* Basic tests
* fabfile/similar - a way to deploy our stuff onto a clean fresh computer

### Misc. features

* Browsing and download of files in a results directory
