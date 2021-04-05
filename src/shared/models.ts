export interface Video {
    size: number;
    created: string;
    viewed: boolean;
}
export interface VideoList {
    [k: string]: Video | VideoList;
}

export interface Playing {
    path: string;
    paused: boolean;
    position: number;
    length: number;
}
export type PlaybackState = null | Playing;



interface VideoStartRequest {
    type: 'START',
    path: string
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

export type VideoRequest = 
    VideoStartRequest |
    VideoPauseRequest |
    VideoStopRequest |
    VideoSeekRequest |
    VideoResumeRequest;
