
import React, { useState } from 'react';
import { LanguageLevel } from './types';
import { simplifyText } from './services/geminiService';
import LevelSelector from './components/LevelSelector';
import Spinner from './components/common/Spinner';

// A simple icon for the header
const BotIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-400 bg-gray-700 rounded-full p-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
    </svg>
);

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>(LanguageLevel.B1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedLevel) {
      setError('Please enter text to simplify and select a level.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutputText('');

    try {
      const simplified = await simplifyText(inputText, selectedLevel);
      setOutputText(simplified);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center font-sans p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8">
          <header className="flex items-center mb-6">
            <BotIcon />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-cyan-400">English Text Simplifier</h1>
              <p className="text-sm text-gray-400">Web UI & Telegram Bot</p>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="input-text" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter text to simplify:
                </label>
                <textarea
                  id="input-text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your English text here..."
                  className="w-full h-36 p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 resize-y"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Choose simplification level:
                </label>
                <LevelSelector
                  selectedLevel={selectedLevel}
                  onLevelChange={setSelectedLevel}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="w-full flex justify-center items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 text-lg"
              >
                {isLoading ? <><Spinner /> Simplifying...</> : 'Simplify Text'}
              </button>
            </div>
          </form>

          {(outputText || error) && (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h2 className="text-lg font-semibold text-gray-300 mb-2">Result:</h2>
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                  <p><strong>Error:</strong> {error}</p>
                </div>
              )}
              {outputText && (
                <div className="bg-gray-900 p-4 rounded-lg whitespace-pre-wrap text-gray-200">
                  <p>{outputText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
