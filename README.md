# FairNLP-MT

A professional full-stack AI research prototype web application for NLP fairness and debiasing.

## Architecture

- **Frontend**: React.js, Vite, Tailwind CSS, Recharts, Framer Motion
- **Backend**: FastAPI, SQLAlchemy (SQLite for prototype)
- **AI Stack Mocked/Integrated**: HuggingFace Transformers, PyTorch, Fairlearn

## Getting Started

### 1. Backend Setup

```bash
cd fairnlp-mt
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

The backend API will run at `http://localhost:8000`. Swagger UI is at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd fairnlp-mt/frontend
npm install
npm run dev
```

The frontend application will be available at `http://localhost:5173`.

## Features
- **Bias Analyzer**: Detects bias in text inputs in real-time.
- **Counterfactual Generation**: Automatically creates unbiased alternatives.
- **Fairness Dashboard**: Visualizes aggregate metrics (Demographic Parity, Equalized Odds).
- **Model Insights**: Shows simulated attention heatmaps and token importance.
