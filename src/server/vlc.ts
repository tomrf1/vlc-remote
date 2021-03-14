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

export { start, pause, resume, stop, seek, position }