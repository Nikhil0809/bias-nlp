from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./fairnlp.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class BiasAnalysis(Base):
    __tablename__ = "bias_analyses"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, index=True)
    bias_detected = Column(Boolean, default=False)
    bias_type = Column(String, index=True)
    confidence = Column(Float)
    fairness_score = Column(Float)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
