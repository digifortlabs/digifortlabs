"""
Security middleware for rate limiting and security headers.
"""
from fastapi import Request, HTTPException
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import time


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent brute force attacks.
    Limits requests per IP address per time window.
    """
    
    def __init__(self, app, requests_per_minute: int = 60, auth_requests_per_minute: int = 5):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.auth_requests_per_minute = auth_requests_per_minute
        self.request_counts = defaultdict(list)
        self.auth_paths = ["/auth/login", "/auth/verify-otp", "/auth/forgot-password"]
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)
            
        client_ip = request.client.host
        path = request.url.path
        current_time = time.time()
        
        # Determine rate limit based on path
        is_auth_endpoint = any(path.startswith(auth_path) for auth_path in self.auth_paths)
        limit = self.auth_requests_per_minute if is_auth_endpoint else self.requests_per_minute
        window = 60  # 1 minute window
        
        # Clean old requests
        self.request_counts[client_ip] = [
            req_time for req_time in self.request_counts[client_ip]
            if current_time - req_time < window
        ]
        
        # Check rate limit
        if len(self.request_counts[client_ip]) >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {limit} requests per minute."
            )
        
        # Record this request
        self.request_counts[client_ip].append(current_time)
        
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to all responses.
    """
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # HSTS (HTTP Strict Transport Security) - only in production with HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://digifortlabs.com https://icdaccessmanagement.who.int https://id.who.int; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        return response
