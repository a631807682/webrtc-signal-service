import * as IO from "socket.io";
import * as fs from "fs";
import * as https from "https";

import { LiveSocket, LiveSocketMessage } from "@/interfaces";

const options = {
  key: fs.readFileSync("./ssl/domain.key"),
  cert: fs.readFileSync("./ssl/domain.crt")
};
const port = 3001;
const server = https.createServer(options).listen(port, () => {
  console.log("listening in ", port);
});

// 链接缓存
let liveSocketList: Array<LiveSocket> = [];

let io = IO(server);
io.on("connect", socket => {
  let lSocket: LiveSocket = {
    key: socket.id,
    socket: socket,
    type: "guest",
    name: "",
    relationshipKeys: []
  };
  liveSocketList.push(lSocket);

  socket.on("message", (message: LiveSocketMessage) => {
    console.log("recive", message);
    let sendWithComeFromFn = sendWithComeFrom.bind(
      socket,
      liveSocketList,
      message
    );
    switch (message.event) {
      case "regist": {
        let registSocket = findLiveSocket(liveSocketList, socket);
        registSocket.type = message.type;
        registSocket.name = message.name;
        showUsers(liveSocketList);
        break;
      }
      case "call": {
        sendWithComeFromFn();
        break;
      }
      case "accept": {
        // 客户端发送同意到服务端
        let from = findLiveSocket(liveSocketList, socket);
        let to = findLiveSocket(liveSocketList, message.to);
        // 更新连接状态
        if (message.accept) {
          to.relationshipKeys.push(from.key);
          from.relationshipKeys = [to.key];

          showUsers(liveSocketList);
        }
        // 发送同意到对端
        let msg = {
          from: {
            name: from.name,
            key: from.key
          }
        };
        sendTo(to, Object.assign(message, msg));
        break;
      }
      case "offer": {
        sendWithComeFromFn();
        break;
      }
      case "answer": {
        sendWithComeFromFn();
        break;
      }
      case "candidate": {
        sendWithComeFromFn();
        break;
      }
      case "leave": {
        let from = findLiveSocket(liveSocketList, socket);
        let to = findLiveSocket(liveSocketList, message.to);
        from.relationshipKeys = from.relationshipKeys.filter(
          key => key !== to.key
        );
        to.relationshipKeys = to.relationshipKeys.filter(
          key => key !== from.key
        );
        // 发送离开消息到对端
        let msg = {
          from: {
            name: from.name,
            key: from.key
          }
        };
        sendTo(to, Object.assign(message, msg));
        showUsers(liveSocketList);
        break;
      }
    }
  });

  socket.on("disconnect", function() {
    let sIndex = findLiveSocketIndex(liveSocketList, socket);
    if (sIndex > -1) {
      let disSocket = liveSocketList[sIndex];
      // 清除缓存
      liveSocketList.splice(sIndex, 1);
      // 查找关系 通知离开
      if (disSocket.type === "watcher" || disSocket.type === "collector") {
        for (let liveSocket of liveSocketList) {
          liveSocket.relationshipKeys = liveSocket.relationshipKeys.filter(
            key => key !== disSocket.key
          );
        }

        showUsers(liveSocketList);
      }
    }
  });

  socket.on("error", error => {
    console.error(error);
  });
});

/**
 * 查找socket在缓存中的位置
 * @param sockets 缓存列表
 * @param socket socket实例
 */
function findLiveSocketIndex(
  sockets: Array<LiveSocket>,
  socket: IO.Socket
): number {
  return sockets.findIndex(ls => ls.socket === socket);
}

/**
 * 查找socket对应的缓存实例
 * @param sockets 缓存列表
 * @param socket socket实例
 */
function findLiveSocket(
  sockets: Array<LiveSocket>,
  socketOrKey: IO.Socket | string
): LiveSocket {
  return sockets.find(
    ls => ls.socket === <IO.Socket>socketOrKey || ls.key === <string>socketOrKey
  );
}

/**
 * 通知链接用户有变更
 * @param lsockets 缓存列表
 */
function showUsers(lsockets: Array<LiveSocket>) {
  let registedls = lsockets.filter(ls => ls.type !== "guest");
  for (let ls of registedls) {
    let users = registedls.map(s => {
      return {
        key: s.key,
        type: s.type,
        name: s.name,
        relationship: s.relationshipKeys
      };
    });
    sendTo(ls, {
      event: "show",
      own: {
        name: ls.name,
        key: ls.key,
        type: ls.type
      },
      users
    });
  }
}

/**
 * 消息转发
 * @param lsockets 缓存列表
 * @param message 原消息
 * @param data 附加消息
 */
function sendWithComeFrom(
  lsockets: Array<LiveSocket>,
  message: LiveSocketMessage,
  data: object
) {
  let from = findLiveSocket(lsockets, this);
  let to = findLiveSocket(lsockets, message.to);
  let msg = {
    from: {
      name: from.name,
      key: from.key
    }
  };

  sendTo(to, Object.assign(message, msg, data));
}

/**
 * 发送消息
 * @param connection  客户端链接
 * @param message 内容
 */
function sendTo(ls: LiveSocket, message: LiveSocketMessage) {
  console.log("send", message);
  if (ls && ls.socket) {
    ls.socket.send(message);
  } else {
    console.warn("target disconnect");
  }
}
