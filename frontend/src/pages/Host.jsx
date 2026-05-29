import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Host() {
  const webcamVideo = useRef();
  const screenVideo = useRef();
  const peerConnection = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    setupConnection();
  }, []);

  const setupConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    let streamCount = 0;

    peerConnection.current.ontrack = (event) => {
      streamCount++;

      if (streamCount === 1) {
        webcamVideo.current.srcObject = event.streams[0];
      } else {
        screenVideo.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerConnection.current.onconnectionstatechange = () => {
      setConnectionStatus(peerConnection.current.connectionState);
    };

    socket.on("offer", async (offer) => {
      await peerConnection.current.setRemoteDescription(offer);

      const answer = await peerConnection.current.createAnswer();

      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer", answer);
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        await peerConnection.current.addIceCandidate(candidate);
      } catch (err) {
        console.log(err);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">DualStream Host</h1>
              <p className="text-slate-400 mt-1">Live dual video streaming</p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-sm font-medium text-slate-300 capitalize">
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Webcam Stream */}
          <div className="group">
            <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-700 hover:border-slate-600 transition-colors">
              <video
                ref={webcamVideo}
                autoPlay
                playsInline
                muted
                className="w-full h-96 lg:h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Webcam</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Screen Share Stream */}
          <div className="group">
            <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-700 hover:border-slate-600 transition-colors">
              <video
                ref={screenVideo}
                autoPlay
                playsInline
                muted
                className="w-full h-96 lg:h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Screen Share</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-slate-400 text-sm font-medium">Video Codec</p>
            <p className="text-white text-lg font-semibold mt-1">VP8/VP9</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-slate-400 text-sm font-medium">Audio Codec</p>
            <p className="text-white text-lg font-semibold mt-1">Opus</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-slate-400 text-sm font-medium">Connection</p>
            <p className="text-white text-lg font-semibold mt-1">WebRTC</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-slate-400 text-sm font-medium">Status</p>
            <p
              className={`text-lg font-semibold mt-1 ${
                connectionStatus === "connected"
                  ? "text-green-400"
                  : connectionStatus === "connecting"
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {connectionStatus === "connected" ? "Live" : "Offline"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
