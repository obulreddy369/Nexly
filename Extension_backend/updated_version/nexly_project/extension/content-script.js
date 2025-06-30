console.log('Content script loaded');

let popup = null;
let lastSelectedText = '';
let contextPort = null;

// --- Revamped Notification System ---
function notify(type, message) {
  console.log('Notify:', type, message);
  const notificationDiv = document.createElement('div');
  const icon = type === 'error' ? '❌' : '✅';
  const gradient = type === 'error' ?
    'linear-gradient(135deg, #f87171, #ef4444)' :
    'linear-gradient(135deg, #4ade80, #22c55e)';

  notificationDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 14px 22px;
    background: ${gradient};
    color: white;
    border-radius: 10px;
    z-index: 10002;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
    animation: slideInAndBounceNotify 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    max-width: 320px;
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  if (!document.getElementById('nexly-notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'nexly-notification-styles';
    styleSheet.textContent = `
      @keyframes slideInAndBounceNotify {
        from { transform: translateX(calc(100% + 20px)); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOutNotify {
        to { opacity: 0; transform: translateY(10px); }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  notificationDiv.innerHTML = `<span style="font-size: 1.2em;">${icon}</span> <span>${message}</span>`;
  document.body.appendChild(notificationDiv);

  setTimeout(() => {
    if (notificationDiv.parentNode) {
      notificationDiv.style.animation = 'fadeOutNotify 0.4s ease-out forwards';
      notificationDiv.addEventListener('animationend', () => notificationDiv.remove());
    }
  }, 4000);
}


function checkLoginStatus() {
  try {
    const credentials = localStorage.getItem('nexlyCredentials');
    if (credentials) {
      const { email } = JSON.parse(credentials);
      return { isLoggedIn: true, email };
    }
    return { isLoggedIn: false };
  } catch (err) {
    console.error('Error checking login status:', err);
    return { isLoggedIn: false };
  }
}

function establishConnection() {
  if (contextPort) {
    try {
      contextPort.disconnect();
    } catch (e) {}
  }

  try {
    contextPort = chrome.runtime.connect({ name: 'content-script' });
    console.log('Port connection established');

    contextPort.onDisconnect.addListener(() => {
      console.warn('Port disconnected. Error:', chrome.runtime.lastError?.message);
      contextPort = null;
      setTimeout(() => {
        if (isContextValid()) {
          console.log('Attempting to reconnect port...');
          establishConnection();
        } else {
          console.error('Cannot reconnect port, context is invalid.');
        }
      }, 1000);
    });

    contextPort.onMessage.addListener((message) => {
      console.log('Port message received:', message);
    });

  } catch (err) {
    console.error('Error establishing a port connection:', err);
    notify('error', 'Could not connect to extension background. Please try reloading the page.');
  }
}

function isContextValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.getManifest());
  } catch (e) {
    return false;
  }
}

async function sendMessageWithRetry(message, retries = 3) {
  return new Promise((resolve) => {
    const attemptSend = (attemptsLeft) => {
      if (!isContextValid()) {
        console.error('Extension context invalid, cannot send message.');
        return resolve({
          status: 'error',
          message: 'Invalid extension context. Please reload the page and try again.'
        });
      }

      try {
        chrome.runtime.sendMessage(message, (response) => {
          const lastError = chrome.runtime.lastError;
          if (lastError) {
            console.error('Error sending message:', lastError.message);
            if (lastError.message.includes('Receiving end does not exist') && attemptsLeft > 0) {
              console.log(`Retrying message send, ${attemptsLeft} attempts left.`);
              setTimeout(() => attemptSend(attemptsLeft - 1), 1000);
            } else {
              resolve({ status: 'error', message: lastError.message });
            }
          } else {
            resolve(response || { status: 'success' });
          }
        });
      } catch (err) {
        console.error('Exception sending message:', err);
        if (attemptsLeft > 0) {
          setTimeout(() => attemptSend(attemptsLeft - 1), 1000);
        } else {
          resolve({ status: 'error', message: `Send error: ${err.message}` });
        }
      }
    };
    attemptSend(retries);
  });
}

function getSelectionWithImages() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return '';
  }

  const selectedText = selection.toString().trim();
  const range = selection.getRangeAt(0);
  const fragment = range.cloneContents();
  const images = fragment.querySelectorAll('img');
  const imageUrls = [];

  images.forEach(img => {
    if (img.src) {
      const altText = img.alt || 'selected image';
      imageUrls.push(`![${altText}](${img.src})`);
    }
  });

  if (imageUrls.length > 0) {
    return `${selectedText}\n\n--- Captured Images ---\n${imageUrls.join('\n')}`.trim();
  }

  return selectedText;
}


function captureData() {
  console.log('Capturing data, lastSelectedText:', lastSelectedText);
  return {
    title: document.title || 'Untitled',
    url: location.href,
    content: document.body ? document.body.innerText.slice(0, 1000) : '',
    selectedText: lastSelectedText,
    timestamp: new Date().toISOString()
  };
}

async function captureAndSend(newFile = false, fileName = null, existingDescription = '', category = 'Documentation') {
  console.log('captureAndSend called, newFile:', newFile, 'fileName:', fileName, 'existingDescription:', existingDescription, 'category:', category);

  const data = captureData();
  data.newFile = newFile;
  if (fileName) data.fileName = fileName;

  const credentials = JSON.parse(localStorage.getItem('nexlyCredentials') || '{}');
  const email = credentials.email || '';

  if (!email) {
    notify('error', 'Please log in to continue.');
    return;
  }

  let title;
  let existingTags = [];
  if (!newFile && fileName) {
    try {
      const res = await fetch('https://qi3ulho30g.execute-api.us-east-1.amazonaws.com/prod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      const resource = parsed?.resources?.find(item => item.resourceId === fileName);
      existingTags = resource?.tags || [];
      title = resource?.title || fileName;
    } catch (err) {
      console.error('Error fetching existing tags:', err);
      notify('error', 'Failed to fetch existing resource data.');
      title = fileName;
    }
  } else {
    const rawFileName = data.fileName || `capture-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    title = rawFileName.replace(/\.txt$/, '');
  }

  const newTags = await generateTags(data.selectedText);
  const updatedTags = newFile ? ['web', 'capture', title.toLowerCase(), ...newTags] : [...new Set([...existingTags, ...newTags])];

  const structuredData = {
    email,
    category: category,
    title,
    description: newFile ? data.selectedText : `${existingDescription}\n\n${data.selectedText}`.trim(),
    tags: updatedTags,
    date: new Date().toISOString().split('T')[0],
    link: data.url,
    resourceId: newFile ? `res-${Date.now()}` : fileName
  };

  // --- ServiceNow API call (only for newFile) ---
  const serviceNowPromise = newFile ? (async () => {
    const corsProxy = 'https://cors-anywhere.herokuapp.com/';
    const serviceNowURL = 'https://dev279096.service-now.com/api/now/table/u_project';
    const auth = btoa('admin:6mhtBB2+mX-Z');
    try {
      await fetch(corsProxy + serviceNowURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          u_email: structuredData.email,
          u_name: structuredData.title,
          u_short_description: structuredData.description,
          u_tags: structuredData.tags.join(', '),
          u_category: structuredData.category,
        }),
      });
      console.log('ServiceNow API: Save successful');
    } catch (err) {
      console.error('ServiceNow API: Save failed', err);
    }
  })() : Promise.resolve();

  try {
    // AWS API call
    const awsPromise = fetch('https://tjn5komlkl.execute-api.us-east-1.amazonaws.com/prod', {
      method: newFile ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(structuredData),
    });

    // Run both in parallel
    const [awsRes, serviceNowRes] = await Promise.allSettled([awsPromise, serviceNowPromise]);

    let res, result;
    if (awsRes.status === 'fulfilled') {
      res = awsRes.value;
      result = await res.json();
    } else {
      throw new Error('AWS API call failed');
    }

    if (res.ok) {
      console.log('Save successful:', result);
      updateStorage(data.selectedText, title);
      notify('success', `Data successfully saved: ${title}`);
      if (popup) {
        popup.remove();
        popup = null; // Clean up reference
        document.body.style.marginRight = '0px';
        document.body.style.transition = 'margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      }
    } else {
      throw new Error(result.message || 'Unknown error occurred');
    }
  } catch (err) {
    console.error('Save failed:', err);
    notify('error', `Failed to save: ${err.message}`);
  }
}

