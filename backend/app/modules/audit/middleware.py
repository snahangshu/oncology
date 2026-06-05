import threading
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError

from app.config import settings
from app.dependencies import SessionLocal
from app.modules.users.credential_models import AuditLog

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Execute the request
        response = await call_next(request)
        
        path = request.url.path
        if not path.startswith("/api/v1/"):
            return response
            
        # Ignore dashboard GET requests to prevent the polling from flooding its own audit logs
        if "/dashboards/" in path and request.method == "GET":
            return response
            
        # Ignore audit log GET requests
        if "/audit" in path and request.method == "GET":
            return response

        # 2. Extract JWT User ID if present
        auth_header = request.headers.get("Authorization")
        user_id = None
        role = "SYSTEM"
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                sub = payload.get("sub")
                if sub and sub.isdigit():
                    user_id = int(sub)
                role = payload.get("role", "UNKNOWN")
            except JWTError:
                pass
                
        # 3. Determine Action Context
        action = f"API_REQUEST"
        if request.method == "GET":
            action = "PHI_VIEWED" if "patient" in path else "DATA_ACCESSED"
        elif request.method == "POST":
            action = "DATA_CREATED"
        elif request.method in ["PUT", "PATCH"]:
            action = "DATA_MODIFIED"
        elif request.method == "DELETE":
            action = "DATA_DELETED"
            
        if response.status_code >= 400:
            if response.status_code in [401, 403]:
                action = "UNAUTHORIZED_ACCESS_ATTEMPT"
            else:
                action = "API_FAILED"
                
        # 4. Fire-and-forget logging to not block API performance
        def write_audit_log():
            db = SessionLocal()
            try:
                log = AuditLog(
                    performed_by=user_id,
                    entity_type="API_Route",
                    entity_id=0,
                    action=action,
                    details=f"[{role}] {request.method} {path} (Status: {response.status_code})"
                )
                db.add(log)
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"Audit log failed: {e}")
            finally:
                db.close()
                
        threading.Thread(target=write_audit_log).start()
        
        return response
