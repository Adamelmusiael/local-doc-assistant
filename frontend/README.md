# Local RAG Frontend

React + TypeScript + Vite + Tailwind CSS frontend for the Local RAG application.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing and navigation
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icons
- **Axios** - HTTP client
- **Prettier** - Code formatting

### API Integration

The frontend is configured to proxy API requests to `http://localhost:8000` in development mode.

### Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API services
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
├── App.tsx        # Main app component
├── main.tsx       # Application entry point
└── index.css      # Global styles with Tailwind
```
