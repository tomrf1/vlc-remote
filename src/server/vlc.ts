const { exec } = require('child_process');

const execute = (cmd: string): Promise<any> => new Promise((resolve, reject) =>
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.log(err)
            return reject(err);
        }
        if (stderr) {
            console.log(stderr)
            return reject(err);
        }
        console.log(stdout)
        return resolve(stdout)
    })
);

const start = (path: string) => execute(`vlc --fullscreen ${path}`);

const pause = () => execute('dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2   org.mpris.MediaPlayer2.Player.PlayPause');

const resume = () => execute(
    'dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2   org.mpris.MediaPlayer2.Player.Play'
);

const stop = () => execute('killall vlc');

const seek = (us: number) => execute(
    `dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2   org.mpris.MediaPlayer2.Player.Seek int64:"${us}"`
)

const position = () => execute(
    'qdbus org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get org.mpris.MediaPlayer2.Player Position'
)

const lengthRegex = /^mpris:length: (\d*)$/;
const length = (): Promise<{length: number}> => execute(
    'qdbus org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get org.mpris.MediaPlayer2.Player Metadata'
).then(metadata => {
    const token = metadata.split('\n').find(token => token.includes('mpris:length'));
    if (token) {
        const matches = token.match(lengthRegex);
        if (matches[1]) {
            return Promise.resolve({length: matches[1] as number});
        } else {
            console.log('Cannot parse token', token)
            return Promise.reject('Not found')
        }
    } else {
        console.log('No length found in metadata:', metadata)
        return Promise.reject('Not found');
    }
})

export { start, pause, resume, stop, seek, position, length }