# AI-Assistant

## Szybki start – uruchomienie jednym poleceniem (Windows/Mac/Linux)

1. Zainstaluj [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac)
2. Skopiuj plik `.env.example` do `.env` i uzupełnij klucz OpenAI oraz inne wymagane zmienne
3. W katalogu projektu uruchom:
   ```
   docker-compose up --build
   ```
4. Backend: http://localhost:8000  
   Frontend: http://localhost:8501

**To wszystko!**

---

### Szczegóły
- Wszystkie usługi (backend, frontend, Qdrant) uruchamiają się automatycznie.
- Nie musisz instalować Pythona, Qdrant, Streamlit itp. – wszystko działa w kontenerach.
- Możesz zatrzymać aplikację poleceniem `docker-compose down`.

---

## Pliki i konfiguracja
- `docker-compose.yml` – definiuje wszystkie usługi
- `Dockerfile` – backend (FastAPI)
- `Dockerfile.frontend` – frontend (Streamlit)
- `requirements.txt` – zależności Pythona
- `.env` – klucze i zmienne środowiskowe (stwórz na podstawie `.env.example`)

---

## Dla zaawansowanych
Możesz nadal uruchamiać backend i frontend ręcznie, ale Docker Compose jest najprostszy i najbardziej uniwersalny.