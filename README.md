# Persona AI Chat

An interactive chat application that mimics the personalities of two tech educators: **Hitesh Choudhary** and **Piyush Garg**. Each persona has their own unique communication style and approach to teaching coding concepts.

## Features

- **Dual Personas**: Choose between Hitesh's energetic Hinglish style or Piyush's structured professional approach
- **Multi-Model Support**: Chat using either OpenAI GPT or Google Gemini AI models
- **Interactive Interface**: Modern, responsive chat interface with real-time responses
- **Persona Switching**: Easily switch between personas during your session

## Personas

### Hitesh Choudhary
- **Style**: Casual Hindi-English (Hinglish) mix
- **Tone**: Energetic, motivational, and humorous
- **Approach**: Practical coding tips with relatable analogies (gym, cricket, food, movies)
- **Best for**: Beginners looking for motivation and practical advice

### Piyush Garg
- **Style**: Clear, structured, and professional English
- **Tone**: Calm, approachable, focused on technical accuracy
- **Approach**: Step-by-step explanations with helpful analogies
- **Best for**: Developers seeking detailed, structured learning

## Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd persona-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# OpenAI API Key (required for GPT model)
OPENAI_API_KEY=your_openai_api_key_here

# Google AI API Key (required for Gemini model)
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select a Persona**: Choose between Hitesh or Piyush on the home page
2. **Choose AI Model**: Select between OpenAI GPT or Google Gemini
3. **Start Chatting**: Ask questions about coding, development, or tech
4. **Switch Personas**: Use the back button to return to persona selection

## API Keys Setup

### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get your API key
3. Add it to your `.env.local` file

### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add it to your `.env.local` file

## Technologies Used

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Models**: OpenAI GPT, Google Gemini
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/          # Chat API endpoint
│   ├── components/         # React components
│   │   ├── PersonaCard.tsx
│   │   ├── ChatInterface.tsx
│   │   └── ModelSelector.tsx
│   ├── utils/             # Utility functions
│   │   └── personaPrompt.ts
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── public/
│   └── images/            # Persona images
└── package.json
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).
