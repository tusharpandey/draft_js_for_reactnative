import { convertToHTML, convertFromHTML } from 'draft-convert';

export function getContentStateUsingDraftConvertLib(editorState, text) {
    let currentHTML = convertToHTML(editorState.getCurrentContent());
    if (currentHTML === '<p></p>') currentHTML = ""
    return convertFromHTML(currentHTML + text);
}

export function convertFromHTMLUsingDraftConvertLib(html) {
    return convertFromHTML(html)
}

export function convertContentStateToHTMLUsingDraftConvertLib(contentState) {
    return convertToHTML(contentState);
}