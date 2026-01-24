"""
Production settings for Gastos Distribuidos project.
"""

from .base import *  # noqa

DEBUG = False

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# SSL/HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Logging for production
LOGGING['handlers']['file'] = {  # noqa: F405
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': BASE_DIR / 'logs' / 'django.log',  # noqa: F405
    'maxBytes': 1024 * 1024 * 10,  # 10 MB
    'backupCount': 5,
    'formatter': 'json',
}

LOGGING['root']['handlers'] = ['console', 'file']  # noqa: F405
