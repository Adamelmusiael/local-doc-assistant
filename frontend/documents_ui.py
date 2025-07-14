import streamlit as st
import requests

API_BASE_URL = "http://localhost:8000"

def render_documents_ui():
    st.title("Manage documents")

    option = st.radio("Options:", ["List all uploaded documents",
                          "List document by id",
                          "Delete document by id",
                          "Display statistics"])
    
    if option == "List all uploaded documents":
        list_all_docs()
    elif option == "List document by id": # This will also have option to download document
        list_doc_by_id()
    elif option == "Delete document by id":
        delete_doc_by_id()
    elif option == "Display statistics":
        display_statistics()
    


# ------------------Helper functions-------------------
def list_all_docs():
    """List all uploaded documents with metadata"""
    st.subheader("List of all uploaded documents")
    try:
        response = requests.get(f"{API_BASE_URL}/docs/")
        if response.status_code == 200:
            data = response.json()
            docs = data.get('documents', [])
            if not docs:
                st.info("No documents found")
            for doc in docs:
                st.write(f"Document ID: {doc['id']}")
                st.write(f"Filename: {doc['filename']}")
                st.write(f"Confidentiality: {doc['confidentiality']}")
                st.write(f"Department: {doc['department']}")
                st.write(f"Client: {doc['client']}")
                st.write(f"File path: {doc['file_path']}")
                st.write(f"Created at: {doc['created_at']}")
                st.write(f"Processed: {doc['processed']}")
                st.write("---")
        else:
            st.error(f"Error retrieving documents: {response.status_code} - {response.text}")
    except Exception as e:
        st.error(f"An error occurred while retrieving documents: {str(e)}")

def list_doc_by_id():
    """List a specific document by ID"""
    st.subheader("List a specific document by ID")
    try:
        document_id = st.number_input("Enter Document ID", min_value=1, step=1)
        if st.button("Get Document"):
            response = requests.get(f"{API_BASE_URL}/docs/{document_id}")
            if response.status_code == 200:
                doc = response.json()
                st.write(f"Document ID: {doc['id']}")
                st.write(f"Filename: {doc['filename']}")
                st.write(f"Confidentiality: {doc['confidentiality']}")
                st.write(f"Department: {doc['department']}")
                st.write(f"Client: {doc['client']}")
                st.write(f"File path: {doc['file_path']}")
                st.write(f"File exists: {'Yes' if doc['file_exists'] else 'No'}")
                st.write(f"Created at: {doc['created_at']}")
                st.write(f"Processed: {doc['processed']}")
            else:
                st.error(f"Error retrieving document: {response.status_code} - {response.text}")
    except Exception as e:
        st.error(f"An error occcured whiile retriving document: {str(e)}")

def delete_doc_by_id():
    """"Delete a specific document by ID"""
    st.subheader("Delete a specific document by ID")
    try:
        document_id = st.number_input("Enter Document ID to delete", min_value=1, step=1)
        if st.button("Delete Document"):
            response = requests.delete(f"{API_BASE_URL}/docs/{document_id}")
            if response.status_code == 200:
                st.success("Document deleted successfully!")
            else:
                st.error(f"Error deleting document: {response.status_code} - {response.text}")
    except Exception as e:
        st.error(f"An error occurred while deleting document: {str(e)}")


def display_statistics():
    """"Display overall statistics about documents. 
    Such as total number of documents, number of processed documents, etc."""
    st.subheader("Document Statistics")
    try:
        response = requests.get(f"{API_BASE_URL}/docs/stats")
        if response.status_code == 200:
            stats = response.json()

            st.write(f"Database Status: {stats['database_status']}")
            st.write(f"Total Documents: {stats['statistics']['total_documents']}")
            st.write(f"Processed Documents: {stats['statistics']['processed_documents']}")
        else:
            st.error(f"Error retrieving statistics: {response.status_code} - {response.text}")
    except Exception as e:
        st.error(f"An error occured while retrieving statistics: {str(e)}")