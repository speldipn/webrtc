import React from "react";
import { FormattedMessage } from "react-intl";
import Loading from "./Loading";
import "./WebRTCMedia.scss";

class WebRTCMedia extends React.Component {
  constructor(props) {
    super(props);

    let loading;
    if (props.autoPlay === true) {
      loading = (
        <Loading>
          <FormattedMessage id="ID_LOADING" />
        </Loading>
      );
    } else {
      loading = null;
    }

    this.state = {
      btnMsgId: "ID_START",
      loading: loading,
      currentTime: null
    };

    this.btnOfferRef = React.createRef();
    this.previousTime = null;

    this.mediaRef =
      (this.props.refs && this.props.refs.media) || React.createRef();
  }

  async onOffer(event) {
    if (this.btnOfferRef.current.disabled === true) {
      /* Do nothing if the button was disabled */
      return;
    }

    await this.props.onOffer();
  }

  async onStartStop(event) {
    let nextState;

    console.log("WebRTCMedia", "StartStop");

    if (this.state.btnMsgId === "ID_START") {
      this.setState({
        loading: (
          <Loading>
            <FormattedMessage id="ID_LOADING" />
          </Loading>
        )
      });
    }

    try {
      const ret = await this.props.onStartStop();
      if (!ret) {
        if (this.state.btnMsgId === "ID_START") {
          this.setState({ loading: null });
        }
        return;
      }
    } catch (error) {
      console.error(error);
      return;
    }

    if (this.state.btnMsgId === "ID_START") {
      this.btnOfferRef.current.disabled = false;
      this.setState({ btnMsgId: "ID_STOP", currentTime: 0 });
      this.previousTime = null;
    } else {
      this.btnOfferRef.current.disabled = true;
      this.setState({ btnMsgId: "ID_START", currentTime: null });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  mediaTimeUpdated(event) {
    if (!this.mediaRef.current) {
      console.log("mediaTimeUpdated", "DOM Element was deleted");
      return;
    }

    if (this.previousTime === null) {
      this.previousTime = this.mediaRef.current.currentTime;
      return;
    }

    this.setState({
      currentTime: this.mediaRef.current.currentTime - this.previousTime
    });
  }

  mediaPlaying(event) {
    if (!this.mediaRef.current) {
      console.log("mediaTimeUpdated", "DOM Element was deleted");
      return;
    }

    this.setState({
      loading: null
    });
  }

  mediaWaiting(event) {
    if (!this.mediaRef.current) {
      console.log("mediaTimeUpdated", "DOM Element was deleted");
      return;
    }

    this.setState({
      loading: (
        <Loading>
          <FormattedMessage id="ID_LOADING" />
        </Loading>
      )
    });
  }

  componentWillUnmount() {
    console.log("WebRTCMedia", "WillUnmount", this.mediaRef.current);
  }

  componentDidMount() {
    if (this.btnOfferRef.current) {
      // Do not add "disabled" attribute from the render function,
      // or every time it is going to be rendered,
      // the "disabled" attribute would be toggled.
      this.btnOfferRef.current.disabled = true;
    }

    this.mediaRef.current.addEventListener(
      "timeupdate",
      this.mediaTimeUpdated.bind(this)
    );

    this.mediaRef.current.addEventListener(
      "playing",
      this.mediaPlaying.bind(this)
    );

    this.mediaRef.current.addEventListener(
      "waiting",
      this.mediaWaiting.bind(this)
    );
  }

  componentDidUpdate() {}

  render() {
    let media;
    if (this.props.audioOnly === true) {
      media = (
        <audio
          className="WebRTCMedia Audio"
          autoPlay={this.props.autoPlay}
          controls={false}
          ref={this.mediaRef}
        >
          <p>Your browser doesn't support HTML5 audio</p>
        </audio>
      );
    } else {
      media = (
        <video
          className="WebRTCMedia Video"
          autoPlay={this.props.autoPlay}
          controls={false}
          playsInline={true}
          muted={this.props.muted}
          poster={this.props.poster}
          width={this.props.width}
          height={this.props.height}
          ref={this.mediaRef}
        >
          <p>Your browser doesn't support HTML5 video</p>
        </video>
      );
    }

    let playStatus;
    if (this.state.currentTime !== null) {
      const currentTime = Math.floor(this.state.currentTime);
      const hour = Math.floor(currentTime / 3600);
      const min = Math.floor((currentTime % 3600) / 60);
      const sec = currentTime % 60;
      let str = "";

      if (hour > 0) {
        str = `${hour}:${min}:${sec}`;
      } else if (min > 0) {
        str = `${min}:${sec}`;
      } else {
        str = `${sec}`;
      }

      // In this case, this.mediaRef.current is always valid
      playStatus = (
        <div className="WebRTCMedia Status">
          <div className="WebRTCMedia Status Item">
            <FormattedMessage id="ID_PLAY_TIME" />
            <span>{str}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="WebRTCMedia">
        {media}
        {this.state.loading}
        {playStatus}
        <div className="WebRTCMedia Ctrl">
          {this.props.onStartStop ? (
            <button
              className="WebRTCMedia Ctrl BtnStart"
              type="button"
              onClick={this.onStartStop.bind(this)}
            >
              <FormattedMessage id={this.state.btnMsgId} />
            </button>
          ) : null}
          {this.props.onOffer ? (
            <button
              className="WebRTCMedia Ctrl BtnOffer"
              type="button"
              ref={this.btnOfferRef}
              onClick={this.onOffer.bind(this)}
            >
              <FormattedMessage id="ID_OFFER" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }
}

export default WebRTCMedia;
