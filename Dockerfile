FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PYTHONPATH="${PYTHONPATH}:/app/src"
CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]