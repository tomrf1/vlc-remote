export interface Video {
    size: number;
    created: string;
    viewed: boolean;
}
export interface VideoList {
    [k: string]: Video | VideoList;
}
