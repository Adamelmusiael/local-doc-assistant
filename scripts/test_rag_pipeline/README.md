# RAG Pipeline Test

Simple testing tool for comparing different LLM model performance with your documents.

## Overview

This test script allows you to:
- Upload test PDFs or use existing documents
- Select which models to test (local and/or external)
- Choose default questions or add custom ones
- Get detailed performance comparison results

## What You Need

1. **FastAPI server running** at `http://localhost:8000`
   ```bash
   cd c:\projects\AI-Assistant
   uvicorn src.app.main:app --reload
   ```

2. **Test PDFs** (optional) - place your PDFs in the `test_pdfs/` folder

## How to Run

1. **Start the API server** (if not already running):
   ```bash
   cd c:\projects\AI-Assistant
   uvicorn src.app.main:app --reload
   ```

2. **Run the test**:
   ```bash
   cd scripts\test_rag_pipeline
   python test_rag.py
   ```

3. **Follow the prompts**:
   - Choose to load new PDFs or use existing documents
   - Select which models to test
   - Choose default questions or add custom ones
   - Confirm and run the tests

## What You Get

The script will create a detailed results file in the `results/` folder with:

### Test Configuration
- Date and time of test
- Models tested
- Number of questions and documents
- Total tests performed

### Performance Summary
- Success rate for each model
- Average response time per model
- Best performing model

### Detailed Results
For each question and model combination:
- **Response time** (how long it took to answer)
- **Number of chunks used** (how many document pieces were referenced)
- **Full answer** from the model
- **Source files** and chunk information
- **Confidence and hallucination scores** (if available)

### Example Output Structure
```
RAG PIPELINE TEST RESULTS
===============================================================================

TEST CONFIGURATION
----------------------------------------
Date: 2025-08-21 15:30:45
Models tested: mistral, llama3.1-8b-128k, qwen2.5-1m
Questions: 5
Documents used: 3
Total tests: 3 x 5 = 15

MODEL PERFORMANCE
----------------------------------------
mistral              |  80.0% success |   2.3s avg
llama3.1-8b-128k     |  60.0% success |   4.1s avg
qwen2.5-1m           | 100.0% success |   1.8s avg

DETAILED RESULTS
===============================================================================

QUESTION 1: What is the main business or service described in these documents?
--------------------------------------------------------------------------------

[M] MODEL: mistral
[T] Response time: 2.34 seconds
[C] Chunks used: 5
[A] Answer:
Based on the documents, the main business services described include...

[S] Sources (5 chunks):
  1. Oferta_Strona_WWW_WebNova.pdf
  2. oferta_wspolpracy.pdf
  3. Oferta_Wspolpracy_NovaCloud.pdf
```

## Default Questions

The script includes these default questions:
1. What is the main business or service described in these documents?
2. What are the key pricing or cost details mentioned?
3. Who are the main contact persons and their roles?
4. What are the technical requirements or specifications mentioned?
5. What are the delivery timelines or project phases described?

## Folder Structure

```
scripts/test_rag_pipeline/
├── test_rag.py          # Main test script
├── test_pdfs/           # Place your test PDFs here
│   ├── Oferta_Strona_WWW_WebNova.pdf
│   ├── oferta_wspolpracy.pdf
│   └── Oferta_Wspolpracy_NovaCloud.pdf
├── results/             # Test results are saved here
│   └── rag_test_results_YYYYMMDD_HHMMSS.txt
└── README.md           # This file
```

## Available Models

The script automatically loads available models from the configuration file. Common models include:
- **Local models**: mistral, llama3.1-8b-128k, qwen2.5-1m
- **External models**: gpt-4o, gpt-4-turbo, gpt-3.5-turbo

## Tips

- **Start with local models** (option B) for faster testing
- **Use default questions** first to get familiar with the output
- **Check the results file** for detailed analysis and chunk information
- **Run multiple tests** with different document sets to compare consistency

## Troubleshooting

### API Connection Failed
- Make sure FastAPI is running: `uvicorn src.app.main:app --reload`
- Check the URL: http://localhost:8000/health should return `{"status": "healthy"}`

### No Documents Found
- Place PDF files in `test_pdfs/` folder, or
- Upload documents through the web interface first, then choose option 2

### Model Errors
- Some models may not be available or properly configured
- Start with local models (mistral) which are most reliable
- Check your `.config` file for model configuration

### Slow Performance
- Local models are faster than external API calls
- Fewer questions = faster testing
- Large PDFs take longer to process

## Sample Results

A typical test run produces:
- **Response times**: 1-5 seconds per question
- **Chunk usage**: 3-8 document chunks per answer
- **Success rates**: 80-100% depending on model and question complexity
- **Detailed answers**: Full model responses with source attribution
