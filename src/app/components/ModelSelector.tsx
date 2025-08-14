"use client";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200 px-4 py-3">
      <div className="flex items-center justify-center">
        
        <div className="flex space-x-2">
          <button
            onClick={() => onModelChange('openai')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              selectedModel === 'openai'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-200'
                : 'bg-white text-gray-700 border border-orange-300 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${selectedModel === 'openai' ? 'bg-white' : 'bg-orange-500'}`} />
            <span>GPT-5</span>
          </button>
          
          <button
            onClick={() => onModelChange('gemini')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              selectedModel === 'gemini'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-200'
                : 'bg-white text-gray-700 border border-amber-300 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${selectedModel === 'gemini' ? 'bg-white' : 'bg-amber-500'}`} />
            <span>Gemini</span>
          </button>
        </div>
      </div>
    </div>
  );
}
