//src/copilotpanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X } from 'lucide-react';

export const CopilotPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hi, I'm your AI Copilot powered by Groq! How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  // --- API KEY ---
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      // --- API CALL TO GROQ ---
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          model: 'llama3-8b-8192', // Same model as Chat.jsx
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message;

      if (assistantMessage) {
        const botMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: assistantMessage.content,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('Error:', err.message);
      setError(err.message);
      
      // Add error message to chat
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed top-0 right-0 w-full max-w-md h-screen bg-white dark:bg-[#0f0f11] border-l border-gray-200 dark:border-gray-700 shadow-xl z-[9999] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h2 className="text-sm font-semibold">AI Copilot</h2>
              <span className="text-xs text-green-200">Online</span>
            </div>
            <button onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 px-5 py-4 overflow-y-auto space-y-4 bg-[#f4f4f6] dark:bg-[#1a1c22]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-indigo-600' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                  }`}>
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm shadow-md ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-[#2d2f3b] text-gray-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="px-4 py-2 bg-white dark:bg-[#2d2f3b] rounded-2xl shadow-md">
                  <div className="flex gap-1 animate-pulse">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex justify-start">
                <div className="px-4 py-2 text-sm rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}
            
            <div ref={endRef} />
          </div>

          {/* Input Box */}
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f212a]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your copilot..."
                disabled={isTyping}
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-[#2a2d36] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CopilotPanel;