import { PlaybackState, VideoRequest } from 'shared/models';
import { Clients } from './clients';
import { VideoState, VIDEO_PATH } from './videoState';
import { updateVideoHistory } from './videoHistory';
import * as Vlc from './vlc';
import * as O from '../shared/option';
import * as  express from 'express';
import * as  expressWs from 'express-ws';
import * as cors from 'cors';

const port = 3000;
const app = express()

const clients = new Clients();

const notify = (playbackState: O.Option<PlaybackState>) => clients.notify({
  type: 'PLAYBACK',
  playbackState
});
const videoState = new VideoState(notify);

videoState.refreshVideoList();
setInterval(() => videoState.refreshVideoList(), 60000);

const wsApp = expressWs(app).app;

wsApp.use(cors());
// @ts-ignore
wsApp.options('*', cors());

wsApp.use(express.static('dist/client'))

const processRequest = (request: VideoRequest): Promise<void> => {
  switch(request.type) {
    case 'START':
      if (videoState.isValidPath(request.path)) {
        return Vlc.start(`${VIDEO_PATH}/${request.path}`, request.subtitles)
          .then(process => videoState.start(request.path, process));
      } else {
        return Promise.reject(`Invalid video path: ${request.path}`);
      }
    case 'PAUSE':
      return Vlc.pause().then(() => videoState.pause())
    case 'STOP':
      return Promise.resolve(videoState.stop());
    case 'RESUME':
      return Vlc.resume().then(() => videoState.resume());
    case 'SEEK':
      if (!isNaN(Number(request.us))) {
        return Vlc.seek(request.us).then(() => videoState.refreshPosition());
      } else {
        return Promise.reject('NaN')
      }
    case 'PING':
      return Promise.resolve();
    default:
      return Promise.reject('unknown message type');
  }
}

wsApp.ws('/video', (ws, req) => {
  const id = clients.addClient(ws);
  console.log('new client', id)
  
  ws.send(JSON.stringify({
    type: 'PLAYBACK',
    playbackState: videoState.playbackState
  }));

  ws.on('message', (msg: string) => {
    const wsReq = JSON.parse(msg) as VideoRequest;
    processRequest(wsReq)
      .then(() => ws.send(JSON.stringify({type: 'ACK'})))
      .catch(err => {
        console.log(err);
        ws.send(JSON.stringify({
          type: 'NACK',
          reason: err
        }))
      }
    );
  });
  ws.on('close', () => {
    console.log('removing client', id)
    clients.removeClient(id);
  });
});


wsApp.get('/videos', (req, res) => {
  res.send(videoState.getVideoList());
})

wsApp.post(/^\/videos\/viewed\/(.+)/, (req, res) => {
  const path = req.params[0];
  updateVideoHistory(`${VIDEO_PATH}/${path}`, true)
    .then(() => videoState.refreshVideoList())
    .then(() => res.send('ok'))
    .catch(err => res.status(500).send(`${err}`));
})
wsApp.delete(/^\/videos\/viewed\/(.+)/, (req, res) => {
  const path = req.params[0]; 
  updateVideoHistory(`${VIDEO_PATH}/${path}`, false)
    .then(() => videoState.refreshVideoList())
    .then(() => res.send('ok'))
    .catch(err => res.status(500).send(`${err}`));
})

wsApp.listen(port, () => {
  console.log(`Running on http://localhost:${port}`)
})
