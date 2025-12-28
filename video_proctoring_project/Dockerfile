FROM python:3.10-slim

# Install system dependencies for OpenCV and others
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

# Switch to the "user" user
USER user

# Set home to the user's home directory
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set working directory to the user's home directory
WORKDIR $HOME/app

# Copy the current directory contents into the container at $HOME/app setting the owner to the user
COPY --chown=user . $HOME/app

# Install requirements
RUN pip install --no-cache-dir -r requirements.txt

# Change to the django project directory
WORKDIR $HOME/app/proctoring

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port 7860
EXPOSE 7860

# Start the application
CMD ["gunicorn", "proctoring.wsgi:application", "--bind", "0.0.0.0:7860", "--workers", "2", "--timeout", "120"]
