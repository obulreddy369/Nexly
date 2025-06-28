import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send } from 'lucide-react';
import { Box, Typography, Divider, IconButton, useMediaQuery } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Fix for ResizeObserver error in development
if (typeof window !== "undefined" && !window.__resizeObserverErrorPatched) {
  window.__resizeObserverErrorPatched = true;
  const origConsoleError = window.console.error;
  window.console.error = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes("ResizeObserver loop")) {
      return;
    }
    origConsoleError.apply(window.console, args);
  };
}

// Code block component with copy animation
const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const detectedLanguage = language || 'javascript';

  return (
    <Box sx={{ 
      position: 'relative', 
      my: 1.5, 
      backgroundColor: '#1e1e1e', 
      borderRadius: 2, 
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      '&:hover': { transform: 'scale(1.01)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        px: 2, 
        py: 0.5, 
        backgroundColor: '#2d2f3b' 
      }}>
        <Typography variant="caption" sx={{ color: '#ccc', textTransform: 'lowercase' }}>
          {detectedLanguage}
        </Typography>
        <IconButton onClick={copyToClipboard} size="small" sx={{ 
          color: copied ? '#4caf50' : '#fff',
          transition: 'transform 0.2s ease',
          '&:hover': { transform: 'scale(1.2)' }
        }}>
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Box>
      <SyntaxHighlighter 
        language={detectedLanguage} 
        style={atomDark} 
        customStyle={{ margin: 0, borderRadius: '0 0 8px 8px' }} 
        PreTag="div"
      >
        {String(code).replace(/\n$/, '')}
      </SyntaxHighlighter>
      {copied && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 8, 
          right: 8, 
          bgcolor: 'rgba(76, 175, 80, 0.9)', 
          color: 'white', 
          px: 1, 
          py: 0.5, 
          borderRadius: 1, 
          fontSize: '12px',
          animation: 'fadeInOut 2s ease'
        }}>
          Copied!
        </Box>
      )}
    </Box>
  );
};

// Formatted response component for markdown-like text
const FormattedResponse = ({ text }) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[2].trim(), language: match[1] || 'javascript' });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  const formatText = (content) => {
    return content.split('\n').map((line, index) => {
      const boldedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('### ')) {
        return <Typography key={index} variant="h6" component="h3" sx={{ mt: 1.5, mb: 1, fontWeight: '600' }} dangerouslySetInnerHTML={{ __html: boldedLine.substring(4) }} />;
      }
      if (line.startsWith('## ')) {
        return <Typography key={index} variant="h5" component="h2" sx={{ mt: 2, mb: 1.5, fontWeight: '700' }} dangerouslySetInnerHTML={{ __html: boldedLine.substring(3) }} />;
      }
      if (line.startsWith('# ')) {
        return <Typography key={index} variant="h4" component="h1" sx={{ mt: 2.5, mb: 2, fontWeight: '800' }} dangerouslySetInnerHTML={{ __html: boldedLine.substring(2) }} />;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={index} style={{ marginLeft: '20px' }} dangerouslySetInnerHTML={{ __html: boldedLine.substring(2) }} />;
      }
      if (line.match(/^(---|===)$/)) {
        return <Divider key={index} sx={{ my: 2 }} />;
      }
      return <p key={index} dangerouslySetInnerHTML={{ __html: boldedLine }} style={{ margin: 0, padding: 0 }} />;
    });
  };

  return (
    <Box sx={{ wordBreak: 'break-word', 'strong': { fontWeight: '700' } }}>
      {parts.map((part, index) => (
        <Box key={index} sx={{ animation: 'slideIn 0.5s ease forwards', animationDelay: `${index * 0.1}s`, opacity: 0 }}>
          {part.type === 'code' ? (
            <CodeBlock code={part.content} language={part.language} />
          ) : (
            formatText(part.content)
          )}
        </Box>
      ))}
    </Box>
  );
};

// Main Chat component
const initialMessages = [
  {
    content: "Hello! I'm your AI Copilot. I can help you with code, answer questions, or assist with your work. For example, try asking me to 'write a javascript function to sort an array'.",
    role: 'assistant',
  },
];

export const Chat = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage = { content: text, role: 'user' };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          model: 'llama3-8b-8192',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'An API error occurred.');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message;

      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-white dark:bg-[#0f0f11] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#2e2e33]">
      <style>
        {`
          @keyframes gradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes wave {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3); }
            50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6); }
            100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3); }
          }
        `}
      </style>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white animate-[gradientFlow_8s_ease_infinite] bg-[length:200%_200%] transition-transform hover:scale-[1.01]">
        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center transition-transform hover:scale-110">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-base tracking-tight">AI Copilot</h2>
          <p className="text-green-200 text-xs animate-pulse">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 bg-gradient-to-b from-[#f4f4f6] to-[#ebedf0] dark:from-[#1a1c22] dark:to-[#25272e]">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[slideIn_0.5s_ease_forwards]`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`flex items-start gap-3 max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110 ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`px-4 py-3 text-sm rounded-2xl shadow-lg transition-all hover:shadow-xl ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none dark:bg-[#2d2f3b] dark:text-white'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <FormattedResponse text={msg.content} />
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center transition-transform hover:scale-110">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 text-sm bg-white rounded-2xl shadow-lg dark:bg-[#2d2f3b] dark:text-white">
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i} 
                    className="w-2 h-2 bg-indigo-500 rounded-full animate-[wave_0.6s_ease_infinite]" 
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start animate-[shake_0.5s_ease]">
            <div className="px-4 py-3 text-sm rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 shadow-lg">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 py-4 bg-white dark:bg-[#1f212a] border-t border-gray-200 dark:border-[#2e2e33]">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask me anything..."
            className="flex-1 px-5 py-2.5 rounded-full bg-gray-100 text-sm text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-[#2a2d36] dark:text-white dark:border-[#3d3d42] transition-all focus:animate-[glow_2s_ease_infinite]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-110"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;