from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import InvalidTokenError

from app.config import settings
from app.dependencies import get_db
from app.modules.users.models import User, Role
from app.modules.users.schemas import TokenData
from app.modules.users.security import ALGORITHM
from app.modules.users.repository import UserRepository

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token:
        # Fallback to Authorization header for backward compatibility / testing
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated or invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except InvalidTokenError:
        raise credentials_exception
    
    repo = UserRepository(db)
    user = repo.get_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(roles: list[Role]):
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

async def get_current_user_ws(token: str) -> User:
    from app.dependencies import SessionLocal
    db = SessionLocal()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            return None
        repo = UserRepository(db)
        user = repo.get_by_email(email=email)
        return user
    except Exception:
        return None
    finally:
        db.close()
