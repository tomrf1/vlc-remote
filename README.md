Setup to run on startup:
```
sudo apt-get install qdbus

sudo cp remote-pi.service /etc/systemd/system/remote-pi.service
sudo systemctl enable remote-pi.service
```

Running manually:
```
npm install
npm run build
VIDEO_PATH=/path/to/videos npm run app
```
