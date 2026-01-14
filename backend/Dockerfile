FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client gcc musl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn uvicorn

COPY . .

# Make start script executable
COPY start_prod.sh /app/start_prod.sh
RUN chmod +x /app/start_prod.sh

CMD ["/app/start_prod.sh"]
