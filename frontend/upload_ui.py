import streamlit as st
import requests

def render_upload_ui():
    st.title("Upload PDF Document")

    file = st.file_uploader("Upload PDF file", type=["pdf"])
    confidentiality = st.selectbox("Confidentiality", ["public","internal", "confidential"])
    department = st.text_input("Department")
    client = st.text_input("Client")

    if st.button("Upload"):
        if not file:
            st.warning("Please upload a PDF file.")
            return

        # if not department or not client:
        #     st.warning("Please fill in all metadata fields.")
        #     return
        
        try:
            files = {"file": (file.name, file.getvalue(), "application/pdf")}
            data = {"confidentiality": confidentiality,
                    "department": department,
                    "client": client}
            
            response = requests.post("http://localhost:8000/upload", files=files, data=data)

            if response.status_code == 200:
                st.success("File uploaded successfully!")
                st.json(response.json())
            else:
                st.error(f"Error uploading file: {response.status_cocde} - {response.text}")
        except Exception as e:
            st.error("An error occurred while uploading the file.")