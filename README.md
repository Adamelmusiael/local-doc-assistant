# AI-Assistant

##  Quickstart (Recommended: Docker)

1. **Install Docker Desktop**  
   - [Windows instructions](https://docs.docker.com/desktop/install/windows-install/)
   - [Mac instructions](https://docs.docker.com/desktop/install/mac-install/)

2. **Clone the repository**
   ```sh
   git clone https://github.com/adammussial/AI-Assistant.git
   cd AI-Assistant
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
---

**Summary:**  
- For 99% of users, just run:  
  ```sh
  docker-compose up --build
  ```
- No need to worry about Conda or pip unless you want to develop locally.
