"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import Image from "next/image";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ChatInterfaceProps {
  selectedPersona: string;
}

// Function to render message content with proper formatting
const renderMessageContent = (content: string) => {
  // Split content by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      // Code block
      const code = part.slice(3, -3);
      const language = code.split('\n')[0].trim();
      const codeContent = code.split('\n').slice(1).join('\n');
      
      return (
        <div key={index} className="my-3">
          {language && (
            <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded-t-lg text-xs font-mono flex items-center justify-between">
              <span>{language}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(codeContent)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy code"
              >
                📋
              </button>
            </div>
          )}
          <pre className="bg-gray-900 text-gray-100 p-3 rounded-b-lg overflow-x-auto text-sm font-mono">
            <code>{codeContent}</code>
          </pre>
        </div>
      );
    } else if (part.includes('`')) {
      // Inline code
      const inlineParts = part.split(/(`[^`]+`)/g);
      return (
        <span key={index}>
          {inlineParts.map((inlinePart, inlineIndex) => {
            if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
              return (
                <code key={inlineIndex} className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                  {inlinePart.slice(1, -1)}
                </code>
              );
            }
            return inlinePart;
          })}
        </span>
      );
    } else {
      // Regular text - enhance formatting
      return (
        <div key={index} className="whitespace-pre-wrap space-y-2">
          {formatTextWithStructure(part)}
        </div>
      );
    }
  });
};

// Function to format text with better structure
const formatTextWithStructure = (text: string) => {
  // Split by common structural elements
  const sections = text.split(/(\*\*\*|\*\*.*?\*\*|^###.*$|^---$)/gm);
  
  return sections.map((section, index) => {
    if (section === '***') {
      return <hr key={index} className="my-4 border-gray-300" />;
    }
    
    if (section === '---') {
      return <hr key={index} className="my-3 border-gray-200" />;
    }
    
    if (section.startsWith('###')) {
      return (
        <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">
          {section.replace('###', '').trim()}
        </h3>
      );
    }
    
    if (section.startsWith('**') && section.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-gray-800">
          {section.slice(2, -2)}
        </strong>
      );
    }
    
    // Handle numbered lists
    if (/^\d+\.\s/.test(section)) {
      const items = section.split(/\n/).filter(item => /^\d+\.\s/.test(item));
      if (items.length > 0) {
        return (
          <div key={index} className="ml-4 space-y-1">
            {items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-start space-x-2">
                <span className="text-orange-600 font-medium text-sm min-w-[20px]">
                  {item.match(/^\d+\./)?.[0]}
                </span>
                <span className="text-gray-700">{item.replace(/^\d+\.\s/, '')}</span>
              </div>
            ))}
          </div>
        );
      }
    }
    
    // Handle bullet points
    if (section.startsWith('* ') || section.startsWith('- ')) {
      const items = section.split(/\n/).filter(item => /^[\*\-]\s/.test(item));
      if (items.length > 0) {
        return (
          <div key={index} className="ml-4 space-y-1">
            {items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-start space-x-2">
                <span className="text-orange-500 text-lg">•</span>
                <span className="text-gray-700">{item.replace(/^[\*\-]\s/, '')}</span>
              </div>
            ))}
          </div>
        );
      }
    }
    
    // Handle paragraphs
    if (section.trim()) {
      return (
        <p key={index} className="text-gray-700 leading-relaxed">
          {section}
        </p>
      );
    }
    
    return null;
  }).filter(Boolean);
};

export default function ChatInterface({ selectedPersona }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini");
  const [useEvaluation, setUseEvaluation] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset chat history when persona changes
  useEffect(() => {
    setMessages([]);
    setCollapsedMessages(new Set());
    setInputValue("");
    setIsLoading(false);
  }, [selectedPersona]);

  const toggleMessageCollapse = (messageId: string) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const isMessageLong = (content: string) => content.length > 500;

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      sender: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
          persona: selectedPersona,
          model: selectedModel,
          useEvaluation: useEvaluation,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.done) {
                  break;
                }
                
                if (data.content) {
                  // Update the assistant message with streaming content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error("Error sending message:", error);
      
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "API key not configured. Please check your environment variables.";
        } else if (error.message.includes("Failed to get response")) {
          errorMessage = "AI model error. Please try switching models or check your API configuration.";
        } else if (error.message.includes("HTTP")) {
          errorMessage = `Server error: ${error.message}`;
        } else if (error.message.includes("No response")) {
          errorMessage = "No response from AI model. Please try again.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      // Update the assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: errorMessage }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getPersonaAvatar = (persona: string) => {
    return persona === "Hitesh"
      ? "/images/hitesh.png"
      : "/images/piyush.png";
  };

  const getPersonaName = (persona: string) => {
    return persona === "Hitesh" ? "Hitesh" : "Piyush";
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-lg shadow-lg overflow-hidden border border-orange-200">
      {/* Chat Header - More Compact */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-3 text-white">
        <div className="flex items-center space-x-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white">
            <Image
              src={getPersonaAvatar(selectedPersona)}
              alt={getPersonaName(selectedPersona)}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold">Chat with {getPersonaName(selectedPersona)}</h2>
            <p className="text-orange-100 text-xs">
              Ask me anything about coding, development, or tech!
            </p>
          </div>
        </div>
      </div>

      {/* Messages - More Compact Spacing */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-6">
            <div className="relative h-16 w-16 mx-auto mb-3">
              <Image
                src={getPersonaAvatar(selectedPersona)}
                alt={getPersonaName(selectedPersona)}
                fill
                className="object-cover rounded-full"
              />
            </div>
            <p className="text-base font-medium mb-2">
              Start a conversation with {getPersonaName(selectedPersona)}!
            </p>
            <p className="text-xs text-gray-600 mb-3">
              Ask about coding, development, or any tech questions you have.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                  message.sender === "user"
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                {/* Avatar - Smaller */}
                <div className="relative h-8 w-8 overflow-hidden rounded-full flex-shrink-0">
                  {message.sender === "user" ? (
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-semibold text-xs">
                      U
                    </div>
                  ) : (
                    <Image
                      src={getPersonaAvatar(selectedPersona)}
                      alt={getPersonaName(selectedPersona)}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Message Bubble - More Compact with Rich Content Support */}
                <div
                  className={`px-3 py-2 rounded-xl shadow-sm ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white"
                      : "bg-white text-gray-900 border border-orange-200"
                  }`}
                >
                  {/* Message Header for Assistant Messages */}
                  {message.sender === "assistant" && isMessageLong(message.content) && (
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-orange-100">
                      <span className="text-xs text-orange-600 font-medium">
                        💡 Detailed Response
                      </span>
                      <button
                        onClick={() => toggleMessageCollapse(message.id)}
                        className="text-xs text-orange-500 hover:text-orange-700 transition-colors"
                      >
                        {collapsedMessages.has(message.id) ? '📖 Expand' : '📚 Collapse'}
                      </button>
                    </div>
                  )}
                  
                  {/* Message Content */}
                  <div className={`text-sm leading-relaxed ${
                    message.sender === "user" ? "text-white" : "text-gray-900"
                  }`}>
                    {collapsedMessages.has(message.id) && isMessageLong(message.content) ? (
                      <div className="space-y-2">
                        <p className="text-gray-600 italic">
                          {message.content.substring(0, 200)}...
                        </p>
                        <button
                          onClick={() => toggleMessageCollapse(message.id)}
                          className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        >
                          Click to expand full response
                        </button>
                      </div>
                    ) : (
                      renderMessageContent(message.content)
                    )}
                  </div>
                  
                  {/* Message Footer */}
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs ${
                        message.sender === "user"
                          ? "text-orange-100"
                          : "text-gray-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    
                    {message.sender === "assistant" && isMessageLong(message.content) && (
                      <span className="text-xs text-orange-400">
                        {message.content.length} characters
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
            {/* Loading Indicator - Only show when actually loading */}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <img
                    src={getPersonaAvatar(selectedPersona)}
                    alt={getPersonaName(selectedPersona)}
                    className="h-8 w-8 rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <div className="px-3 py-2 rounded-xl bg-white border border-orange-200 shadow-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - More Compact */}
      <div className="border-t border-orange-200 bg-white p-3">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about coding, development, or tech!"
            className="flex-1 resize-none rounded-xl border border-orange-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all duration-200 placeholder-orange-400/60 text-gray-900 text-sm"
            rows={1}
            disabled={isLoading}
          />
          
          {/* Enhanced Evaluation Toggle */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-600 font-medium">Enhanced Mode:</label>
            <button
              onClick={() => setUseEvaluation(!useEvaluation)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                useEvaluation ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useEvaluation ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs text-gray-500">
              {useEvaluation ? 'ON' : 'OFF'}
            </span>
          </div>
          
          {/* Compact Model Selector */}
          <div className="flex space-x-1">
            <button
              onClick={() => setSelectedModel("openai")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                selectedModel === "openai"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-200"
                  : "bg-white text-gray-700 border border-orange-300 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${selectedModel === "openai" ? "bg-white" : "bg-orange-500"}`} />
              <span>GPT-4o-mini</span>
            </button>
            <button
              onClick={() => setSelectedModel("gemini")}
              className={`px-2 py-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                selectedModel === "gemini"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-amber-300 hover:bg-amber-50"
              }`}
            >
              Gemini
            </button>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-white hover:from-orange-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
