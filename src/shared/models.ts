export interface Video {
    size: number;
    created: string;
}
export interface VideoList {
    [k: string]: Video | VideoList;
}
