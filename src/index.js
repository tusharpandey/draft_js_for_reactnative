import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {
  Editor, EditorState, RichUtils,
  CharacterMetadata, ContentBlock,
  genKey, ContentState, convertFromHTML, convertToRaw, SelectionState
} from 'draft-js';
import './index.css';
import { Repeat, List } from 'immutable';
import { stateToHTML } from 'draft-js-export-html';

class App extends Component {

  constructor(props) {
    super(props);
    this.editorRef = React.createRef()
    this.state = {
      editorState: EditorState.createEmpty(),
      placeholder: ''
    }
  }

  setPlaceHolder = (placeholder) => {
    this.setState({ placeholder: placeholder })
  }

  onChange = (editorState) => {
    console.log(JSON.stringify(this.state.editorState));
    this.setState({ editorState }, () => {
      this.getText()
    });
  };

  // componentDidMount() {
  //   // this.addBulletList(["fsdf", "sdfdsfsd", "sdfdsf"])
  //   // setTimeout(() => { this.addBullet("<li>hello</li>") }, 4000)
  //   setTimeout(() => {
  //     this.toggleBulletPoints()
  //   }, 2000)
  // }

  getText = () => {
    const editorState = this.state.editorState;
    let html = stateToHTML(editorState.getCurrentContent());
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'GET_TEXT', text: html }));
  }

  setHtml = (html) => {
    const blocksFromHTML = convertFromHTML(html)
    const content = ContentState.createFromBlockArray(blocksFromHTML)
    this.setState({
      editorState: EditorState.createWithContent(content)
    }, () => {
      this.moveSelectionToEnd()
    })
  }

  //accepts input as = ["hello","how","are","you"]
  addBulletList = (input) => {
    let contentBlocksArray = input.map(word => {
      return new ContentBlock({
        key: genKey(),
        type: 'unordered-list-item',
        characterList: new List(Repeat(CharacterMetadata.create(), word.length)),
        text: word
      });
    });
    this.setState({
      editorState: EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocksArray))
    }, () => {
      this.moveSelectionToEnd()
    });
  }

  // accepts input as = ["hello","how","are","you"]
  addList = (input) => {
    let contentBlocksArray = input.map(word => {
      return new ContentBlock({
        key: genKey(),
        type: 'unstyled',
        characterList: new List(Repeat(CharacterMetadata.create(), word.length)),
        text: word
      });
    });
    this.setState({
      editorState: EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocksArray))
    }, () => {
      this.moveSelectionToEnd()
    });
  }

  // accepts input as = "<li>hello</li>"
  addBullet(bulletsHTML) {
    const editorState = this.state.editorState;
    const newBlockMap = convertFromHTML(bulletsHTML);
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const key = selectionState.getAnchorKey();

    const blocksAfter = contentState.getBlockMap().skipUntil(function (_, k) {
      return k === key;
    }).skip(1).toArray();
    const blocksBefore = contentState.getBlockMap().takeUntil(function (_, k) {
      return k === key;
    }).toArray();

    newBlockMap.contentBlocks =
      blocksBefore
        .concat([contentState.getBlockForKey(key)])
        .concat(newBlockMap.contentBlocks)
        .concat(blocksAfter);

    const newContentState =
      ContentState.createFromBlockArray(newBlockMap, newBlockMap.entityMap);
    const newEditorState = EditorState.createWithContent(newContentState);

    this.setState({ editorState: newEditorState }, () => {
      this.moveSelectionToEnd()
    });
  }

  handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(this.state.editorState, command);

    if (newState) {
      this.onChange(newState);
      return 'handled';
    }

    return 'not-handled';
  }

  getEditorState = () => {
    return this.state.editorState
  }

  onUnderlineClick = () => {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'UNDERLINE'));
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'UNDERLINE' }));
  }

  onBoldClick = () => {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, "BOLD"));
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'BOLD' }));
  };

  onItalicClick = () => {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, "ITALIC"));
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'ITALIC' }));
  };

  toggleBulletPoints = () => {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, 'unordered-list-item'))
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'unordered-list-item' }));
  }

  handlePastedText = () => {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'handlePastedText' }));
  }

  onBlur = () => {
    document.activeElement.blur();
  }

  moveSelectionToEnd = () => {
    this.setState({
      editorState: EditorState.moveSelectionToEnd(this.state.editorState),
    });
  }

  focusManually = () => {
    this.editorRef.current.focus()
  }

  shouldHidePlaceholder = () => {
    const contentState = this.state.editorState.getCurrentContent();
    return (
      contentState.hasText() ||
      contentState
        .getBlockMap()
        .first()
        .getType() !== 'unstyled'
    );
  }

  render() {
    this.shouldHidePlaceholder()
    return (
      <div style={{ marginLeft: 10, marginRight: 10 }}>
        <Editor
          ref={this.editorRef}
          editorState={this.state.editorState}
          handleKeyCommand={this.handleKeyCommand}
          onChange={this.onChange}
          handlePastedText={() => { this.handlePastedText() }}
          placeholder={this.shouldHidePlaceholder() ? undefined : this.state.placeholder}
        />
      </div >
    )
  }
}

ReactDOM.render(
  <App ref={(appComponent) => { window.appComponent = appComponent }} />,
  document.getElementById('root')
);
