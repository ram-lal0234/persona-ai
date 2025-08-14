"use client";

import { useState } from "react";
import PersonaCard from "./components/PersonaCard";
import ChatInterface from "./components/ChatInterface";

const personas = [
  {
    id: "Hitesh",
    name: "Hitesh Choudhary",
    role: "Coding Mentor & YouTuber",
    description:
      "Energetic coding mentor who mixes Hindi-English casually. Known for practical coding tips and motivational content.",
    imageSrc: "/images/hitesh.png",
  },
  {
    id: "Piyush",
    name: "Piyush Garg",
    role: "Tech Educator & Developer",
    description:
      "Detail-oriented educator focused on clear, structured explanations and technical accuracy.",
    imageSrc: "/images/piyush.png",
  },
];

export default function Home() {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8">
        {/* Main Content - Persona Cards and Chat Interface */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Persona Cards - Left Side */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Select Your Mentor
            </h2>
            {personas.map((persona, index) => (
              <div
                key={persona.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <PersonaCard
                  name={persona.name}
                  role={persona.role}
                  description={persona.description}
                  imageSrc={persona.imageSrc}
                  isSelected={selectedPersona === persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                />
              </div>
            ))}
          </div>

          {/* Chat Interface - Right Side */}
          <div className="lg:col-span-2">
            <div className="h-[500px] lg:h-[600px]">
              {selectedPersona ? (
                <ChatInterface selectedPersona={selectedPersona} />
              ) : (
                <div className="h-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Select a Mentor to Start</h3>
                    <p className="text-sm">Choose Hitesh or Piyush from the left to begin chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
