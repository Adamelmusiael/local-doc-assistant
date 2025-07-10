from sqlmodel import SQLModel
from .database import engine
from .models import Document

def init_db():
    SQLModel.metadata.create_all(engine)