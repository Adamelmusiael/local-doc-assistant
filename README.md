# AI-Assistant

Aby uruchomić testową apke należy:
## 1. Clone repo
`bash  git clone https://github.com/adammussial/AI-Assistant.git`

## 2.Stwórz oraz aktywuj conda env
do wypełnienia

## 3. uruchom apke:uvicorn src.app.main:app --reload
`bash uvicorn src.app.main:app --reload`

## 4. apka powinna się odpalić na:
http://127.0.0.1:8000


Po uruchomieniu BE można odpalić streamlit (tymczasowy frontend na potrzeby mvp).
UWAGA! Bez BE front nie ruszy - musza być spełnione wszytkie poprzednie kroki.
# 1. Uruchom frontend:
`bash streamlit run frontend/streamlit_app.py`
# 2. dostęp powinien być prze:

Local URL: http://localhost:8501
Network URL: http://192.168.0.3:8501

Activate Qdrant before using the app:
`bash docker run -p 6333:6333 qdrant/qdrant`