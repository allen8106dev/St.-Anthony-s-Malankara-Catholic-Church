from __future__ import annotations
import pytest
from starlette.testclient import TestClient
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import Settings
from app.main import app

def test_cors_origins_parsing():
    s = Settings(
        DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/db",
        SECRET_KEY="a-very-long-secret-key-for-testing",
        CORS_ORIGINS=' "https://st-anthony.vercel.app/", https://preview.vercel.app/ ',
        FRONTEND_URL="https://frontend.vercel.app/",
    )
    assert s.cors_origins == [
        "https://st-anthony.vercel.app",
        "https://preview.vercel.app",
        "https://frontend.vercel.app",
    ]

def test_cors_origins_json_format():
    s = Settings(
        DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/db",
        SECRET_KEY="a-very-long-secret-key-for-testing",
        CORS_ORIGINS='["https://app.vercel.app/"]',
        FRONTEND_URL="",
    )
    assert s.cors_origins == ["https://app.vercel.app"]

def test_cors_wildcard_forbidden():
    with pytest.raises(ValueError, match="CORS_ORIGINS must not contain"):
        Settings(
            DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/db",
            SECRET_KEY="a-very-long-secret-key-for-testing",
            CORS_ORIGINS="*",
        )

def test_cookie_samesite_and_secure_rules():
    dev = Settings(
        DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/db",
        SECRET_KEY="a-very-long-secret-key-for-testing",
        ENVIRONMENT="development",
        COOKIE_SECURE=False,
    )
    assert dev.cookie_secure is False
    assert dev.cookie_samesite == "lax"

    prod = Settings(
        DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/db",
        SECRET_KEY="a-very-long-secret-key-for-testing-prod-12345",
        ENVIRONMENT="production",
        COOKIE_SECURE=True,
    )
    assert prod.cookie_secure is True
    assert prod.cookie_samesite == "none"

    with pytest.raises(ValueError, match="COOKIE_SAMESITE='none' requires COOKIE_SECURE=true"):
        Settings(
            DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/db",
            SECRET_KEY="a-very-long-secret-key-for-testing",
            COOKIE_SECURE=False,
            COOKIE_SAMESITE="none",
        )

def test_cors_preflight_and_credentials():
    client = TestClient(app)

    res = client.options(
        "/api/v1/auth/me",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert res.headers["access-control-allow-credentials"] == "true"
    assert "GET" in res.headers["access-control-allow-methods"]

    disallowed = client.options(
        "/api/v1/auth/me",
        headers={
            "Origin": "https://malicious-site.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert disallowed.status_code == 400
    assert "Disallowed CORS origin" in disallowed.text

def test_cors_regex_origin():
    custom_app = FastAPI()
    custom_app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://production.vercel.app"],
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @custom_app.get("/test")
    def sample():
        return {"status": "ok"}

    client = TestClient(custom_app)

    # Preview branch should be allowed via regex
    res = client.options(
        "/test",
        headers={
            "Origin": "https://church-platform-git-preview-allen.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == "https://church-platform-git-preview-allen.vercel.app"
    assert res.headers["access-control-allow-credentials"] == "true"

    # Non-matching origin should fail
    bad = client.options(
        "/test",
        headers={
            "Origin": "https://evil.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert bad.status_code == 400