async function generateTags(selectedText) {
  console.log('generateTags called with selectedText:', selectedText);
  if (!selectedText || selectedText.trim().length === 0) {
    console.warn('No valid selected text for tag generation, returning default tag');
    return ['default'];
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a tag generation expert. Generate 5-10 concise tags based on the provided text. Return tags as a comma-separated string.' },
          { role: 'user', content: `Generate main tags for this content: "${selectedText}"` }
        ],
        max_tokens: 200
      })
    });

    console.log('Tag API response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Tag API request failed:', response.status, response.statusText, errorText);
      notify('error', 'Failed to generate tags. Using default tag.');
      return ['default'];
    }

    const data = await response.json();
    console.log('Tag API raw response:', data);
    const tagsText = data.choices[0]?.message?.content || '';
    console.log('Parsed tags text:', tagsText);
    const tags = tagsText.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag && tag.length <= 50);
    const uniqueTags = [...new Set(tags)];
    console.log('Processed tags:', uniqueTags);

    if (uniqueTags.length === 0) {
      console.warn('No valid tags generated, returning default tag');
      return ['default'];
    }

    return uniqueTags.slice(0, 10);
  } catch (error) {
    console.error('Tag generation exception:', error);
    notify('error', `Failed to generate tags: ${error.message}. Using default tag.`);
    return ['default'];
  }
}

