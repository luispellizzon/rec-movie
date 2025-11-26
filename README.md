# 🎬 Movie Recommendation App

AI-powered movie recommendation system with React frontend and FastAPI backend.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- Python 3.11 or higher
- npm or yarn
- Git

### Installation

#### Frontend

\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

#### Backend

\`\`\`bash
cd model/project-ai
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

## 🧪 Testing

### Run All Tests

\`\`\`bash

# Frontend

cd client && npm test

# Backend

cd model/project-ai && pytest
\`\`\`

### Coverage Reports

\`\`\`bash

# Frontend

npm run test:coverage

# Backend

pytest --cov=. --cov-report=html
\`\`\`

## 📦 Project Structure

\`\`\`
movie-recommendation-app/
├── build/ # Build artifacts
├── tests/ # Test files
├── deploy/ # Deployment scripts
├── docs/ # Documentation
├── data/ # Dataset
├── client/ # React frontend
├── model/ # Python backend
└── .github/workflows/ # CI/CD pipelines
\`\`\`

## 🔄 CI/CD Pipeline

Our application uses GitHub Actions for CI/CD:

- **CI**: Runs on every push/PR to main/develop
- **CD**: Runs on release or manual trigger

### Workflows

- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/cd.yml` - Continuous Deployment

## 📚 Documentation

- [Testing Guide](docs/testing/)
- [CI/CD Documentation](docs/cicd/)
- [API Documentation](docs/api/)
- [Architecture](docs/architecture/)

## 🛠️ Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Firebase Authentication
- Tailwind CSS

### Backend

- Python 3.11
- FastAPI
- Uvicorn
- Pandas

### Testing

- Frontend: Vitest + Testing Library
- Backend: Pytest

### DevOps

- GitHub Actions
- Firebase Hosting (Frontend)
- Coverage Reports

## 👥 Team

[Your team members]

## 📄 License

[Your license]
