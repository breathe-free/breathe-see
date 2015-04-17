## breathe-see

Getting data from a sampling device to a web browser in (near) real-time.

### Set up using ansible

You can get everything in place by using ansible and https://github.com/breathe-free/setup-sampler

### Set up by hand

Requirements:

* something that can write to a unix socket (example publisher provided in python)
* nodejs (working with v0.10.28 for now, see useful_scripts dir)
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

* There will be more - primarily relating to a second capture system (let's start thinking about putting these options in tabs)
* Document the protocol a bit
* Document the interface a bit more

When we get chance:

* Basic tests