// --- CORRECTED: askAI function now cleans up the popup reference ---
async function askAI(selectedText) {
  if (!selectedText || selectedText.trim().length === 0) {
    notify('error', 'No text selected to analyze');
    return;
  }

  const loadingNotification = createLoadingNotification('AI is analyzing your text...');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a helpful assistant providing concise and accurate analysis.' },
          { role: 'user', content: `Analyze the following text: "${selectedText}"\n\nContext from page: Title: ${document.title}, URL: ${location.href}` }
        ],
        max_tokens: 500
      })
    });

    if (loadingNotification) loadingNotification.remove();

    if (!response.ok) {
      const errorText =
        await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'No analysis available.';
    
    // Close the sidebar popup first, then show the AI response
    if (popup) {
      popup.remove();
      popup = null; // THIS IS THE FIX: Nullify the global reference to prevent conflicts
      document.body.style.marginRight = '0px';
      document.body.style.transition = 'margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    showAIResponse(aiResponse);

  } catch (error) {
    console.error('AI request exception:', error);
    if (loadingNotification) loadingNotification.remove();
    notify('error', `Failed AI analysis: ${error.message}`);
  }
}

// --- Revamped Loading Notification ---
function createLoadingNotification(message) {
  const loadingDiv = document.createElement('div');
  loadingDiv.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 14px 22px;
    background: linear-gradient(135deg, #60a5fa, #3b82f6); color: white;
    border-radius: 10px; z-index: 10004; font-size: 14px; font-weight: 600;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1);
    backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; gap: 12px;
    animation: slideInAndBounceNotify 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  `;
  loadingDiv.innerHTML = `
    <div class="nexly-loader-dots">
      <div></div><div></div><div></div>
    </div>
    <span>${message}</span>
  `;
  if (!document.getElementById('nexly-loading-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'nexly-loading-styles';
    styleSheet.textContent = `
      .nexly-loader-dots { display: flex; gap: 4px; }
      .nexly-loader-dots div {
        width: 8px; height: 8px; background-color: white; border-radius: 50%;
        animation: bounce-loader 1.4s infinite ease-in-out both;
      }
      .nexly-loader-dots div:nth-child(1) { animation-delay: -0.32s; }
      .nexly-loader-dots div:nth-child(2) { animation-delay: -0.16s; }
      @keyframes bounce-loader {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1.0); }
      }
    `;
    document.head.appendChild(styleSheet);
  }
  document.body.appendChild(loadingDiv);
  return loadingDiv;
}

// --- CORRECTED: Revamped and fixed AI Response Modal ---
function showAIResponse(aiResponse) {
  const overlay = document.createElement('div');
  overlay.id = 'nexly-ai-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(17, 24, 39, 0.6);
    backdrop-filter: blur(8px);
    z-index: 10002;
    animation: fadeInOverlay 0.4s ease forwards;
  `;

  const responseDiv = document.createElement('div');
  responseDiv.id = 'nexly-ai-response-modal';
  responseDiv.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 90%; max-width: 600px;
    background: #fff;
    border-radius: 16px;
    z-index: 10003;
    box-shadow: 0 20px 40px rgba(0,0,0,0.25);
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: fadeInAndScaleUp 0.5s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeOutOverlay { from { opacity: 1; } to { opacity: 0; } } /* Added fade-out */
    @keyframes fadeInAndScaleUp {
      from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes fadeOutAndScaleDown {
      to { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
    }
  `;
  responseDiv.appendChild(styleSheet);

  responseDiv.innerHTML = `
    <div style="background: linear-gradient(135deg, #818cf8, #a78bfa); padding: 18px 24px; color: white; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <svg fill="currentColor" viewBox="0 0 24 24" style="width:24px;height:24px;"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L15,15L16,12L15,9L16.2,7.8L18,9V15L16.2,16.2M8,12V7.5L12,12L8,16.5V12Z" /></svg>
        <span style="font-weight: 600; font-size: 1.1em;">AI Analysis</span>
      </div>
      <button id="close-ai-response" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px; line-height: 0; transition: background 0.2s ease, transform 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='scale(1.1)';" onmouseout="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1)';">✕</button>
    </div>
    <div style="padding: 24px; max-height: 60vh; overflow-y: auto; line-height: 1.6; color: #374151;">
      <div style="background: #f3f4f6; border: 1px solid #e5e7eb; padding: 16px; border-radius: 10px; margin-bottom: 20px; font-size: 13px;">
        <strong style="color: #4f46e5; display: block; margin-bottom: 8px;">Selected Context:</strong>
        <p style="margin:0; max-height: 80px; overflow: hidden; text-overflow: ellipsis;">"${lastSelectedText}"</p>
      </div>
      <div style="font-size: 15px; white-space: pre-wrap;">${aiResponse}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(responseDiv);

  const escapeHandler = (e) => {
      if (e.key === 'Escape') closeModal();
  };
  
  const closeModal = () => {
    responseDiv.style.animation = 'fadeOutAndScaleDown 0.3s ease-out forwards';
    overlay.style.animation = 'fadeOutOverlay 0.3s ease-out forwards'; // Use correct fade-out
    document.removeEventListener('keydown', escapeHandler);
    
    // Remove elements after animation completes
    setTimeout(() => {
        if(responseDiv.parentNode) responseDiv.remove();
        if(overlay.parentNode) overlay.remove();
    }, 300); // Duration should match animation
  };

  // THIS IS THE FIX: Find the button within the newly created div to ensure we get the right one.
  const closeButton = responseDiv.querySelector('#close-ai-response');
  if (closeButton) {
      closeButton.addEventListener('click', closeModal);
  }

  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', escapeHandler);
}


