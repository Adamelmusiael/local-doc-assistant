import streamlit as st
from upload_ui import render_upload_ui
from documents_ui import render_documents_ui
from chat_ui import render_chat_ui

st.sidebar.title("Navigation")
page = st.sidebar.radio("Select a page:", ["Upload", "Documents"])

if page == "Upload":
    render_upload_ui()
elif page == "Documents":
     render_documents_ui()
elif page == "Chat":
    render_chat_ui()