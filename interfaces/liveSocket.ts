import * as IO from 'socket.io';

export declare interface LiveSocket {
    key: string;
    socket: IO.Socket;
    type: 'guest' | 'watcher' | 'collector';
    name: string;
    relationshipKeys: Array < string > ;
}


export declare interface LiveSocketMessage extends  LiveSocketMessageBase {
    // event: 'regist' | 'show' | 'call' | 'accept' | 'offer' | 'answer' | 'candidate' | 'leave';
    to ? : string;
    [key: string]: any;
}

export declare interface LiveSocketMessageBase {
    event: 'regist' | 'show' | 'call' | 'accept' | 'offer' | 'answer' | 'candidate' | 'leave';
}