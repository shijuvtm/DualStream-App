import { useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Host() {
  const webcamVideo = useRef();
  const screenVideo = useRef();

  const peerConnection = useRef(null);

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
    <div className="p-4 grid grid-cols-2 gap-4">
      <video
        ref={webcamVideo}
        autoPlay
        playsInline
        className="rounded-lg border"
      />

      <video
        ref={screenVideo}
        autoPlay
        playsInline
        className="rounded-lg border"
      />
    </div>
  );
}
