## breathe-see

Getting data from a sampling device to a web browser in (near) real-time.

### Set up

Requirements:

* something that can write to a unix socket (example publisher provided in python)
* nodejs (working with v0.10.28 for now)
* decent web browser

```
# After a git clone...
cd breathe-free
npm install
node index.js & # run server in the background
python example_publisher/main.py
# Now visit http://<your_ip_address>:9090/ in a decent web browser
```
