import React from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FloatingChatbotProps {
  showChatbot: boolean;
  setShowChatbot: (show: boolean) => void;
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatInput: string;
  setChatInput: (input: string) => void;
  chatLoading: boolean;
  sendChatMessage: () => void;
  clearChat: () => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

export default function FloatingChatbot({
  showChatbot,
  setShowChatbot,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  sendChatMessage,
  clearChat,
  chatEndRef,
}: FloatingChatbotProps) {
  if (!showChatbot) return null;

  const quickReply = async (message: string) => {
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);

    try {
      const response = await fetch('/ai/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ message, history: chatMessages }),
      });

      const data = await response.json();
      if (data.success && data.message) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  return (
    <div className="fixed right-6 bottom-24 z-50 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ring-2 ring-purple-500/20 dark:ring-purple-500/40 flex flex-col border-2 border-purple-200 dark:border-gray-700 animate-[slideIn_0.3s_ease-out]" style={{ maxHeight: '600px' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-purple-600 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">LogyAI Assistant</h3>
              <p className="text-xs text-purple-100">Online - Siap membantu</p>
            </div>
          </div>
          <button
            onClick={() => setShowChatbot(false)}
            className="rounded-lg p-2 hover:bg-white/20 transition-colors"
            title="Minimize"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/30" style={{ minHeight: '300px', maxHeight: '400px' }}>
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-lg">
              <span className="text-4xl">💬</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">Selamat datang!</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 px-4">Tanya apa saja tentang logbook, matematika, coding, atau apapun!</p>
            </div>
            <div className="flex flex-col gap-2 w-full px-2">
              <button
                onClick={() => quickReply('Cara pakai AI Saran')}
                className="px-4 py-2 text-sm rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
              >
                💡 Cara pakai AI Saran
              </button>
              <button
                onClick={() => quickReply('Contoh judul yang baik')}
                className="px-4 py-2 text-sm rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
              >
                📝 Contoh judul yang baik
              </button>
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%]`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🤖</span>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">LogyAI</span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-tr-sm shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border-2 border-gray-300 dark:border-gray-600 rounded-tl-sm shadow-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex justify-end mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">You</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🤖</span>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">LogyAI</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 rounded-b-2xl">
        <div className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
              }
            }}
            placeholder="Tanya apa saja..."
            disabled={chatLoading}
            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 pl-4 pr-20 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 transition-all bg-gray-50 dark:bg-gray-700/50 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={sendChatMessage}
            disabled={chatLoading || !chatInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-xs font-bold text-white hover:from-purple-600 hover:to-indigo-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {chatLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Kirim</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>💡 Enter untuk kirim</span>
          {chatMessages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold transition-colors"
            >
              🗑️ Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
