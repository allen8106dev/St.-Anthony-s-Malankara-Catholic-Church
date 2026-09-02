from urllib.parse import parse_qs, urlsplit

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

connect_args = {}
parsed = urlsplit(settings.DATABASE_URL)
query = parse_qs(parsed.query, keep_blank_values=True)
if "sslmode" not in query:
    connect_args = {"sslmode": "require"}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
