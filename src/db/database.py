from sqlmodel import create_engine, Session
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db/sqlite3")
engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    return Session(engine)
