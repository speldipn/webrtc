"use strict";

// ICE: Interactive Connectivity Establishment
// STUN: Session Traversal Utilities for NAT
// TURN: Traversal Using Relays around NAT
// NAT: Network Address Translation
// SDP: Session Description Protocol
// From https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols

import React from "react";
import io from "socket.io-client";

import { WebRTCMedia } from "../component";

const SOCKET_SERVER_ADDRESS = "https://futuremobile.net";
const POSTER_IMAGE_SAMPLE =
  "https://www.authbridge.com/wp-content/uploads/2017/04/employee-background-screening-1-700x441.jpg";
const VIDEO_DEFAULT_WIDTH = 240;
const VIDEO_DEFAULT_HEIGHT = 320;
const STUN_TURN_URL = "stun:stun.l.google.com:19302";

class WebRTCMediaContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      peerConnection: []
    };

    this.mediaRef = React.createRef();

    this.socket = io(SOCKET_SERVER_ADDRESS);

    this.socket.on("connect", () => {
      console.log("Connected");
    });

    this.socket.on("event", data => console.log(data));

    this.socket.on("disconnect", () => {
      console.log("Disconnected");
      this.socket = undefined;
    });

    this.socket.on("connect_error", error => {
      console.log(error);
    });

    this.socket.on("connect_timeout", () => {
      console.log("timeout");
    });

    this.socket.on("reconnect", attempt => {
      console.log("reconnect", attempt);
    });

    this.socket.on("reconnect_attempt", () => {
      console.log("reconnect_attempt");
    });

    this.socket.on("reconnecting", attempt => {
      console.log("reconnecting", attempt);
    });

    this.socket.on("reconnect_error", error => {
      console.log(error);
    });

    this.socket.on("reconnect_failed", () => {
      console.log("reconnect_failed");
    });

    this.socket.on("ping", () => {
      console.log("ping");
    });

    this.socket.on("pong", ms => {
      console.log("pong");
    });

    this.socket.on("message", _message => {
      const message = JSON.parse(_message);

      console.log("constructor", _message);

      if (message.type !== "hello") {
        return;
      }

      // Hello message
      console.log(message.message);
    });
  }

  componentDidMount() {}

  componentDidUpdate() {}

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  componentWillUnmount() {}

  // NOTE:
  // This event handler is going to be called
  // when a new track was added to the PeerConnection.
  onRemoteTrackAdded(event) {
    console.log(
      "Track added event ====>",
      event.currentTarget === this.mediaRef
    );

    event.streams.forEach(stream => {
      const peer = this.state.peerConnection.find(
        peer => peer.PC === event.currentTarget
      );

      if (!peer || !peer.mediaRef.current) {
        console.error("Media element was not created yet");
        return;
      }

      if (peer.mediaRef.current.srcObject === stream) {
        console.log("already added stream\n");
        return;
      }

      try {
        peer.mediaRef.current.srcObject = stream;
      } catch (error) {
        peer.mediaRef.current.src = URL.createObjectURL(stream);
        console.log("Try to fallback method", peer.mediaRef.current.src);
      }
    });
  }

  parseCandidate(candidate) {
    if (!candidate) {
      console.log("There is no parsable candidate");
      return;
    }

    const [
      foundation,
      component,
      protocol,
      priority,
      address,
      port,
      ,
      type
    ] = candidate.split(" ");

    return {
      foundation: foundation.split(":")[1],
      component: component,
      protocol: protocol,
      priority: priority,
      address: address,
      port: port,
      type: type
    };
  }

  onIceCandidate(event) {
    // event.currentTarget === PC
    if (!event.candidate) {
      console.log("Candidate data is not available");
      return;
    }

    const info = this.parseCandidate(event.candidate.candidate);

    console.log(`Candidates: ${info.address}:${info.port}`);

    this.socket.send(
      JSON.stringify({ type: "ice", id: this.socket.id, ice: event.candidate })
    );
  }

  onReceiveDataChannel(event) {
    console.log(event);

    const dataChannel = event.channel;

    dataChannel.addEventListener("open", event => {
      console.log("Open data channel", event);
      dataChannel.send("Hello world!!! Am I connected?");
    });

    dataChannel.addEventListener("close", event => {
      console.log("Close data channel", event);
    });

    dataChannel.addEventListener("message", event => {
      console.log(event, "Receive data", event.data);
    });

    // dataChannel.readyState
    // dataChannel.send("Message");
    //
    // dataChannel.close();
    // dataChannel = null
  }

  createDataChannel(PC, label, channelId) {
    let option;
    let dataChannel;

    if (typeof channelId === "number") {
      option = {
        negotiated: true,
        id: channelId
      };
    }

    try {
      dataChannel = PC.createDataChannel(label, option);
    } catch (error) {
      console.error(error);
      return;
    }

    dataChannel.addEventListener("open", event => {
      console.log("Open data channel", event);
    });

    dataChannel.addEventListener("close", event => {
      console.log("Close data channel", event);
    });

    dataChannel.addEventListener("message", event => {
      console.log(event, "Receive data", event.data);
    });
  }

  async onIceCandidateChanged(PC, _message) {
    const message = JSON.parse(_message);

    if (message.type !== "ice" || message.id === this.socket.id) {
      return;
    }

    try {
      await PC.addIceCandidate(message.ice);
    } catch (error) {
      console.error(error);
    }
  }

  onIceConnectionStateChanged(event) {
    switch (event.currentTarget.iceConnectionState) {
      case "disconnected":
        const peer = this.state.peerConnection.find(peer => {
          return peer.PC === event.currentTarget;
        });

        if (!peer) {
          console.error("Event from unmanaged PC?");
          return;
        }

        this.destroyPeerInfo(peer);
        break;
      case "failed":
        // Restart the connection process
        break;
      case "connected":
        break;
      case "new":
        break;
      case "checking":
        break;
      case "completed":
        break;
      case "closed":
        break;
      default:
        console.log("onIceConnectionStateChanged", event.currentTarget, event);
        break;
    }
  }

  onIceGatheringStateChanged(event) {
    switch (event.currentTarget.iceGatheringState) {
      case "new":
        break;
      case "gathering":
        break;
      case "complete":
        break;
      default:
        console.log("onIceGatheringStateChanged", event.currentTarget, event);
        break;
    }
  }

  onSignallingStateChanged(event) {
    console.log(event.currentTarget, event);
  }

  onRemoveStream(event) {
    console.log(event.currentTarget, event);
  }

  onPeerIdentity(event) {
    console.log(event.currentTarget, event);
  }

  onNegotiationNeeded(event) {
    console.log(event.currentTarget, event);
  }

  onIdPValidationError(event) {
    console.log(event.currentTarget, event);
  }

  onIdPValidationError(event) {
    console.log(event.currentTarget, event);
  }

  onIdentityResult(event) {
    console.log(event.currentTarget, event);
  }

  onConnectionStateChange(event) {
    console.log(event.currentTarget, event);
  }

  createPC() {
    // Initialite the PeerConnections
    const configuration = {
      iceServers: [{ urls: [STUN_TURN_URL] }]
    };
    // { sdpSemantics: "" }; // default: {}, Unified Plan: {sdpSemantics: "unified-plan"}, Plan B: {sdpSemantics: "plan-b"}

    const PC = new RTCPeerConnection(configuration);

    PC.addEventListener("datachannel", this.onReceiveDataChannel.bind(this));

    PC.addEventListener(
      "icegatheringstatechange",
      this.onIceGatheringStateChanged.bind(this)
    );

    PC.addEventListener("icecandidate", this.onIceCandidate.bind(this));

    PC.addEventListener(
      "iceconnectionstatechange",
      this.onIceConnectionStateChanged.bind(this)
    );

    PC.addEventListener("track", this.onRemoteTrackAdded.bind(this));

    PC.addEventListener(
      "signallingstatechange",
      this.onSignallingStateChanged.bind(this)
    );

    PC.addEventListener("removestream", this.onRemoveStream.bind(this));
    PC.addEventListener("peeridentity", this.onPeerIdentity.bind(this));
    PC.addEventListener(
      "negotiationneeded",
      this.onNegotiationNeeded.bind(this)
    );
    PC.addEventListener(
      "idpvalidationerror",
      this.onIdPValidationError.bind(this)
    );
    PC.addEventListener(
      "idpassertionerror",
      this.onIdPValidationError.bind(this)
    );
    PC.addEventListener("identityresult", this.onIdentityResult.bind(this));
    PC.addEventListener(
      "connectionstatechange",
      this.onConnectionStateChange.bind(this)
    );

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection

    return PC;
  }

  createPeerInfo() {
    // Create the new WebRTCMedia component
    // when there is a new incoming stream.
    const mediaRef = React.createRef();
    const PC = this.createPC();
    const peer = {
      mediaRef: mediaRef,
      PC: PC,
      socketOnAnswer: this.onAnswer.bind(this, PC),
      socketOnIceCandidateChanged: this.onIceCandidateChanged.bind(this, PC),
      component: (
        <WebRTCMedia
          refs={{
            media: mediaRef
          }}
          key={this.state.peerConnection.length}
          muted={true}
          autoPlay={true}
          width={VIDEO_DEFAULT_WIDTH}
          height={VIDEO_DEFAULT_HEIGHT}
          poster={POSTER_IMAGE_SAMPLE}
        />
      )
    };

    this.socket.on("message", peer.socketOnIceCandidateChanged);
    this.socket.on("message", peer.socketOnAnswer);

    // Triggering the re-render of the container
    const peerConnection = [...this.state.peerConnection, peer];
    this.setState({ peerConnection: peerConnection });

    // Map the local media stream to the created Peer Connection
    const stream = this.mediaRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => PC.addTrack(track, stream));

    return peer;
  }

  destroyPeerInfo(peer) {
    const peerConnection = [...this.state.peerConnection];
    const idx = peerConnection.indexOf(peer);
    if (idx < 0) {
      console.log("There is no peer in the peerConnection");
      return;
    }

    peer.PC.close();
    peer.PC = null;

    this.socket.off("message", peer.socketOnIceCandidateChanged);
    this.socket.off("message", peer.socketOnAnswer);

    peerConnection.splice(idx, 1);
    this.setState({ peerConnection: peerConnection });

    return;
  }

  async onOfferRequested(_message) {
    const message = JSON.parse(_message);

    if (message.type !== "offer" || message.id === this.socket.id) {
      return;
    }

    const peer = this.createPeerInfo();

    this.createDataChannel(peer.PC, "hello", 1004);

    try {
      await peer.PC.setRemoteDescription(message.offer);
    } catch (error) {
      console.error(error);
      destroyPeerInfo(peer);
      return;
    }

    let answer;

    try {
      answer = await peer.PC.createAnswer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      });
    } catch (error) {
      console.error(error);
      destroyPeerInfo();
      return;
    }

    // Apply the description to the local and remote Peer Connections.
    try {
      await peer.PC.setLocalDescription(answer);
    } catch (error) {
      console.error(error);
      destroyPeerInfo(peer);
      return;
    }

    this.socket.send(
      JSON.stringify({ type: "answer", id: this.socket.id, answer: answer })
    );
  }

  async onAnswer(PC, _message) {
    const message = JSON.parse(_message);

    if (message.type !== "answer" || message.id === this.socket.id) {
      return;
    }

    try {
      await PC.setRemoteDescription(message.answer);
    } catch (error) {
      console.error(error);
    }
  }

  async onRequestOffer() {
    const peer = this.createPeerInfo();

    this.createDataChannel(peer.PC, "hello", 1004);

    let offer;

    try {
      offer = await peer.PC.createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      });
    } catch (error) {
      console.error(error);
      destroyPeerInfo(peer);
      return;
    }

    // Apply the description to the local and remote Peer Connections.
    try {
      await peer.PC.setLocalDescription(offer);
    } catch (error) {
      console.error(error);
      destroyPeerInfo(peer);
      return;
    }

    this.socket.send(
      JSON.stringify({ type: "offer", id: this.socket.id, offer: offer })
    );
  }

  async destroyMedia(mediaRef) {
    if (!mediaRef || !mediaRef.current) {
      console.error("Invalid mediaRef object");
      return;
    }

    try {
      const stream = mediaRef.current.srcObject;
      const tracks = stream.getTracks();

      console.log(
        "===============>",
        stream === this.mediaRef.current.srcObject
      );

      await mediaRef.current.pause();

      tracks.forEach(track => {
        track.stop();
      });

      mediaRef.current.srcObject = null;
    } catch (error) {
      console.error(error);
    }
  }

  async onStartStop() {
    if (this.mediaRef.current.srcObject) {
      try {
        this.socket.off("message", this.onOfferBinded);
        this.onOfferBinded = null;

        this.state.peerConnection.forEach(async peer => {
          await this.destroyMedia(peer.mediaRef);

          peer.PC.close();
          this.socket.off("message", peer.socketOnIceCandidateChanged);
          this.socket.off("message", peer.socketOnAnswer);

          peer.socketOnIceCandidateChanged = null;
          peer.socketOnAnswer = null;
          peer.mediaRef = null;
          peer.PC = null;
        });

        await this.destroyMedia(this.mediaRef);

        this.setState({ peerConnection: [] });
        return true;
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        // Get the stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });

        this.mediaRef.current.srcObject = stream;
        await this.mediaRef.current.play();

        this.onOfferBinded = this.onOfferRequested.bind(this);
        this.socket.on("message", this.onOfferBinded);

        return true;
      } catch (error) {
        console.error(error);
      }
    }

    return false;
  }

  render() {
    return (
      <>
        {this.state.peerConnection.map(peer => peer.component)}
        <WebRTCMedia
          refs={{
            media: this.mediaRef
          }}
          onStartStop={this.onStartStop.bind(this)}
          onOffer={this.onRequestOffer.bind(this)}
          muted={true}
          autoPlay={false}
          key={"local"}
          width={VIDEO_DEFAULT_WIDTH}
          height={VIDEO_DEFAULT_HEIGHT}
          poster={POSTER_IMAGE_SAMPLE}
        />
      </>
    );
  }
}

export default WebRTCMediaContainer;
