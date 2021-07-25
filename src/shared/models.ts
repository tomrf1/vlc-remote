export interface Video {
    size: number;
    created: string;
    viewed: boolean;
}
export interface VideoList {
    [k: string]: Video | VideoList;
}

export interface PlaybackState {
    path: string;
    paused: boolean;
    position: number;
    length: number;
}


interface VideoStartRequest {
    type: 'START',
    path: string,
    subtitles: boolean,
}
interface VideoPauseRequest {
    type: 'PAUSE'
}
interface VideoStopRequest {
    type: 'STOP'
}
interface VideoResumeRequest {
    type: 'RESUME'
}
interface VideoSeekRequest {
    type: 'SEEK',
    us: number
}
interface VideoPingRequest {
    type: 'PING'
}

export type VideoRequest = 
    VideoStartRequest |
    VideoPauseRequest |
    VideoStopRequest |
    VideoSeekRequest |
    VideoResumeRequest |
    VideoPingRequest;
