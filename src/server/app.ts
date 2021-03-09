const express = require('express')
const app = express()
const cors = require('cors')
const { getVideosList } = require('./videosList')
const { startVlc, pauseVlc, resumeVlc, stopVlc } = require('./vlc')

const port = 3000;
const videoPath = process.env.VIDEO_PATH;

app.use(cors());
app.options('*', cors());

app.use(express.static('dist/client'))
// app.use(express.static('data'))

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/videos', (req, res) => {
  getVideosList(videoPath).then(r => {
    res.send(r)
  })
})

app.put(/^\/videos\/(.+)/, (req, res) => {
  const path = req.params[0].replace(/(\s+)/g, '\\$1')
  startVlc(`${videoPath}/${path}`);
  res.send(req.params)
})

app.put('/video/pause', (req, res) => {
  pauseVlc();
  res.send('ok');
})

app.put('/video/resume', (req, res) => {
  resumeVlc();
  res.send('ok');
})

app.put('/video/stop', (req, res) => {
  stopVlc();
  res.send('ok');
})

app.listen(port, () => {
  console.log(`Running on http://localhost:${port}`)
})
