import { PlaybackState, VideoRequest } from 'shared/models';
import { Clients } from './clients';
import { VideoState, VIDEO_PATH } from './videoState';
import { updateVideoHistory } from './videoHistory';
import * as Vlc from './vlc';
import * as  express from 'express';
import * as  expressWs from 'express-ws';
import * as cors from 'cors';

const port = 3000;
const app = express()

const clients = new Clients();

const notify = (playbackState: PlaybackState) => clients.notify({
  type: 'PLAYBACK',
  playbackState
});
const videoState = new VideoState(notify);

videoState.refreshVideoList();
setInterval(() => videoState.refreshVideoList(), 60000);

expressWs(app);

app.use(cors());
app.options('*', cors());

app.use(express.static('dist/client'))

const processRequest = (wsReq: VideoRequest, ws: WebSocket) => {
  const ack = () => ws.send(JSON.stringify({type: 'ACK'}));
  const nack = () => ws.send(JSON.stringify({type: 'NACK'}));

  switch(wsReq.type) {
    case 'START':
      if (videoState.isValidPath(wsReq.path)) {
        const escapedPath = wsReq.path.replace(/(\s+)/g, '\\$1')
        Vlc.start(`${VIDEO_PATH}/${escapedPath}`);  // TODO - store the child process ref?
        videoState.start(wsReq.path);
        ack();
      } else {
        console.log('Invalid video path', wsReq.path)
        nack()
      }
      break;
    case 'PAUSE':
      Vlc.pause()
        .then(() => {
          videoState.pause();
          ack();
        });
      break;
    case 'STOP':
      Vlc.stop()
        .then(() => {
          videoState.stop();
          ack();
        });
      break;
    case 'RESUME':
      Vlc.resume()
        .then(() => {
          videoState.resume();
          ack();
        });
      break;
    case 'SEEK':
      Vlc.seek(wsReq.us)
        .then(() => {
          videoState.refreshPosition();
          ack();
        })
      break;
    default:
      ws.send('UNKNOWN')
      nack();
  }
}

app.ws('/video', (ws, req) => {
  const id = clients.addClient(ws);
  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'PLAYBACK',
      playbackState: videoState.playbackState
    }))
  });
  ws.on('message', msg => {
    const wsReq = JSON.parse(msg) as VideoRequest;
    processRequest(wsReq, ws);
  });
  ws.on('close', () => {
    console.log('removing client', id)
    clients.removeClient(id);
  });
});


app.get('/videos', (req, res) => {
  res.send(videoState.getVideoList());
})

app.post(/^\/videos\/viewed\/(.+)/, (req, res) => {
  const path = req.params[0];
  updateVideoHistory(`${VIDEO_PATH}/${path}`, true)
    .then(() => videoState.refreshVideoList())
    .then(() => res.send('ok'));
})
app.delete(/^\/videos\/viewed\/(.+)/, (req, res) => {
  const path = req.params[0];
  updateVideoHistory(`${VIDEO_PATH}/${path}`, false)
    .then(() => videoState.refreshVideoList())
    .then(() => res.send('ok'));
})

app.listen(port, () => {
  console.log(`Running on http://localhost:${port}`)
})
