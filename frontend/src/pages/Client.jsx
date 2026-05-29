import { useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Client() {
  const webcamRef = useRef();
  const screenRef = useRef();

  const peerConnection = useRef(null);

  useEffect(() => {
    startStreaming();
  }, []);

  const startStreaming = async () => {
    try {
      // Webcam
      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Screen
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Add timestamp overlay
      const webcamProcessed = await addTimestamp(webcamStream);
      const screenProcessed = await addTimestamp(screenStream);

      webcamRef.current.srcObject = webcamProcessed;
      screenRef.current.srcObject = screenProcessed;

      createPeerConnection(webcamProcessed, screenProcessed);
    } catch (err) {
      console.error("Error accessing media devices:", err);
    }
  };

  const addTimestamp = async (stream) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;

      const ctx = canvas.getContext("2d");

      // Wait for video to have metadata (dimensions) before starting to draw
      video.onloadedmetadata = () => {
        video.play();

        // Now start the drawing loop
        const intervalId = setInterval(() => {
          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const now = new Date();
            const time = now.toLocaleTimeString();

            ctx.font = "40px Arial";
            ctx.fillStyle = "red";
            ctx.fillText(time, 50, 60);
          } catch (err) {
            console.error("Error drawing to canvas:", err);
          }
        }, 1000 / 30);

        // Return the canvas stream after it's ready
        resolve(canvas.captureStream(30));
      };
    });
  };

  const createPeerConnection = async (webcamStream, screenStream) => {
    try {
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });

      webcamStream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, webcamStream);
      });

      screenStream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, screenStream);
      });

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", event.candidate);
        }
      };

      const offer = await peerConnection.current.createOffer();

      await peerConnection.current.setLocalDescription(offer);

      socket.emit("offer", offer);

      socket.on("answer", async (answer) => {
        await peerConnection.current.setRemoteDescription(answer);
      });

      socket.on("ice-candidate", async (candidate) => {
        try {
          await peerConnection.current.addIceCandidate(candidate);
        } catch (err) {
          console.log(err);
        }
      });
    } catch (err) {
      console.error("Error creating peer connection:", err);
    }
  };

  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      <video
        ref={webcamRef}
        autoPlay
        playsInline
        muted
        className="rounded-lg border"
      />

      <video
        ref={screenRef}
        autoPlay
        playsInline
        muted
        className="rounded-lg border"
      />
    </div>
  );
}
