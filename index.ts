import * as IO from 'socket.io';
import * as fs from 'fs';
import * as https from 'https'
import {
    LiveSocket,
    LiveSocketMessage
} from '@/interfaces'

const options = {
    key: fs.readFileSync('./ssl/key.pem'),
    cert: fs.readFileSync('./ssl/cert.pem'),
    passphrase: '123456789'
};
const port = 3001;
const server = https.createServer(options).listen(port, () => {
    console.log('listening in ', port)
});

// 链接缓存
let liveSocketList: Array < LiveSocket >= [];

let io = IO(server);
io.on('connect', (socket) => {
    let lSocket: LiveSocket = {
        key: socket.id,
        socket: socket,
        type: 'guest',
        name: '',
        relationship: []
    }
    liveSocketList.push(lSocket)

    socket.on('message', (message: LiveSocketMessage) => {
        console.log(message);
        let sendWithComeFromFn = sendWithComeFrom.bind(socket, liveSocketList, message)
        switch (message.event) {
            case 'regist':
                {
                    let registSocket = findLiveSocket(liveSocketList, socket);
                    registSocket.type = message.type;
                    registSocket.name = message.name;
                    showUsers(liveSocketList);
                    break;
                }
            case 'call':
                {
                    sendWithComeFromFn();
                    break;
                }
            case 'accept':
                {
                    sendWithComeFromFn();
                    break;
                }
            case 'offer':
                {
                    sendWithComeFromFn();
                    break;
                }
            case 'answer':
                {
                    sendWithComeFromFn();
                    break;
                }
            case 'candidate':
                {
                    sendWithComeFromFn();
                    break;
                }

        }
    })

    socket.on('disconnect', function () {
        let sIndex = findLiveSocketIndex(liveSocketList, socket);
        if (sIndex > -1) {
            let disSocket = liveSocketList[sIndex];
            // 查找关系 通知离开
            if (disSocket.type === 'server' || disSocket.type === 'client') {
                for (let lsk of disSocket.relationship) {
                    showUsers(liveSocketList);
                }
            }
            // 清除缓存
            liveSocketList.splice(sIndex, 1)
        }
    })

    socket.on('error', (error) => {
        console.error(error);
    })
})



/**
 * 查找socket在缓存中的位置
 * @param sockets 缓存列表
 * @param socket socket实例
 */
function findLiveSocketIndex(sockets: Array < LiveSocket > , socket: IO.Socket): number {
    return sockets.findIndex(ls => ls.socket === socket);
}

/**
 * 查找socket对应的缓存实例
 * @param sockets 缓存列表
 * @param socket socket实例
 */
function findLiveSocket(sockets: Array < LiveSocket > , socketOrKey: IO.Socket | string): LiveSocket {
    return sockets.find(ls => ls.socket === < IO.Socket > socketOrKey || ls.key === < string > socketOrKey);
}

/**
 * 通知链接用户有变更
 * @param lsockets 缓存列表
 */
function showUsers(lsockets: Array < LiveSocket > ) {
    let registedls = lsockets.filter(ls => ls.type !== 'guest');
    for (let ls of registedls) {
        let users = lsockets.map(s => {
            return {
                key: s.key,
                type: s.type,
                name: s.name,
                relationship: s.relationship.map(r => r.key)
            }
        });
        sendTo(ls.socket, {
            event: 'show',
            own: {
                name: ls.name,
                key: ls.key,
                type: ls.type,
            },
            users
        })
    }
}

/**
 * 消息转发
 * @param lsockets 缓存列表
 * @param message 原消息
 * @param data 附加消息
 */
function sendWithComeFrom(lsockets: Array < LiveSocket > , message: LiveSocketMessage, data: object) {
    let from = findLiveSocket(lsockets, this);
    let to = findLiveSocket(lsockets, message.to);
    let msg = {
        from: {
            name: from.name,
            key: from.key
        }
    }

    sendTo(to.socket, Object.assign(message, msg, data));
}

/**
 * 发送消息
 * @param connection  客户端链接
 * @param message 内容
 */
function sendTo(connection: IO.Socket, message: LiveSocketMessage) {
    console.log('send', message)
    connection.send(message);
}