from prompt.prompt_template import PROMPT_TEMPLATE

def build_prompt(chunks, chat_history=None, user_question=None, query_analysis=None):
    """
    Builds a prompt for the model based on chunks, history, user question, and query analysis.
    
    Args:
        chunks: list[str] or list[dict] or str - Document chunks
        chat_history: list[str] or str or None - Previous conversation
        user_question: str - Current user question
        query_analysis: dict or None - Query complexity analysis results
    
    Returns:
        str: Formatted prompt for the model
    """
    if isinstance(chunks, str):
        chunks_text = chunks
    elif isinstance(chunks, list):
        if all(isinstance(c, dict) for c in chunks):
            chunks_text = '\n\n'.join(c.get('text', str(c)) for c in chunks)
        else:
            chunks_text = '\n\n'.join(str(c) for c in chunks)
    else:
        chunks_text = str(chunks)

    if chat_history is None:
        history_text = ''
    elif isinstance(chat_history, str):
        history_text = chat_history
    elif isinstance(chat_history, list):
        history_text = '\n'.join(str(h) for h in chat_history)
    else:
        history_text = str(chat_history)

    question_text = user_question or ''
    
    # Add query analysis context if available
    analysis_context = ""
    if query_analysis:
        analysis_context = f"""
QUERY ANALYSIS:
- Query Type: {query_analysis.get('query_type', 'unknown')}
- Complexity: {query_analysis.get('complexity_level', 'unknown')}
- Chunks Retrieved: {query_analysis.get('chunks_retrieved', 0)} of {query_analysis.get('chunks_requested', 0)} requested
"""

    return PROMPT_TEMPLATE.format(
        chunks_go_here=chunks_text,
        chat_history_goes_here=history_text,
        user_question_goes_here=question_text,
        analysis_context=analysis_context
    ) 