PROMPT_TEMPLATE = '''You are an intelligent assistant designed to help users answer business-related questions based on their own documents.

Use only the content from the DOCUMENTS section below to formulate your answer.  
If the answer is not directly supported by the information in the documents, clearly say:

> "I'm sorry, but I could not find sufficient information in the provided documents to answer your question."

Respond in **English**.

DOCUMENTS:
{chunks_go_here}

OPTIONAL CHAT HISTORY:
{chat_history_goes_here}

USER QUESTION:
{user_question_goes_here}
'''

def build_prompt(chunks, chat_history=None, user_question=None):
    """
    Składa prompt do modelu na bazie chunków, historii i pytania użytkownika.
    chunks: list[str] lub list[dict] lub str
    chat_history: list[str] lub str lub None
    user_question: str
    """
    # Przetwarzanie chunków
    if isinstance(chunks, str):
        chunks_text = chunks
    elif isinstance(chunks, list):
        # Jeśli lista dictów, wyciągnij tekst
        if all(isinstance(c, dict) for c in chunks):
            chunks_text = '\n\n'.join(c.get('text', str(c)) for c in chunks)
        else:
            chunks_text = '\n\n'.join(str(c) for c in chunks)
    else:
        chunks_text = str(chunks)

    # Przetwarzanie historii
    if chat_history is None:
        history_text = ''
    elif isinstance(chat_history, str):
        history_text = chat_history
    elif isinstance(chat_history, list):
        history_text = '\n'.join(str(h) for h in chat_history)
    else:
        history_text = str(chat_history)

    # Pytanie użytkownika
    question_text = user_question or ''

    return PROMPT_TEMPLATE.format(
        chunks_go_here=chunks_text,
        chat_history_goes_here=history_text,
        user_question_goes_here=question_text
    ) 