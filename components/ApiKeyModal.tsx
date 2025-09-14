import React, { useState } from 'react';

interface ApiKeyModalProps {
  onApiKeySubmit: (apiKey: string) => void;
  error: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onApiKeySubmit, error }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 shadow-2xl w-full max-w-md m-4">
        <h2 className="font-medieval text-3xl text-yellow-300 text-center mb-4">Enter Your API Key</h2>
        <p className="text-gray-400 text-center mb-6 text-sm">
          To play, please provide your Google Gemini API key. It will be stored securely in your browser's session storage and will not be shared.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="sr-only">Gemini API Key</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              placeholder="Enter your Gemini API Key"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-600"
            disabled={!apiKey.trim()}
          >
            Save and Begin
          </button>
        </form>
        <div className="text-center mt-4">
            <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline"
            >
                Get a Gemini API Key from Google AI Studio
            </a>
        </div>
      </div>
    </div>
  );
};
