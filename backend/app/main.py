from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.session import engine, Base
from app.database import models  # needed so SQLAlchemy registers ORM models before create_all
from app.routers import dataset, ml, prediction, dashboard, auth


# Create database tables on startup if they don't already exist
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)


# Allow requests from the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dataset.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)
app.include_router(prediction.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler so unhandled errors return JSON instead of a stack trace."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "path": str(request.url)
        }
    )


@app.get("/", tags=["Health Check"])
def root_health_check():
    """Simple root endpoint to confirm the API is running."""
    return {
        "system": settings.PROJECT_NAME,
        "status": "running",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "api_base": settings.API_V1_STR
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
