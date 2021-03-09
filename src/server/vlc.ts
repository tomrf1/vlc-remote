const { exec } = require('child_process');

const logResult = (err, stdout, stderr) => {
    if (err) {
        console.log(err)
    }
    if (stderr) {
        console.log(stderr)
    }
    console.log(stdout)
};

const startVlc = (path: string) => exec(`vlc --fullscreen ${path}`, logResult);

const pauseVlc = () => exec(
    'dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2   org.mpris.MediaPlayer2.Player.PlayPause',
    logResult
);

const resumeCmd = 'dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2   org.mpris.MediaPlayer2.Player.Play';
const resumeVlc = () => exec(
    'dbus-send --type=method_call --dest=org.mpris.MediaPlayer2.vlc /org/mpris/MediaPlayer2   org.mpris.MediaPlayer2.Player.Play',
    logResult
);

const stopVlc = () => exec('killall vlc', logResult);

export { startVlc, pauseVlc, resumeVlc, stopVlc }