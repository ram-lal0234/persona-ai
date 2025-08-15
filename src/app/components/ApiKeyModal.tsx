import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelType: 'gpt' | 'gemini';
  onSave?: (key: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, modelType, onSave }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);

  const modelConfig = {
    gpt: {
      title: 'Enter GPT API Key',
      placeholder: 'sk-...',
      storageKey: 'gpt-api-key',
      colorScheme: 'orange'
    },
    gemini: {
      title: 'Enter Gemini API Key',
      placeholder: 'Enter your Gemini API key',
      storageKey: 'gemini-api-key',
      colorScheme: 'amber'
    }
  };

  const config = modelConfig[modelType];
  const colorScheme = config.colorScheme;

  useEffect(() => {
    const existingKey = localStorage.getItem(config.storageKey);
    setHasExistingKey(!!existingKey);
  }, [config.storageKey, isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem(config.storageKey, apiKey.trim());
      setApiKey('');
      onSave?.(apiKey.trim());
      onClose();
      alert(`${modelType.toUpperCase()} API key saved to local storage!`);
    } else {
      alert('Please enter a valid API key');
    }
  };

  const handleRemove = () => {
    localStorage.removeItem(config.storageKey);
    setHasExistingKey(false);
    alert(`${modelType.toUpperCase()} API key removed from local storage`);
  };

  const getColorClasses = (scheme: string) => {
    if (scheme === 'orange') {
      return {
        button: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700',
        status: 'bg-orange-50 border-orange-200 text-orange-700',
        removeButton: 'text-orange-600 hover:text-orange-800'
      };
    } else {
      return {
        button: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700',
        status: 'bg-amber-50 border-amber-200 text-amber-700',
        removeButton: 'text-amber-600 hover:text-amber-800'
      };
    }
  };

  const colors = getColorClasses(colorScheme);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={config.title}>
      <div className="space-y-4">
        <div>
          <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-2">
            {modelType.toUpperCase()} API Key
          </label>
          <input
            type="password"
            id="api-key-input"
            placeholder={config.placeholder}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className={`flex-1 text-white py-2 px-4 rounded-md transition-all duration-200 font-medium ${colors.button}`}
          >
            Save Key
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
        
        {hasExistingKey && (
          <div className={`flex items-center justify-between p-3 rounded-md border ${colors.status}`}>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm">API key already saved</span>
            </div>
            <button
              onClick={handleRemove}
              className={`text-sm underline ${colors.removeButton}`}
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
} 