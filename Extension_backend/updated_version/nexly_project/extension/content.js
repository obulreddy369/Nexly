chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getSelection') {
    const selection = window.getSelection().toString();
    sendResponse({ selection: selection });
  }
});
