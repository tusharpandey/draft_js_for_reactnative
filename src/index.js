import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      userName: ''
    }
  }

  setUserName(name) {
    this.setState({ userName: name })
  }

  onClickEvent = () => {
    window.ReactNativeWebView.postMessage(JSON.stringify({ userName: this.state.userName }));
  }

  myChangeHandler = (event) => {
    this.setState({ userName: event.target.value });
  }

  render() {
    return (
      <div className="App">
        <h1>{`i am ${this.state.userName}`}</h1>
        <input
          type='text'
          onChange={this.myChangeHandler}
        />
        <button
          className="btn btn-default"
          style={{ padding: 10, margin: 10 }}
          onClick={this.onClickEvent}>{"Get User Name Back"}</button>
      </div >
    )
  }
}

ReactDOM.render(
  <App ref={(appComponent) => { window.appComponent = appComponent }} />,
  document.getElementById('root')
);
