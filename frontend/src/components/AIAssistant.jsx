import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! 👋 I\'m your sushi menu assistant. Ask me about our menu items, find dishes by dietary preferences, or get recommendations!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState({ agent: false, rag: false, vectorStore: false });
  const messagesEndRef = useRef(null);

  // Check AI status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assistant/status`);
      setAiStatus(response.data);
    } catch (error) {
      console.error('Error checking AI status:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Use agent chat endpoint
      const response = await axios.post(`${API_URL}/api/assistant/chat`, {
        message: userMessage,
        history: messages.slice(1).map(msg => ({ // Exclude welcome message
          role: msg.role,
          content: msg.content
        }))
      });

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        toolsUsed: response.data.toolsUsed
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the AI services are running and try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const exampleQuestions = [
    "Show me spicy options",
    "What's vegetarian?",
    "What's under $10?",
    "Tell me about the Dragon Roll"
  ];

  const handleExampleClick = (question) => {
    setInput(question);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 flex items-center gap-2"
      >
        <span className="text-2xl">🤖</span>
        <span className="font-medium">Ask AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">🤖 Sushi Assistant</h3>
          <div className="text-xs text-indigo-100 flex gap-2 mt-1">
            <span className={aiStatus.agent ? "text-green-300" : "text-red-300"}>
              {aiStatus.agent ? "● Online" : "● Offline"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200 text-2xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.toolsUsed && message.toolsUsed.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2">
                  🔧 Used: {message.toolsUsed.map(t => t.tool).join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Example Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(question)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-700 transition"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about our menu..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading || !aiStatus.agent}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !aiStatus.agent}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {loading ? '...' : '→'}
          </button>
        </div>
        {!aiStatus.agent && (
          <p className="text-xs text-red-500 mt-2">
            AI services unavailable. Check backend logs.
          </p>
        )}
      </form>
    </div>
  );
}

export default AIAssistant;

