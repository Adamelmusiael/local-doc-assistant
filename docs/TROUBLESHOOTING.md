# Troubleshooting

## Qdrant Not Running
- Make sure Qdrant is started: `docker run -p 6333:6333 qdrant/qdrant`

## LLM API Not Responding
- Check that the LLM server (Ollama, OpenAI, etc.) is running and accessible
- Verify `LLM_API_URL` in your environment variables

## PDF Upload Fails
- Only PDF files are supported
- Check file size and permissions

## Database Issues
- Ensure SQLite file is writable
- For schema errors, re-initialize with `src/db/init_db.py`

## General
- Check logs for error messages
- Restart the backend after changing environment variables 