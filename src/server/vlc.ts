import { exec, spawn, ChildProcess } from 'child_process';

// Resolves only when the child process ends
const executeToCompletion = (cmd: string): Promise<string> => new Promise((resolve, reject) =>
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            reject(`${err}`);
        }
        if (stderr) {
            reject(`${err}`);
        }
        resolve(stdout);
    })
);

const start = (path: string, subtitles: boolean) => Promise.resolve(spawn(
    'vlc', 
    [
        '--fullscreen', 
        ...(subtitles ? ['--sub-track', '0'] : []), 
        path
    ]
));

const dbusSend = "dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2";

const pause = () => executeToCompletion(`${dbusSend} org.mpris.MediaPlayer2.Player.PlayPause`);

const resume = () => executeToCompletion(`${dbusSend} org.mpris.MediaPlayer2.Player.Play`);

const seek = (us: number) => executeToCompletion(
    `${dbusSend} org.mpris.MediaPlayer2.Player.Seek int64:"${us}"`
)

const qdbusGet = 'qdbus org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get org.mpris.MediaPlayer2.Player';

const position = () => executeToCompletion(`${qdbusGet} Position`)
    .then(position => position.replace('\n',''))

const lengthRegex = /^mpris:length: (\d*)$/;
const length = (): Promise<number> => executeToCompletion(`${qdbusGet} Metadata`).then(metadata => {
    const token = metadata
        .split('\n')
        .find(token => token.includes('mpris:length'));

    if (token) {
        const matches = token.match(lengthRegex);
        if (matches && matches[1]) {
            const length = parseInt(matches[1]);
            return Promise.resolve(length);
        } else {
            return Promise.reject(`Cannot parse token: ${token}`);
        }
    } else {
        return Promise.reject(`No length found in metadata: ${metadata}`);
    }
})

export { start, pause, resume, seek, position, length }