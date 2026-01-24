# Backend Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libffi-dev \
    libxml2-dev \
    libxslt1-dev \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    shared-mime-info \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements/ /app/requirements/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements/development.txt

# Copy project
COPY . /app/

# Create directories for static and media files
RUN mkdir -p /app/staticfiles /app/media

# Expose port
EXPOSE 8000

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
