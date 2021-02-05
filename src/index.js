import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {
  Editor, EditorState, RichUtils,
  CharacterMetadata, ContentBlock,
  genKey, ContentState, convertFromHTML
} from 'draft-js';
import './index.css';
import { Repeat, List } from 'immutable';
import { convertToHTML } from 'draft-convert';
import {
  getContentStateUsingDraftConvertLib,
  convertFromHTMLUsingDraftConvertLib,
  convertContentStateToHTMLUsingDraftConvertLib
} from './helper';

class App extends Component {

  constructor(props) {
    super(props);
    this.editorRef = React.createRef()
    this.state = {
      editorState: EditorState.createEmpty(),
      placeholder: ''
    }
  }

  scrollToBottom = () => {

    let maxOffSet = 0
    let elements = document.querySelectorAll('*');
    let className = ''

    let parent = undefined
    let container = undefined
    let child = undefined

    for (let i = 0; i < elements.length; i++) {
      let item = elements[i]
      if (item.className === "DraftEditor-root") {
        parent = item
      }
      if (item.className === "public-DraftStyleDefault-ul") {
        container = item
      }

      if (item.offsetTop > maxOffSet) {
        maxOffSet = item.offsetTop
        className = item.className
        child = item
      }
      // console.log(item.className + " : " + item.offsetTop);
    }
    console.log("maxOffSet : " + maxOffSet);
    console.log(parent.className + " : " + parent.offsetTop);
    console.log(container.className + " : " + container.offsetTop);
    console.log(child.className + " : " + child.offsetTop);

    child.scrollIntoView({ behavior: 'smooth' });
  }

  // componentDidMount() {
  //   setTimeout(() => { this.addBullet("<li>hello</li>") }, 2000)
  // }

  setPlaceHolder = (placeholder) => {
    this.setState({ placeholder: placeholder })
  }

  onChange = (editorState) => {
    // console.log("onChangeCalled");
    let contentState = editorState.getCurrentContent()

    let text = convertContentStateToHTMLUsingDraftConvertLib(contentState)
    let inlineStyle = editorState.getCurrentInlineStyle()
    let blockType = contentState.getBlockForKey(editorState.getSelection().getAnchorKey()).getType()

    this.setState({ editorState }, () => {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        action: 'GET_TEXT',
        text: text,
        inlineStyle: inlineStyle,
        blockType: blockType
      }));
    });
  };

  insertTextInNewLine(text) {
    this.moveSelectionToEnd()
    const editorState = this.state.editorState;
    let contentState = getContentStateUsingDraftConvertLib(editorState, text)
    let newEditorState = EditorState.createWithContent(contentState)
    this.setState({ editorState: newEditorState }, () => {
      this.onChange(this.state.editorState)
    });
  }

  getText(editorState) {

    const inlineStyle = editorState.getCurrentInlineStyle();

    const selectionState = editorState.getSelection();
    const key = selectionState.getAnchorKey();

    let blockType = editorState.getCurrentContent().getBlockForKey(key).getType()
    let html = convertToHTML(editorState.getCurrentContent());

    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
      action: 'GET_TEXT',
      text: html,
      editorState: editorState,
      inlineStyle: inlineStyle,
      blockType: blockType
    }));
  }

  setHtml = (html) => {
    const blocksFromHTML = convertFromHTMLUsingDraftConvertLib(html)
    // const content = ContentState.createFromBlockArray(blocksFromHTML)
    this.setState({
      editorState: EditorState.createWithContent(blocksFromHTML)
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
    this.moveSelectionToEnd()
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

    // contentState.hasText() ?

    newBlockMap.contentBlocks =
      blocksBefore
        .concat(contentState.hasText() ? [contentState.getBlockForKey(key)] : [])
        .concat(newBlockMap.contentBlocks)
        .concat(blocksAfter);

    const newContentState =
      ContentState.createFromBlockArray(newBlockMap, newBlockMap.entityMap);
    const newEditorState = EditorState.createWithContent(newContentState);
    // console.log("newEditorState : " + JSON.stringify(newEditorState));
    this.setState({ editorState: newEditorState }, () => {
      this.onChange(this.state.editorState)
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
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'onBlur' }));
  }

  onFocus = () => {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ action: 'onFocus', isEmpty: this.shouldHidePlaceholder() }));
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
    return (
      <div onClick={this.focusManually}>
        <div
          style={{ paddingLeft: 16, paddingRight: 16 }}>
          <Editor
            ref={this.editorRef}
            onBlur={this.onBlur}
            onFocus={this.onFocus}
            editorState={this.state.editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
            handlePastedText={() => { this.handlePastedText() }}
            placeholder={this.shouldHidePlaceholder() ? undefined : this.state.placeholder}
          />
        </div >
      </div>
    )
  }
}

ReactDOM.render(
  <App ref={(appComponent) => { window.appComponent = appComponent }} />,
  document.getElementById('root')
);
