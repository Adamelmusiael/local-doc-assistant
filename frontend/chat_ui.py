import streamlit as st
import requests

API_BASE_URL = "http://localhost:8000"

def render_chat_ui():
    st.title("Chat with your documents!")
    
    option = st.radio("Options:", ["Select document for preprocessing", "Chat with your documents"])

    if option == "Select document for preprocessing":
        select_document_for_preprocessing()
    elif option == "Chat with your documents":
        chat_with_documents()

def select_document_for_preprocessing():
    """Select document for preprocessing"""
    st.subheader("Select document for preprocessing")
    try:
        documents = requests.get(f"{API_BASE_URL}/docs/")
        if documents.status_code == 200:
            documents = documents.json()
            # st.write(documents["documents"][0])
            # st.write(documents["documents"][1])
            # st.write(documents["documents"][0]["filename"])
            num_of_docs = len(documents["documents"])
            documents_available = []
            for i in range(num_of_docs):
                documents_available.append(documents["documents"][i]["filename"])
                #st.write(documents["documents"][i]["filename"])
            
            selected_files = st.multiselect("Select documents", documents_available)
            
            # Dodaj przycisk do preprocessingu wybranych dokumentów
            if selected_files:
                if st.button("Preprocess Selected Documents"):
                    st.info(f"Processing {len(selected_files)} document(s)...")
                    
                    try:
                        # Przygotuj dane do wysłania
                        preprocessing_data = {
                            "filenames": selected_files
                        }
                        
                        # Wyślij żądanie do endpointu preprocessingu
                        response = requests.post(
                            f"{API_BASE_URL}/docs/preprocess",
                            json=preprocessing_data
                        )
                        
                        if response.status_code == 200:
                            result = response.json()
                            st.success("Preprocessing completed successfully!")
                            
                            # Wyświetl szczegóły wyniku
                            if "preprocessed" in result:
                                for doc_result in result["preprocessed"]:
                                    st.write(f"📄 **{doc_result['filename']}**: {doc_result['chunks_added']} chunks added")
                                    if "metadata" in doc_result:
                                        st.write(f"   Metadata: {doc_result['metadata']}")
                        else:
                            # Obsługa błędów HTTP
                            error_detail = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                            st.error(f"Preprocessing failed with status code: {response.status_code}")
                            st.error(f"Error details: {error_detail}")
                            
                    except requests.exceptions.RequestException as e:
                        st.error(f"Request error: {str(e)}")
                        st.write(f"**Debug info:** {str(e)}")
                        
                    except Exception as e:
                        st.error(f"Unexpected error during preprocessing: {str(e)}")
                        st.write(f"**Debug info:** {str(e)}")
                        
            else:
                st.info("Please select at least one document to preprocess.")

        else:
            st.error(f"Error retrieving documents: {documents.status_code} - {documents.text}")
        
    except Exception as e:
        st.error(f"An error occurred while retrieving documents: {str(e)}")


def chat_with_documents():
    st.subheader("Ask anything me about your documents.")
    try:
        question = st.text_input("Question:")
        if st.button("Ask"):
            st.write(f"Question: {question}")
            response = requests.post(f"{API_BASE_URL}/chat/", json={"question": question})
            if response.status_code == 200:
                st.write(response.json())
            else:
                st.error(f"Error asking a question: {response.status_code} - {response.text}")
    except Exception as e:
        st.error(f"An error occurred while asking a question: {str(e)}")

