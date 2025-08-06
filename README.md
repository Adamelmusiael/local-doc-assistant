# AI Assistant


## Features
- Upload and manage PDF documents with metadata
- Preprocess and index documents for semantic search
- Chat with an LLM (Mistral, OpenAI, etc.) using document context
- Session-based chat with conversation history
- FastAPI backend, Qdrant vector search, SQLite for metadata

##  Quickstart (Recommended: Docker)

1. **Install Docker Desktop**  
   - [Windows instructions](https://docs.docker.com/desktop/install/windows-install/)
   - [Mac instructions](https://docs.docker.com/desktop/install/mac-install/)

2. **Clone the repository**
   ```sh
   git clone https://github.com/thenorthalliance/local-rag.git
   cd local-rag
   ```

3. **Start the app (backend, Qdrant, frontend)**
   ```sh
   docker-compose up --build
   ```

4. **Access the app:**
   - Backend API: [http://localhost:8000](http://localhost:8000)

---

##  For Developers (Local Setup, Optional)

If you want to run locally:

- Install [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or Python 3.10+
- Create environment:
  ```sh
  conda env create -f environment.yml
  conda activate mvp-ai-assistant
  ```
  or
  ```sh
  python -m venv venv
  source venv/bin/activate  # or venv\Scripts\activate on Windows
  pip install -r requirements.txt
  ```
- Start Qdrant:
  ```sh
  docker run -p 6333:6333 qdrant/qdrant
  ```
- Run backend:
  ```sh
  uvicorn src.app.main:app --reload
  ```
  Run frontend (backend need to be running first!):
  ```sh
  cd frontend
  npm run dev
  ```
---

## Documentation
- [Architecture & Structure](docs/ARCHITECTURE.md)
- [Technologies](docs/TECHNOLOGIES.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
