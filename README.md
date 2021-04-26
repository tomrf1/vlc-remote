### vlc-remote

A simple webapp for controlling VLC over a local network from the browser. Built for use with a raspberry pi with no input devices.

There are alternatives that make use of VLC's network interfaces (see e.g. https://wiki.videolan.org/Control_VLC_from_an_Android_Phone/). This solution does not require VLC to be open to the network.

Node.js/typescript/react/websockets. Uses dbus for VLC commands.

#### Setup to make it run on startup:
```
sudo apt-get install qdbus

npm install
npm run build

sudo cp vlc-remote.service /etc/systemd/system/vlc-remote.service
// if necessary, edit the User and VIDEO_PATH env var in vlc-remote.service
sudo systemctl enable vlc-remote.service
```

#### Running manually:
```
VIDEO_PATH=/path/to/videos npm run app
```
