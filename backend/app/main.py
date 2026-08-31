from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.api import api_router
from app.core.config import settings
from app.core.exceptions import application_exception_handler

app = FastAPI(title=settings.PROJECT_NAME, openapi_url="/api/v1/openapi.json")
app.add_exception_handler(Exception, application_exception_handler)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(api_router, prefix="/api/v1")
