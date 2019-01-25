"use strict";

//import logo from "./logo.svg";
import React, { Component } from "react";
import "./App.css";

import STANDBY_IMAGE from "./chat-standby-image.jpg";
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 240;
const STUN_URL = "stun:stun.l.google.com:19302";
//const videoURL =
// "https://s3.ap-northeast-2.amazonaws.com/wizschool-class-videos/default.mp4";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isStart: false,
      count: 0
    };

    this.onClickedStart = this.onClickedStartBtn.bind(this);
    this.onClickedStop = this.onClickedStopBtn.bind(this);

    this.mediaRef = React.createRef();
  }

  async onClickedStartBtn() {
    if (this.mediaRef.current.srcObject) {
      this.mediaRef.current.play();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });

        this.mediaRef.current.srcObject = stream;
        await this.mediaRef.current.play();
      } catch (error) {
        console.error(error);
      }
    }
    this.setState({
      isStart: !this.state.isStart
    });
  }

  async onClickedStopBtn() {
    await this.mediaRef.current.pause();

    this.setState({
      isStart: !this.state.isStart
    });
  }

  async componentDidMount() {
    console.log("componentDidMount called");
  }

  componentDidUpdate() {
    console.log("componentDidupdate called");
  }

  componentWillUnmount() {
    console.log("componentWillUnmount called");
  }

  render() {
    return (
      <div className="App">
        <video
          ref={this.mediaRef}
          width={DEFAULT_WIDTH}
          height={DEFAULT_HEIGHT}
          poster={STANDBY_IMAGE}
        />
        <source src={this.mediaRef} />
        {this.state.isStart ? (
          <button className="Start_Button" onClick={this.onClickedStop}>
            STOP
          </button>
        ) : (
          <button className="Stop_Button" onClick={this.onClickedStart}>
            START
          </button>
        )}
      </div>
    );
  }
}

export default App;
