
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/auth", tags=["Authentication API"])


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class RegisterRequest(BaseModel):
    name: str = Field(..., description="Full Name")
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")
    role: Optional[str] = Field(default="Administrator", description="Role")


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates user credentials and returns an access token."
)
def login(payload: LoginRequest) -> AuthResponse:
    clean_email = payload.email.strip().lower()
    
    # Validation
    if not clean_email or "@" not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )
    if len(payload.password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long."
        )

    # Demo / Standard admin mock token generation
    user_name = clean_email.split("@")[0].replace(".", " ").title()
    if clean_email == "admin@eduanalytics.io":
        user_name = "Dr. Sarah Jenkins"

    user_data = {
        "id": "usr_101",
        "name": user_name or "Administrator",
        "email": clean_email,
        "role": "Academic Administrator",
        "avatar_initials": "".join([part[0].upper() for part in user_name.split()[:2]]) or "AD"
    }

    return AuthResponse(
        access_token=f"demo_token_{user_data['id']}_xyz",
        token_type="bearer",
        user=user_data
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Creates a new account and returns authentication credentials."
)
def register(payload: RegisterRequest) -> AuthResponse:
    clean_email = payload.email.strip().lower()
    clean_name = payload.name.strip()

    if not clean_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name is required.")
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Valid email is required.")
    if len(payload.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters.")

    initials = "".join([part[0].upper() for part in clean_name.split()[:2]]) or "US"

    user_data = {
        "id": f"usr_{hash(clean_email) % 100000}",
        "name": clean_name,
        "email": clean_email,
        "role": payload.role or "Faculty Educator",
        "avatar_initials": initials
    }

    return AuthResponse(
        access_token=f"demo_token_{user_data['id']}_reg",
        token_type="bearer",
        user=user_data
    )
