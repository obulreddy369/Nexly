console.log('Background script loaded');

// --- Port-based Communication for Keep-Alive ---
chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'content-script') {
    console.log('Content script connected.');
    port.onDisconnect.addListener(() => {
      console.log('Content script disconnected.');
      if (chrome.runtime.lastError) {
        console.error('Port disconnect error:', chrome.runtime.lastError.message);
      }
    });
  }
});

// --- Message Handling ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_DATA') {
    handleSaveData(message.payload, sendResponse);
    return true;
  }
  if (message.type === 'ASK_AI') {
    handleAskAI(message.payload, sendResponse);
    return true;
  }
  if (message.type === 'GET_FILES') {
    handleGetFiles(sendResponse);
    return true;
  }
  if (message.type === 'GENERATE_TAGS') {
    handleGenerateTags(message.payload, sendResponse);
    return true;
  }
  if (message.type === 'CHECK_LOGIN_STATUS') {
    handleCheckLoginStatus(sendResponse);
    return true;
  }
  if (message.type === 'LOGIN') {
    handleLogin(message.payload, sendResponse);
    return true;
  }

  console.warn('Unknown message type received:', message.type);
  return false;
});

// --- Save Data Handler ---
function handleSaveData(payload, sendResponse) {
  chrome.storage.local.get(['nexlyCredentials'], (result) => {
    const credentials = result.nexlyCredentials ? JSON.parse(result.nexlyCredentials) : {};
    const email = credentials.email || '';

    const finalPayload = {
      ...payload,
      email
    };

    fetch('http://localhost:5000/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload),
    })
    .then(res => {
      if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log('Backend save response:', data);
      sendResponse({ status: 'success', fileSaved: data.fileSaved });
    })
    .catch(err => {
      console.error('Save request failed:', err);
      sendResponse({ status: 'error', message: err.message });
    });
  });

  return true;
}

// --- Ask AI Handler ---
function handleAskAI(payload, sendResponse) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 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'
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'You are a helpful assistant providing concise and accurate analysis.' },
        { role: 'user', content: `Analyze the following text: "${payload.selectedText}"\n\nContext from page: Title: ${payload.context.title}` }
      ],
      max_tokens: 500
    }),
    signal: controller.signal
  })
  .then(async res => {
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API responded with ${res.status}: ${errorText}`);
    }
    return res.json();
  })
  .then(data => {
    const aiResponse = data.choices[0]?.message?.content || 'No analysis available.';
    sendResponse({ status: 'success', aiResponse });
  })
  .catch(err => {
    clearTimeout(timeoutId);
    console.error('AI request error:', err);
    const errorMessage = err.name === 'AbortError' ? 'Request timed out' : err.message;
    sendResponse({ status: 'error', message: `AI Error: ${errorMessage}` });
  });

  return true;
}

// --- Generate Tags Handler ---
function handleGenerateTags(payload, sendResponse) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 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'
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: 'You are a tag generation expert. Generate 5-10 concise tags...' },
        { role: 'user', content: `Generate main tags for this content: "${payload.selectedText}"` }
      ],
      max_tokens: 200
    }),
    signal: controller.signal
  })
  .then(async res => {
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API responded with ${res.status}: ${errorText}`);
    }
    return res.json();
  })
  .then(data => {
    const tags = data.choices[0]?.message?.content || 'No tags generated.';
    sendResponse({ status: 'success', tags });
  })
  .catch(err => {
    clearTimeout(timeoutId);
    console.error('Tag generation error:', err);
    const errorMessage = err.name === 'AbortError' ? 'Request timed out' : err.message;
    sendResponse({ status: 'error', message: `Tag Generation Error: ${errorMessage}` });
  });

  return true;
}

// --- Get Files Handler ---
function handleGetFiles(sendResponse) {
  fetch('http://localhost:5000/api/files')
    .then(res => {
      if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      sendResponse({ status: 'success', files: data.files });
    })
    .catch(err => {
      console.error('Get files failed:', err);
      sendResponse({ status: 'error', message: err.message });
    });

  return true;
}

// --- Check Login Status ---
function handleCheckLoginStatus(sendResponse) {
  chrome.storage.local.get(['nexlyCredentials'], (result) => {
    const isLoggedIn = !!result.nexlyCredentials;
    sendResponse({ status: 'success', isLoggedIn });
  });
  return true;
}

// --- Simulated Login ---
function handleLogin(payload, sendResponse) {
  const { username, password } = payload;

  if (username === 'test' && password === 'test') {
    chrome.storage.local.set({ nexlyCredentials: JSON.stringify({ email: username, password }) }, () => {
      sendResponse({ status: 'success' });
    });
  } else {
    sendResponse({ status: 'error', message: 'Invalid credentials' });
  }

  return true;
}

// --- Lifecycle Logging ---
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser startup.');
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed or updated:', details.reason);
});
