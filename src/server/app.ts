const express = require('express')
const app = express()
const cors = require('cors')
const { getVideosList } = require('./videosList')
const { getVideoHistory, updateVideoHistory } = require('./videoHistory');
const Vlc = require('./vlc')

const port = 3000;
const videoPath = process.env.VIDEO_PATH;

app.use(cors());
app.options('*', cors());

app.use(express.static('dist/client'))

app.get('/videos', (req, res) => {
  getVideoHistory()
    .then(history => getVideosList(videoPath, history))
    .then(r => {
      res.send(r)
    })
})

app.put(/^\/videos\/(.+)/, (req, res) => {
  const path = req.params[0].replace(/(\s+)/g, '\\$1')
  Vlc.start(`${videoPath}/${path}`);
  res.send(req.params)
})

app.put('/video/pause', (req, res) => {
  Vlc.pause().then(() => res.send('ok'));
})

app.put('/video/resume', (req, res) => {
  Vlc.resume().then(() => res.send('ok'));
})

app.put('/video/stop', (req, res) => {
  Vlc.stop().then(() => res.send('ok'));
})

app.put('/video/seek/:us(-?\\d+)', (req, res) => {
  Vlc.seek(req.params.us as number).then(() => res.send('ok'));
})

app.get('/video/position', (req, res) => {
  Vlc.position().then(position => res.send({position: position as number}))
})

app.get('/video/length', (req, res) => {
  Vlc.length().then(metadata => res.send(metadata))
})

app.post(/^\/videos\/viewed\/(.+)/, (req, res) => {
  const path = req.params[0];
  updateVideoHistory(`${videoPath}/${path}`, true).then(() => res.send('ok'));
})
app.delete(/^\/videos\/viewed\/(.+)/, (req, res) => {
  const path = req.params[0];
  updateVideoHistory(`${videoPath}/${path}`, false).then(() => res.send('ok'));
})

app.listen(port, () => {
  console.log(`Running on http://localhost:${port}`)
})
