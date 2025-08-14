"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import Image from "next/image";
import ModelSelector from "./ModelSelector";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ChatInterfaceProps {
  selectedPersona: string;
}

export default function ChatInterface({ selectedPersona }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error("No response received from the AI model");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      let errorMessage = "Sorry, I encountered an error. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage =
            "API key not configured. Please check your environment variables.";
        } else if (error.message.includes("Failed to get response")) {
          errorMessage =
            "AI model error. Please try switching models or check your API configuration.";
        } else if (error.message.includes("HTTP")) {
          errorMessage = `Server error: ${error.message}`;
        } else if (error.message.includes("No response")) {
          errorMessage = "No response from AI model. Please try again.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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

  const getPersonaAvatar = () => {
    return selectedPersona === "Hitesh"
      ? "/images/hitesh.png"
      : "/images/piyush.png";
  };

  const getPersonaName = () => {
    return selectedPersona === "Hitesh" ? "Hitesh" : "Piyush";
  };

  const getPlaceholderText = () => {
    if (selectedPersona === "Hitesh") {
      return "Ask Hitesh about coding, motivation, or tech tips... (e.g., 'Bhai, React kaise seekhein?')";
    } else {
      return "Ask Piyush about development, architecture, or technical concepts... (e.g., 'How can I improve my code quality?')";
    }
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-lg shadow-lg overflow-hidden border border-orange-200">
      {/* Chat Header - More Compact */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-3 text-white">
        <div className="flex items-center space-x-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white">
            <Image
              src={getPersonaAvatar()}
              alt={getPersonaName()}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold">Chat with {getPersonaName()}</h2>
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
                src={getPersonaAvatar()}
                alt={getPersonaName()}
                fill
                className="object-cover rounded-full"
              />
            </div>
            <p className="text-base font-medium mb-2">
              Start a conversation with {getPersonaName()}!
            </p>
            <p className="text-xs text-gray-600 mb-3">
              Ask about coding, development, or any tech questions you have.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700">
              <p className="font-medium mb-1">💡 Tip:</p>
              <p>{getPlaceholderText()}</p>
            </div>
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
                      src={getPersonaAvatar()}
                      alt={getPersonaName()}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Message Bubble - More Compact */}
                <div
                  className={`px-3 py-2 rounded-xl shadow-sm ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white"
                      : "bg-white text-gray-900 border border-orange-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
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
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full flex-shrink-0">
                <Image
                  src={getPersonaAvatar()}
                  alt={getPersonaName()}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="bg-white text-gray-900 px-3 py-2 rounded-xl border border-orange-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="animate-bounce w-2 h-2 bg-orange-400 rounded-full"></div>
                    <div
                      className="animate-bounce w-2 h-2 bg-orange-400 rounded-full"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="animate-bounce w-2 h-2 bg-orange-400 rounded-full"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">thinking...</span>
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
            placeholder={getPlaceholderText()}
            className="flex-1 resize-none rounded-xl border border-orange-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all duration-200 placeholder-orange-400/60 text-gray-900 text-sm"
            rows={1}
            disabled={isLoading}
          />
          
          {/* Compact Model Selector */}
          <div className="flex space-x-1">
            <button
              onClick={() => setSelectedModel('openai')}
              className={`px-2 py-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                selectedModel === 'openai'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-orange-300 hover:bg-orange-50'
              }`}
            >
              GPT-5
            </button>
            <button
              onClick={() => setSelectedModel('gemini')}
              className={`px-2 py-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                selectedModel === 'gemini'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-amber-300 hover:bg-amber-50'
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
