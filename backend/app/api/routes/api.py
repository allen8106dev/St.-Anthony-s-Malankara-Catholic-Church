from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.public import router as public_router
from app.api.routes.auth import router as auth_router
from app.api.routes.admin import router as admin_router
from app.api.routes.cms import router as cms_router
api_router = APIRouter()
api_router.include_router(health_router, tags=["system"])
api_router.include_router(public_router, tags=["public"])
api_router.include_router(auth_router, tags=["authentication"])
api_router.include_router(admin_router, tags=["admin"])
api_router.include_router(cms_router, tags=["cms"])
