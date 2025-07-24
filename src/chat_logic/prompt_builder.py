from prompt.prompt_template import PROMPT_TEMPLATE

def build_prompt(chunks, chat_history=None, user_question=None):
    """
    Builds a prompt for the model based on chunks, history, and user question.
    chunks: list[str] or list[dict] or str
    chat_history: list[str] or str or None
    user_question: str
    """
    # Process chunks
    if isinstance(chunks, str):
        chunks_text = chunks
    elif isinstance(chunks, list):
        # If list of dicts, extract text
        if all(isinstance(c, dict) for c in chunks):
            chunks_text = '\n\n'.join(c.get('text', str(c)) for c in chunks)
        else:
            chunks_text = '\n\n'.join(str(c) for c in chunks)
    else:
        chunks_text = str(chunks)

    # Process history
    if chat_history is None:
        history_text = ''
    elif isinstance(chat_history, str):
        history_text = chat_history
    elif isinstance(chat_history, list):
        history_text = '\n'.join(str(h) for h in chat_history)
    else:
        history_text = str(chat_history)

    # User question
    question_text = user_question or ''

    return PROMPT_TEMPLATE.format(
        chunks_go_here=chunks_text,
        chat_history_goes_here=history_text,
        user_question_goes_here=question_text
    ) 