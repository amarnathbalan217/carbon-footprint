import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, Sparkles, Loader2, AlertCircle, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const Chatbot: React.FC = () => {
  const { language, t: globalT } = useLanguage();

  const t = globalT.chatbot;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t.welcome
    }
  ]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'assistant') {
            return [{ ...prev[0], content: t.welcome }];
        }
        return prev;
    });
  }, [language, t.welcome]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const SUGGESTED_PROMPTS = [
    "How can I reduce my daily carbon emissions?",
    "What's the carbon footprint of traveling by plane vs train?",
    "Give me some low-carbon meal ideas.",
    "How do I calculate my household's carbon footprint?"
  ];

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim().length > 10) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
      setShowApiKeyInput(false);
      setError('');
    } else {
      setError('Please enter a valid API key');
    }
  };

  const generateResponse = async (userMessage: string) => {
    try {
      const currentKey = localStorage.getItem(API_KEY_STORAGE_KEY);

      if (!currentKey) {
        setError(language === 'ml' ? 'API കീ കാണുന്നില്ല. പ്രൊഫൈലിൽ അത് നൽക്കുക.' : 'API Key is missing. Please set it in Profile > AI Settings.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      const genAI = new GoogleGenAI({ apiKey: currentKey });

      const prompt = `${language === 'ml'
        ? 'You are a Carbon Tracking assistant. Respond in Malayalam.'
        : 'You are a Carbon Tracking assistant. Respond in English.'}\n\nUser Question: ${userMessage}`;

      const result = await (genAI as any).models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const aiText = result && result.text ? result.text : "";

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiText || (language === 'ml' ? "ക്ഷമിക്കണം, എനിക്ക് ഇപ്പോൾ മറുപടി നൽകാൻ കഴിയുന്നില്ല." : "I'm sorry, I couldn't generate a response at this moment.")
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Gemini API Error:', err);

      // Robust error detection for different SDK error formats
      const errorStr = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
      const status = err.status || 0;

      if (errorStr.includes('API key not valid') || errorStr.includes('API_KEY_INVALID') || status === 400 || status === 403) {
        setError(language === 'ml' ? 'നിങ്ങളുടെ API കീ തെറ്റാണ്. പ്രൊഫൈലിൽ പോയി അത് മാറ്റുക.' : 'Your Gemini API key is invalid. Please update it in Profile > AI Settings.');
      } else if (errorStr.includes('quota') || status === 429) {
         setError(language === 'ml' ? 'പരിധി കഴിഞ്ഞു. അൽപ്പസമയത്തിന് ശേഷം വീണ്ടും ശ്രമിക്കൂ.' : 'Usage limit reached. Please try again later.');
      } else {
         setError(language === 'ml' ? `കണക്ഷൻ എറർ: ${errorStr.substring(0, 50)}...` : `Connection Error: ${errorStr.substring(0, 50)}...`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    generateResponse(newUserMessage.content);
  };

  const handlePromptClick = (prompt: string) => {
    if (isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt
    };

    setMessages((prev) => [...prev, newUserMessage]);
    generateResponse(prompt);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-emerald-700 hover:scale-105 transition-all duration-200 z-50"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-h-[600px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[calc(100vh-8rem)] z-50 sm:right-6 sm:bottom-24 right-0 bottom-0 w-full sm:w-96 sm:h-[600px] h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-emerald-50 dark:bg-emerald-900/20 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Carbon Assistant</h2>
            </div>
          </div>

      {showApiKeyInput ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-md w-full">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Setup AI Assistant</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                  {language === 'ml'
                    ? 'ഈ ഫീച്ചർ ഉപയോഗിക്കാൻ Gemini API കീ നൽക്കുക. ഇത് നിങ്ങളുടെ ബ്രൗസറിൽ മാത്രമേ സൂക്ഷിക്കൂ.'
                    : 'Enter your Gemini API key to enable the intelligent chatbot features. Your key is stored locally in your browser.'}
                </p>

                <form onSubmit={handleApiKeySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gemini API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-900 dark:text-white"
                      placeholder="AIzaSy..."
                    />
                    {error && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/> {error}</p>}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    {language === 'ml' ? 'സേവ് ചെയ്യുക' : 'Save & Continue'}
                  </button>
                </form>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 max-w-[80%] ${
                  message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {message.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div
                  className={`p-3 rounded-xl whitespace-pre-wrap text-sm ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600 mr-2" />
                  Generating response...
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800/50">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {messages.length === 1 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">{t.suggested}:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 dark:bg-gray-900 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </>
      )}
        </div>
      )}
    </>
  );
};
