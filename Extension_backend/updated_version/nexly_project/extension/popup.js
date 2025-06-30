document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const captureBtn = document.getElementById('captureBtn');
    const copyModeSelect = document.getElementById('copyMode');
    const selectedTextarea = document.getElementById('selectedText');
    const statusDiv = document.getElementById('status');

    // --- Core Capture Logic ---
    const handleCapture = async () => {
        setLoading(true);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Error handling for restricted pages (e.g., chrome://, New Tab)
        if (!tab || !tab.id || tab.url.startsWith('chrome://') || tab.url.startsWith('https://chrome.google.com')) {
            updateStatus('Cannot capture content on this page.', 'error');
            setLoading(false);
            return;
        }

        const mode = copyModeSelect.value;
        const funcToInject = mode === 'selection' 
            ? () => window.getSelection()?.toString() || null
            : () => document.body?.innerText || null;

        try {
            // Execute the script on the active tab
            const [injectionResult] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: funcToInject,
            });

            const capturedText = injectionResult?.result;
            processCapturedContent(capturedText, mode);

        } catch (error) {
            console.error("Scripting Error:", error);
            updateStatus('Failed to access page content.', 'error');
            // This can happen if the page is still loading or has restrictions.
        } finally {
            setLoading(false);
        }
    };

    // --- Post-Capture Processing ---
    const processCapturedContent = (text, mode) => {
        if (!text || text.trim().length === 0) {
            const errorMessage = mode === 'selection' 
                ? 'No text selected on the page.' 
                : 'Could not find any text on the page.';
            updateStatus(errorMessage, 'error');
            return;
        }

        selectedTextarea.value = text;
        copyToClipboard(text);
    };

    // --- UI and Utility Functions ---
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            updateStatus('Captured and copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            updateStatus('Capture successful, but failed to copy.', 'error');
        }
    };
    
    const updateStatus = (message, type, duration = 3000) => {
        statusDiv.textContent = message;
        statusDiv.className = type; // Applies 'success' or 'error' class
        if (duration > 0) {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = '';
            }, duration);
        }
    };

    const setLoading = (isLoading) => {
        captureBtn.disabled = isLoading;
        if (isLoading) {
            captureBtn.classList.add('loading');
            captureBtn.dataset.originalText = captureBtn.innerHTML;
            captureBtn.innerHTML = ''; // Spinner is shown via CSS
        } else {
            captureBtn.classList.remove('loading');
            captureBtn.innerHTML = captureBtn.dataset.originalText || '📥 Capture & Copy';
        }
    };
    
    // --- Event Listeners ---
    captureBtn.addEventListener('click', handleCapture);
});