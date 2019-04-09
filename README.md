webrtc-signal-service
---

[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu) [![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

## 描述
* webrtc信令服务器，配合[webrtc-web](https://github.com/a631807682/webrtc-web)使用，用于交换SDP及业务信号。
* ssl/domain.crt、ssl/domain.key需为正式签名。
* 需要自建[stun/turn](https://www.jianshu.com/p/49920993b0a7)服务器

## 参考
[WebRTC介绍及简单应用](https://www.cnblogs.com/vipzhou/p/7994927.html?tdsourcetag=s_pctim_aiomsg)
[stun/turn test](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)