function updateStorage(selectedText, fileName) {
  try {
    let history = JSON.parse(localStorage.getItem('captureHistory') || '[]');
    const newEntry = {
      selectedText: selectedText || '',
      timestamp: new Date().toISOString(),
      fileName: fileName || `capture-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`
    };
    history.unshift(newEntry);
    if (history.length > 50) history.pop();
    localStorage.setItem('captureHistory', JSON.stringify(history));
    localStorage.setItem('lastCaptured', JSON.stringify(newEntry));
    localStorage.setItem('tempSelection', selectedText || '');
    console.log('Storage updated:', newEntry);
  } catch (err) {
    console.error('LocalStorage error:', err);
    notify('error', `Storage error: ${err.message}`);
  }
}

async function createFloatingPopup(e) {
  console.log('Creating floating popup');
  if (popup) {
    console.log('Removing existing popup');
    popup.remove();
    document.body.style.marginRight = '0px';
    document.body.style.transition = 'margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
  }
  console.log('Captured selection for popup:', lastSelectedText);
  try {
    popup = document.createElement('div');
    popup.id = 'nexly-floating-popup';
    const shadowRoot = popup.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --brand-gradient: linear-gradient(135deg, #818cf8, #c084fc, #f472b6);
        --brand-color-1: #818cf8;
        --brand-color-2: #c084fc;
        --brand-color-3: #f472b6;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .nexly-popup-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: #f9fafb;
        border-left: 1px solid #e5e7eb;
        width: 380px;
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        animation: slideInWithEase 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .nexly-header {
        background: var(--brand-gradient);
        background-size: 200% 200%;
        padding: 18px 24px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 700;
        font-size: 18px;
        letter-spacing: 0.5px;
        flex-shrink: 0;
        animation: flow-gradient 6s ease infinite;
      }
      .nexly-content { padding: 20px; overflow-y: auto; flex-grow: 1; }
      .nexly-btn {
        width: 100%; padding: 14px 20px; border: none; border-radius: 10px;
        cursor: pointer; font-size: 15px; font-weight: 600;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        margin-bottom: 12px; display: flex; align-items: center; justify-content: center;
        gap: 10px; position: relative; overflow: hidden; letter-spacing: 0.3px;
      }
      .nexly-btn:last-child { margin-bottom: 0; }
      .nexly-btn:hover { transform: translateY(-4px) scale(1.02); }
      .nexly-btn-ai, .nexly-btn-secondary, .nexly-btn-tertiary { color: white; border: 1px solid rgba(255,255,255,0.15); }
      .nexly-btn-ai { background: linear-gradient(135deg, #f472b6, #e11d48); box-shadow: 0 5px 20px -5px rgba(225, 29, 72, 0.5); }
      .nexly-btn-ai:hover { box-shadow: 0 8px 25px -5px rgba(225, 29, 72, 0.6); }
      .nexly-btn-secondary { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 5px 20px -5px rgba(217, 119, 6, 0.5); }
      .nexly-btn-secondary:hover { box-shadow: 0 8px 25px -5px rgba(217, 119, 6, 0.6); }
      .nexly-btn-tertiary { background: linear-gradient(135deg, #38bdf8, #0ea5e9); box-shadow: 0 5px 20px -5px rgba(14, 165, 233, 0.5); }
      .nexly-btn-tertiary:hover { box-shadow: 0 8px 25px -5px rgba(14, 165, 233, 0.6); }
      
      .nexly-btn-back, .nexly-btn-close-btn {
        background: #fff; color: #4b5563; border: 1px solid #d1d5db;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-weight: 500;
      }
      .nexly-btn-back:hover, .nexly-btn-close-btn:hover {
        background: #f9fafb; border-color: #9ca3af;
        transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.08);
      }
      .nexly-selection-preview {
        background: #ffffff; border: 1px solid #e5e7eb;
        padding: 16px; margin-bottom: 20px; border-radius: 10px;
        max-height: 150px; overflow-y: auto; line-height: 1.5; color: #4b5563;
        font-size: 13px; white-space: pre-wrap; box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      }
      .nexly-selection-label {
        font-weight: 600; color: var(--brand-color-1); margin-bottom: 8px;
        display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px;
      }
      .nexly-icon { width: 20px; height: 20px; flex-shrink: 0; }
      .user-icon {
        width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
        background: rgba(255, 255, 255, 0.2); border: 2px solid rgba(255,255,255,0.4);
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        animation: pulse-avatar 3s infinite cubic-bezier(0.4, 0, 0.6, 1);
      }
      .user-icon:hover { transform: scale(1.1); box-shadow: 0 0 15px rgba(255, 255, 255, 0.6); }
      .nexly-list-container {
        margin-top: 16px; display: flex; flex-direction: column; gap: 8px;
      }
      .list-item-enter { animation: fadeInUp 0.5s ease-out both; }
      .nexly-list-header {
        font-size: 16px; font-weight: 600; color: #374151;
        margin-bottom: 16px; padding-bottom: 12px; text-align: center;
        border-bottom: 1px solid #e5e7eb;
      }
      .nexly-btn-file, .nexly-tag-btn, .nexly-category-btn {
        background: #fff; color: #374151; border: 1px solid #e5e7eb;
        justify-content: flex-start; box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        font-weight: 500; text-align: left;
      }
      .nexly-btn-file:hover, .nexly-tag-btn:hover, .nexly-category-btn:hover {
        border-color: var(--brand-color-1); color: var(--brand-color-1);
        box-shadow: 0 4px 10px -2px rgba(129, 140, 248, 0.2);
        transform: translateY(-3px) scale(1.01);
      }
      .nexly-tag-btn:disabled { opacity: 0.6; cursor: not-allowed; background: #f3f4f6; }
      .nexly-input {
        width: 100%; padding: 12px 16px; margin-bottom: 12px;
        border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px;
        color: #1f2937; transition: all 0.2s; background: #fff;
      }
      .nexly-input:focus {
        outline: none; border-color: var(--brand-color-1);
        box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.2);
      }
      .nexly-loader-shimmer {
        padding: 20px;
      }
      .nexly-loader-shimmer .line {
        height: 48px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%; animation: shimmer 1.5s infinite linear;
        border-radius: 8px; margin-bottom: 10px;
      }
      @keyframes slideInWithEase { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes flow-gradient {
        0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; }
      }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse-avatar {
        0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3); }
        50% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
      }
      @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    `;
    shadowRoot.appendChild(style);

    const popupContentDiv = document.createElement('div');
    popupContentDiv.className = 'nexly-popup-content';
    shadowRoot.appendChild(popupContentDiv);

    const nexlyContent = document.createElement('div');
    nexlyContent.className = 'nexly-content';

    const { isLoggedIn, email } = checkLoginStatus();

    const renderMainView = () => {
      popupContentDiv.innerHTML = `
        <div class="nexly-header">
          <span>Nexly Capture⚡</span>
          <div class="user-icon" id="user-avatar" title="${isLoggedIn ? `Logged in as ${email}` : 'Click to Login'}">
            <svg fill="currentColor" viewBox="0 0 24 24" style="width:20px;height:20px;color:white;"><path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" /></svg>
          </div>
        </div>
      `;
      nexlyContent.innerHTML = `
        ${lastSelectedText ? `
          <div class="nexly-selection-preview">
            <span class="nexly-selection-label">Your Selection</span>
            ${lastSelectedText.slice(0, 300)}${lastSelectedText.length > 300 ? '...' : ''}
          </div>` : '<div style="text-align:center; color:#6b7280; padding: 20px 0; font-style:italic;">No text selected.</div>'}
        <button class="nexly-btn nexly-btn-ai" id="ask-ai-btn"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L15,15L16,12L15,9L16.2,7.8L18,9V15L16.2,16.2M8,12V7.5L12,12L8,16.5V12Z" /></svg>Ask AI</button>
        ${isLoggedIn ? `
          <button class="nexly-btn nexly-btn-secondary" id="save-new-btn"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>Save to New File</button>
          <button class="nexly-btn nexly-btn-tertiary" id="save-existing-btn"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6M13,3.5L18.5,9H13V3.5M12,11H6V13H12V11M12,15H6V17H12V15Z" /></svg>Append to File</button>
        ` : ''}
        <button class="nexly-btn nexly-btn-close-btn" id="close-btn" style="margin-top: 12px;"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>Close</button>
      `;
      popupContentDiv.appendChild(nexlyContent);

      shadowRoot.getElementById('ask-ai-btn').addEventListener('click', () => askAI(lastSelectedText));
      if (isLoggedIn) {
        shadowRoot.getElementById('save-new-btn').addEventListener('click', renderTagSelectionView);
        shadowRoot.getElementById('save-existing-btn').addEventListener('click', renderFileListView);
      }
      shadowRoot.getElementById('close-btn').addEventListener('click', () => {
        popup.remove();
        popup = null;
        document.body.style.marginRight = '0px';
      });

      const avatar = shadowRoot.getElementById('user-avatar');
      if (isLoggedIn) {
        avatar.addEventListener('click', () => {
          if (confirm('Do you want to logout?')) {
            localStorage.removeItem('nexlyCredentials');
            chrome.storage.local.remove('nexlyCredentials');
            notify('success', 'Logged out successfully');
            popup.remove();
            popup = null;
            document.body.style.marginRight = '0px';
          }
        });
      } else {
        avatar.addEventListener('click', renderLoginView);
      }

      document.body.style.marginRight = '380px';
      document.body.style.transition = 'margin-right 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    };

    const renderLoginView = () => {
        popupContentDiv.innerHTML = `
        <div class="nexly-header">
          <span>Login to Nexly</span>
          <button id="close-login-btn" style="background:none;border:none;color:white;font-size:24px;cursor:pointer;transition:transform 0.2s; line-height:0;" onmouseover="this.style.transform='scale(1.1)';" onmouseout="this.style.transform='scale(1)';">✕</button>
        </div>
      `;
      nexlyContent.innerHTML = `
        <p style="text-align: center; color: #6b7280; margin-bottom: 20px;">Enter your email to log in and save your captures.</p>
        <input type="email" class="nexly-input" id="email" placeholder="you@example.com" required>
        <button class="nexly-btn nexly-btn-ai" id="login-submit-btn" style="background: linear-gradient(135deg, #818cf8, #a78bfa);">Login</button>
      `;
      popupContentDiv.appendChild(nexlyContent);

      shadowRoot.getElementById('login-submit-btn').addEventListener('click', async () => {
        const emailInput = shadowRoot.getElementById('email');
        if (emailInput.value) {
          const credentials = { email: emailInput.value };
          localStorage.setItem('nexlyCredentials', JSON.stringify(credentials));
          chrome.storage.local.set({ nexlyCredentials: JSON.stringify(credentials) }, () => {
            notify('success', 'Login successful!');
            popup.remove();
            popup = null;
            document.body.style.marginRight = '0px';
          });
        } else {
          notify('error', 'Please enter a valid email.');
          emailInput.focus();
        }
      });
      shadowRoot.getElementById('close-login-btn').addEventListener('click', () => {
        popup.remove();
        popup = null;
        document.body.style.marginRight = '0px';
      });
    };

    const renderFileListView = async () => {
      popupContentDiv.innerHTML = `
        <div class="nexly-header">
          <span>Append to File</span>
        </div>
      `;
      nexlyContent.innerHTML = `<div class="nexly-loader-shimmer"><div class="line"></div><div class="line"></div><div class="line"></div><div class="line" style="width: 70%;"></div></div>`;
      popupContentDiv.appendChild(nexlyContent);

      const credentials = JSON.parse(localStorage.getItem('nexlyCredentials') || '{}');
      const email = credentials.email || '';

      try {
        const res = await fetch('https://qi3ulho30g.execute-api.us-east-1.amazonaws.com/prod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const result = await res.json();
        const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
        const files = parsed?.resources?.map(item => ({
          resourceId: item.resourceId,
          title: item.title,
          description: item.description || ''
        })) || [];

        const filesHTML = files.length > 0
          ? files.map((file, index) => `<button class="nexly-btn nexly-btn-file list-item-enter" style="animation-delay: ${index * 70}ms" data-filename="${file.resourceId}" data-description="${file.description.replace(/"/g, '"')}"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M13,9V3.5L18.5,9H13Z" /></svg> ${file.title}</button>`).join('')
          : `<p style="text-align: center; color: #6b7280; padding: 20px 0;">No existing files found. Try "Save to New File" first.</p>`;

        nexlyContent.innerHTML = `
          <button class="nexly-btn nexly-btn-back" id="back-btn" style="justify-content:flex-start;"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>Back</button>
          <div class="nexly-list-header" style="margin-top: 20px;">Choose a file to append to</div>
          <div class="nexly-list-container">${filesHTML}</div>
        `;
        shadowRoot.querySelectorAll('.nexly-btn-file').forEach(button => {
          button.addEventListener('click', () => {
            const fileName = button.dataset.filename;
            const existingDescription = button.dataset.description || '';
            captureAndSend(false, fileName, existingDescription);
          });
        });
      } catch (err) {
        console.error('Error fetching files:', err);
        nexlyContent.innerHTML = `
          <button class="nexly-btn nexly-btn-back" id="back-btn" style="justify-content:flex-start;"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>Back</button>
          <p style="text-align: center; color: #ef4444; padding: 20px 0;">Error loading files. Please try again.</p>
        `;
      }
      shadowRoot.getElementById('back-btn').addEventListener('click', renderMainView);
    };

    const renderTagSelectionView = async () => {
      popupContentDiv.innerHTML = `
        <div class="nexly-header">
          <span>Create New File</span>
        </div>
      `;
      nexlyContent.innerHTML = `<div class="nexly-loader-shimmer"><div class="line"></div><div class="line"></div><div class="line"></div></div>`;
      popupContentDiv.appendChild(nexlyContent);

      try {
        const tags = await generateTags(lastSelectedText);
        const uniqueTags = [...new Set(tags)];
        const tagsHTML = uniqueTags.length > 0
            ? uniqueTags.map((tag, index) => {
                const sanitizedTag = tag.replace(/[<>"'\/\\|?*]/g, '').trim();
                return `<button class="nexly-btn nexly-tag-btn list-item-enter" style="animation-delay: ${index * 70}ms" data-tag="${sanitizedTag.replace(/"/g, '"')}" ${sanitizedTag ? '' : 'disabled'}>🏷️ ${sanitizedTag || 'Invalid Tag'}</button>`;
              }).join('')
            : `<p style="text-align: center; color: #6b7280; padding: 10px 0;">AI couldn't generate tags. Please enter a name manually.</p>`;
        
        nexlyContent.innerHTML = `
            <button class="nexly-btn nexly-btn-back" id="back-btn" style="justify-content:flex-start;"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>Back</button>
            <div class="nexly-list-header" style="margin-top: 20px;">Name Your New File</div>
            <input type="text" class="nexly-input" id="custom-file-name" placeholder="Or type a custom name...">
            <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 5px 0 15px;">Or use a suggested tag:</p>
            <div class="nexly-list-container">${tagsHTML}</div>
          `;
          shadowRoot.querySelectorAll('.nexly-tag-btn').forEach(button => {
            button.addEventListener('click', () => {
              if (!button.disabled) {
                const tag = button.dataset.tag;
                button.disabled = true;
                renderCategorySelectionView(tag);
              }
            });
          });
          shadowRoot.getElementById('custom-file-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              const fileName = e.target.value.replace(/[<>"'\/\\|?*]/g, '').trim();
              if (fileName) {
                e.target.disabled = true;
                renderCategorySelectionView(fileName);
              } else {
                notify('error', 'Please enter a valid file name');
              }
            }
          });
      } catch (err) {
        console.error('Error rendering tag selection view:', err);
        nexlyContent.innerHTML = `
          <button class="nexly-btn nexly-btn-back" id="back-btn" style="justify-content:flex-start;"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>Back</button>
          <div class="nexly-list-header" style="margin-top: 20px;">Name Your New File</div>
          <input type="text" class="nexly-input" id="custom-file-name" placeholder="Enter file name...">
          <p style="text-align: center; color: #ef4444; padding: 20px 0;">Error generating tags. Please enter a name manually.</p>
        `;
        shadowRoot.getElementById('custom-file-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const fileName = e.target.value.replace(/[<>"'\/\\|?*]/g, '').trim();
                if (fileName) {
                    e.target.disabled = true;
                    renderCategorySelectionView(fileName);
                } else {
                    notify('error', 'Please enter a valid file name');
                }
            }
        });
      }
      shadowRoot.getElementById('back-btn').addEventListener('click', renderMainView);
    };
    
    const renderCategorySelectionView = (fileName) => {
      popupContentDiv.innerHTML = `
        <div class="nexly-header">
          <span>Select Category</span>
        </div>
      `;
      nexlyContent.innerHTML = `
        <button class="nexly-btn nexly-btn-back" id="back-btn" style="justify-content:flex-start;"><svg class="nexly-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>Back</button>
        <div class="nexly-list-header" style="margin-top: 20px;">Choose a category for "${fileName}"</div>
        <div class="nexly-list-container">
          <button class="nexly-btn nexly-category-btn list-item-enter" style="animation-delay: 0ms" data-category="Documentation">📝 Documentation</button>
          <button class="nexly-btn nexly-category-btn list-item-enter" style="animation-delay: 70ms" data-category="Article">📰 Article</button>
          <button class="nexly-btn nexly-category-btn list-item-enter" style="animation-delay: 140ms" data-category="Other">🛠️ Other</button>
        </div>
      `;
      popupContentDiv.appendChild(nexlyContent);

      shadowRoot.querySelectorAll('.nexly-category-btn').forEach(button => {
        button.addEventListener('click', () => {
          const category = button.dataset.category;
          button.disabled = true;
          captureAndSend(true, fileName, '', category).finally(() => { button.disabled = false; });
        });
      });
      shadowRoot.getElementById('back-btn').addEventListener('click', renderTagSelectionView);
    };

    renderMainView();
    document.body.appendChild(popup);
    console.log('Floating popup created successfully');
  } catch (err) {
    console.error('Error creating popup:', err);
    notify('error', 'Failed to create popup');
  }
}

document.addEventListener('mouseup', (e) => {
  setTimeout(() => {
    if (e.target.closest('#nexly-floating-popup') || e.target.closest('#nexly-ai-response-modal')) return;

    const selection = getSelectionWithImages();
    if (selection.length > 5 && !popup) {
      lastSelectedText = selection;
      createFloatingPopup(e);
    }
  }, 50);
});

document.addEventListener('mousedown', (e) => {
  if (popup && !e.target.closest('#nexly-floating-popup')) {
    popup.remove();
    popup = null;
    document.body.style.marginRight = '0px';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popup) {
    popup.remove();
    popup = null;
    document.body.style.marginRight = '0px';
  }
});

chrome.storage.local.get(['nexlyCredentials'], (result) => {
  if (result.nexlyCredentials) {
    localStorage.setItem('nexlyCredentials', result.nexlyCredentials);
  }
});

establishConnection();