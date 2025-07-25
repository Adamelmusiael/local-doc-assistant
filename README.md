# AI-Assistant

To run the test app:
## 1. Clone repo
`bash  git clone https://github.com/adammussial/AI-Assistant.git`

## 2. Create and activate conda env
TBD

## 3. Run the app: uvicorn src.app.main:app --reload
`bash uvicorn src.app.main:app --reload`

## 4. The app should be available at:
http://127.0.0.1:8000

After starting the backend, you can run Streamlit (temporary frontend for MVP purposes).
NOTE! The frontend will not work without the backend - all previous steps must be completed.
# 1. Start the frontend:
`bash streamlit run frontend/streamlit_app.py`
# 2. The app should be available at:

## Pliki i konfiguracja
- `docker-compose.yml` – definiuje wszystkie usługi
- `Dockerfile` – backend (FastAPI)
- `Dockerfile.frontend` – frontend (Streamlit)
- `requirements.txt` – zależności Pythona
- `.env` – klucze i zmienne środowiskowe (stwórz na podstawie `.env.example`)

