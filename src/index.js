import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Editor, EditorState, RichUtils } from 'draft-js';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      userName: '',
      editorState: EditorState.createEmpty(),
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

  onChange = (editorState) => {
    this.setState({ editorState });
  };

  handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(this.state.editorState, command);

    if (newState) {
      this.onChange(newState);
      return 'handled';
    }

    return 'not-handled';
  }

  onUnderlineClick = () => {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'UNDERLINE'));
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

        <button onClick={this.onUnderlineClick}>Underline</button>

        <Editor
          editorState={this.state.editorState}
          handleKeyCommand={this.handleKeyCommand}
          onChange={this.onChange}
        />

      </div >
    )
  }
}

ReactDOM.render(
  <App ref={(appComponent) => { window.appComponent = appComponent }} />,
  document.getElementById('root')
);
