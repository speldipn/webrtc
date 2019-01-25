"use strict";

import React from "react";
import { connect } from "react-redux";
import io from "socket.io-client";

import { ConsoleLog, ConsoleError } from "../action";

import WebRTCMedia from "../component/WebRTCMedia";
import WebRTCMediaContainer from "./WebRTCMediaContainer";
import Error from "../component/Error";

const SOCKET_SERVER_ADDRESS = "https://futuremobile.net";
const VIDEO_DEFAULT_WIDTH = 240;
const VIDEO_DEFAULT_HEIGHT = 320;
const POSTER_IMAGE_SAMPLE =
  "https://www.authbridge.com/wp-content/uploads/2017/04/employee-background-screening-1-700x441.jpg";

class WebRTCContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      containerList: [],
      hasError: false,
      error: null,
      errorInfo: null
    };

    this.mediaRef = React.createRef();

    this.socket = io(SOCKET_SERVER_ADDRESS);

    this.socket.on("connect", () => {
      props.log("Connected");
    });

    this.socket.on("event", data => props.log(data));

    this.socket.on("disconnect", () => {
      props.log("Disconnected");
      this.socket = undefined;
    });

    this.socket.on("connect_error", error => {
      props.error(error);
    });

    this.socket.on("connect_timeout", () => {
      props.log("timeout");
    });

    this.socket.on("reconnect", attempt => {
      props.log("reconnect", attempt);
    });

    this.socket.on("reconnect_attempt", () => {
      props.log("reconnect_attempt");
    });

    this.socket.on("reconnecting", attempt => {
      props.log("reconnecting", attempt);
    });

    this.socket.on("reconnect_error", error => {
      props.error(error);
    });

    this.socket.on("reconnect_failed", () => {
      props.log("reconnect_failed");
    });

    this.socket.on("ping", () => {
      props.log("ping WebRTC");
    });

    this.socket.on("pong", ms => {
      props.log("pong WebRTC");
    });

    this.onOfferBinded = this.onOfferReceived.bind(this);

    this.containerId = 0;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
    this.setState({ hasError: true, error: error, errorInfo: info });
  }

  componentDidMount() {
    this.socket.on("message", this.onOfferBinded);
  }

  componentWillUnmount() {
    this.socket.off("message", this.onOfferBinded);
  }

  onOfferReceived(_message) {
    const message = JSON.parse(_message);

    if (
      message.type !== "WebRTC" ||
      message.op !== "offer" ||
      message.id === this.socket.id
    ) {
      return;
    }

    const container = {
      id: this.containerId,
      component: (
        <WebRTCMediaContainer
          autoPlay={true}
          muted={true}
          socket={this.socket}
          stream={this.mediaRef.current.srcObject}
          disconnected={this.disconnected.bind(this)}
          offer={message.offer}
          width={VIDEO_DEFAULT_WIDTH}
          height={VIDEO_DEFAULT_HEIGHT}
          poster={POSTER_IMAGE_SAMPLE}
          componentId={this.containerId}
          key={this.containerId}
        />
      )
    };

    // todo:
    // If the video is not started, send the sender answer "Callee is not ready"
    this.setState({
      containerList: [...this.state.containerList, container]
    });

    this.containerId++;
  }

  onRequestOffer() {
    const container = {
      id: this.containerId,
      component: (
        <WebRTCMediaContainer
          autoPlay={true}
          muted={true}
          socket={this.socket}
          stream={this.mediaRef.current.srcObject}
          disconnected={this.disconnected.bind(this)}
          width={VIDEO_DEFAULT_WIDTH}
          height={VIDEO_DEFAULT_HEIGHT}
          poster={POSTER_IMAGE_SAMPLE}
          componentId={this.containerId}
          key={this.containerId}
        />
      )
    };

    this.setState({
      containerList: [...this.state.containerList, container]
    });

    this.containerId++;
  }

  async onStartStop() {
    if (!this.mediaRef.current.srcObject) {
      // Start
      try {
        // Get the stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });

        this.mediaRef.current.srcObject = stream;
        await this.mediaRef.current.play();
        return true;
      } catch (error) {
        this.props.error("onStartStop start", error);
        return false;
      }
    } else {
      // Stop
      try {
        const stream = this.mediaRef.current.srcObject;
        if (!stream) {
          this.props.error("stream is already stopped");
          return false;
        }

        const tracks = stream.getTracks();

        await this.mediaRef.current.pause();

        tracks.forEach(track => {
          track.stop();
        });

        this.mediaRef.current.srcObject = null;

        this.setState({ containerList: [] });
        return true;
      } catch (error) {
        this.props.error("destroyMedia", error);
        return false;
      }
    }
  }

  disconnected(containerId) {
    this.props.log("disconnected", containerId);

    const idx = this.state.containerList.findIndex(
      container => container.containerId === containerId
    );
    if (idx < 0) {
      this.props.log("There is no peer in the peerConnection", containerId);
      return;
    }

    const containerList = [...this.state.containerList];

    containerList.splice(idx, 1);
    this.setState({ containerList: containerList });

    this.props.log("Disconnected", containerId);
    return;
  }

  render() {
    if (this.state.hasError === true) {
      return <Error error={this.state.error} info={this.state.errorInfo} />;
    }

    return (
      <>
        {this.state.containerList.map(container => container.component)}
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

const mapStateToProps = state => ({});

// To set null for the props.dispatch, pass the empty({}) object as the second parameter of the 'connect' function.
const mapDispatchToProps = {
  log: ConsoleLog,
  error: ConsoleError
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WebRTCContainer);
