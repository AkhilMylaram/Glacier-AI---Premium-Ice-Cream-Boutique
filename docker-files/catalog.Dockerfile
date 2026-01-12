# Catalog Service Dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app

# Copy requirements and install dependencies
COPY catalog-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY catalog-service/ ./

# Final stage
FROM python:3.12-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY catalog-service/ ./

# Expose port
EXPOSE 3002

# Run the application
CMD ["python", "main.py"]
