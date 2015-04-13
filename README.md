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

* Basic tests?
* Document the protocol a bit
* Investigate supervisor.d
* fabfile/similar

### Misc. features

* Browsing and download of files in a results directory
