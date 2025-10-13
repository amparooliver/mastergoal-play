# MasterGoal Web Interface

A web-based implementation of the strategic football board game MasterGoal, featuring AI agents powered by Minimax, Monte Carlo Tree Search (MCTS), and advanced heuristic algorithms.

> *This work is dedicated to the memory of Alberto Bogliaccini, the creator of MasterGoal.*

---

## About This Project

This repository contains the web interface for the MasterGoal game, developed as part of a thesis evaluating competitive AI strategies in structured, turn-based environments. The project provides an interactive platform where users can play against AI agents of varying difficulty levels and observe different strategic approaches to the game.

### What This Repository Contains

- **Frontend** (`/frontend`): React + Vite application with Tailwind CSS and Framer Motion
  - Interactive game board with responsive design (portrait and landscape modes)
  - Game configuration interface with multiple difficulty levels
  - Real-time visualization of AI decision-making
  - Multilingual support (English/Spanish)
  - Timer and turn limit options

- **Backend** (`/backend`): Flask REST API
  - Game state management
  - AI agent orchestration
  - Move validation and execution
  - Integration with the tournament system

- **Game Assets** (`/frontend/public/assets`): UI icons and visual elements

### Key Features

- **Three Game Levels**: 1v1, 2v2, and 5v5 configurations
- **Multiple AI Agents**: 
  - Random baseline
  - Heuristic-based strategies (single and multi-factor)
  - Minimax with evolutionary weights
  - Monte Carlo Tree Search
  - Role-based tactical agents
- **Game Modes**: Player vs AI or Player vs Player (same device)
- **Customization**: Team colors, timer settings, turn limits
- **Responsive Design**: Adapts to mobile and desktop displays

---

## Deployment

This project is deployed across two platforms for optimal performance and scalability:

### Frontend - Vercel
- **Platform**: [Vercel](https://vercel.com)
- **URL**: [[Mastergoal Website](https://mastergoal.vercel.app/)]
- **Features**: Static site hosting with automatic deployments from Git

### Backend - Render
- **Platform**: [Render](https://render.com)
- **Features**: Python application hosting with automatic scaling
- **Configuration**: Gunicorn WSGI server with optimized worker settings

---

## Related Repositories

This project integrates with and builds upon the following repositories:

1. **Tournament System** (Core Game Logic and AI Agents)
   - Contains the MasterGoal game engine
   - Implements all AI agents (MCTS, Minimax, Heuristics)
   - Provides the tournament framework used for benchmarking
   - [Tournament-System-Mastergoal](https://github.com/amparooliver/tournament-system-Mastergoal)

2. **Original MasterGoal Implementation**
   - Alberto Bogliaccini's original game design
---

## Technical Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 4.5.14
- **Styling**: Tailwind CSS 3.4.18
- **Animations**: Framer Motion 10.18.0
- **Routing**: React Router DOM 6.30.1
- **HTTP Client**: Axios 1.12.2

### Backend
- **Framework**: Flask 2.3.2
- **CORS**: Flask-CORS 4.0.0
- **WSGI Server**: Gunicorn 21.2.0
- **Scientific Computing**: NumPy 1.24.3
- **Environment**: Python-dotenv 1.0.0

---

## Local Development Setup

### Prerequisites
- Node.js 14+ (for frontend)
- Python 3.8+ (for backend)
- Git

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend API will be available at `http://localhost:5000`

### Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:5000
```

**Backend** (`.env`):
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=5000
```

---

## Game Configuration

### Levels
- **Level 1**: 1 player per team (1v1)
- **Level 2**: 2 players per team (2v2)
- **Level 3**: 5 players per team (5v5)

### AI Difficulty Mapping

Each level has three difficulty settings, mapped to specific AI agents:

**Level 1**:
- Easy: Random Agent
- Medium: Minimax (M1P2 weights)
- Hard: Basic Heuristic

**Level 2**:
- Easy: Territorial Control (High Pressure)
- Medium: Minimax (M2P3 weights)
- Hard: Advanced Heuristic

**Level 3**:
- Easy: Role-Based (Balanced)
- Medium: Role-Based (Offensive)
- Hard: Role-Based (Defensive)

---

## API Endpoints

### Game Management
- `POST /api/game/new` - Create new game session
- `GET /api/game/<id>/state` - Get current game state
- `POST /api/game/<id>/move` - Execute a move
- `GET /api/game/<id>/legal-moves` - Get available moves
- `POST /api/game/<id>/restart` - Restart game with same settings

### Information
- `GET /api/health` - Health check
- `GET /api/agents` - List available AI agents
- `GET /api/statistics` - Game statistics

---

## Research Context

This web interface serves as an experimental platform for the thesis:

### Thesis Information
- **Title**: Mastergoal: Desafío de los Algoritmos para Niveles de Juego
- **Author**: Amparo Oliver
- **Advisor**: PhD. Luca Cernuzzi
- **Institution**: Universidad Católica "Nuestra Señora de la Asunción"
- **Faculty**: Facultad de Ciencias y Tecnología
- **Department**: Departamento de Electrónica e Informática
- **Degree**: Ingeniera Informática
- **Location**: Asunción, Paraguay
- **Date**: Octubre de 2025

### Research Objectives

**General Objective:**
Develop a web version of the Mastergoal game with different difficulty levels for artificial intelligence agents, and perform a comparative analysis of their performance using different algorithmic approaches.

**Specific Objectives:**
1. Implement a web version of Mastergoal
2. Create different difficulty levels for AI agents in Mastergoal, adjusting algorithms and parameters as needed to provide appropriate challenges for players of different skill levels
3. Evaluate the effectiveness and complexity of these methods in the context of Mastergoal
4. Conduct a comparative evaluation of performance among the different developed agents

---

## Project Structure

```
mastergoal-web/
├── frontend/
│   ├── public/
│   │   └── assets/          # UI icons and graphics
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── context/         # i18n context
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   └── App.jsx          # Root component
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   ├── tournament_system/   # Core game logic (submodule/dependency)
│   ├── app.py              # Flask application
│   ├── ai_manager.py       # AI agent orchestration
│   ├── game_manager.py     # Game state management
│   ├── config.py           # Configuration
│   ├── requirements.txt
│   └── Procfile            # Render deployment config
└── README.md
```

---

## Contributing

This is a thesis project and is not currently accepting contributions. However, feedback and bug reports are welcome via the Issues tab.
---

## License

[Specify your license - e.g., MIT, GPL, Academic Use Only, etc.]

---

## Citation

If you use this work in your research, please cite!
```

---

## Acknowledgments

- **Alberto Bogliaccini** - Creator of MasterGoal (In Memoriam)
- **Dr. Luca Cernuzzi** - Thesis advisor
---

## Contact

- **Author**: Amparo Oliver
- **Email**: [amparooliverb@gmail.com]
- **Thesis Repository**: [Link to main thesis repository if different]

---

**Last Updated**: October 2025
