#!/bin/bash

# Track VPS Deployment Setup Script
# This script sets up the production environment on Ubuntu VPS

set -e  # Exit on any error

echo "🚀 Starting Track VPS deployment setup..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib redis-server supervisor git curl

# Install Node.js (for any frontend build tools)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create application user
echo "👤 Creating application user..."
sudo useradd -m -s /bin/bash trackapp || echo "User trackapp already exists"

# Set up Python virtual environment
echo "🐍 Setting up Python virtual environment..."
sudo -u trackapp python3 -m venv /home/trackapp/venv

# Create application directories
echo "📁 Creating application directories..."
sudo mkdir -p /var/log/track
sudo mkdir -p /var/www/track
sudo chown -R trackapp:trackapp /var/log/track /var/www/track

# PostgreSQL setup
echo "🗄️ Setting up PostgreSQL..."
sudo -u postgres psql << EOF
CREATE DATABASE track_db;
CREATE USER track_user WITH PASSWORD 'track_secure_password_2024';
GRANT ALL PRIVILEGES ON DATABASE track_db TO track_user;
ALTER USER track_user CREATEDB;
\q
EOF

# Redis setup
echo "🔴 Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Nginx configuration
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/track-api > /dev/null << 'EOF'
server {
    listen 80;
    server_name track-api.marvelhomes.pro;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API proxy
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
        proxy_buffering off;
    }

    # Static files
    location /static/ {
        alias /var/www/track/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/track/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Health check
    location /health/ {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/track-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Supervisor configuration for Django app
echo "👮 Setting up Supervisor..."
sudo tee /etc/supervisor/conf.d/track.conf > /dev/null << 'EOF'
[program:track_web]
command=/home/trackapp/venv/bin/gunicorn track_project.wsgi:application
directory=/home/jimit/production-projects/track/backend
user=trackapp
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/track/gunicorn.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=5
environment=PATH="/home/trackapp/venv/bin",DJANGO_SETTINGS_MODULE="track_project.settings"

[program:track_celery]
command=/home/trackapp/venv/bin/celery -A track_project worker -l info
directory=/home/jimit/production-projects/track/backend
user=trackapp
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/track/celery.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=5
environment=PATH="/home/trackapp/venv/bin",DJANGO_SETTINGS_MODULE="track_project.settings"
EOF

# Install SSL certificate with Let's Encrypt
echo "🔒 Setting up SSL certificate..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d track-api.marvelhomes.pro --non-interactive --agree-tos --email admin@marvelhomes.pro || echo "SSL setup will be completed manually"

# Install Python dependencies
echo "📚 Installing Python dependencies..."
cd /home/jimit/production-projects/track/backend
sudo -u trackapp /home/trackapp/venv/bin/pip install -r requirements.txt
sudo -u trackapp /home/trackapp/venv/bin/pip install gunicorn

# Create production environment file
echo "🔧 Creating production environment..."
sudo -u trackapp tee /home/jimit/production-projects/track/backend/.env.production > /dev/null << 'EOF'
DEBUG=False
SECRET_KEY=your-production-secret-key-here-change-this
JWT_SECRET_KEY=your-jwt-production-secret-key-here-change-this

# Database
DATABASE_URL=postgresql://track_user:track_secure_password_2024@localhost:5432/track_db

# Redis
REDIS_URL=redis://127.0.0.1:6379/0

# Email (configure with your SMTP settings)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@marvelhomes.pro

# Security
ALLOWED_HOSTS=track-api.marvelhomes.pro,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://track.vercel.app

# Static files
STATIC_ROOT=/var/www/track/staticfiles/
MEDIA_ROOT=/var/www/track/media/
EOF

# Run Django setup
echo "🎯 Running Django setup..."
cd /home/jimit/production-projects/track/backend
sudo -u trackapp /home/trackapp/venv/bin/python manage.py collectstatic --noinput --settings=track_project.settings
sudo -u trackapp /home/trackapp/venv/bin/python manage.py migrate --settings=track_project.settings

# Start services
echo "🚀 Starting services..."
sudo supervisorctl reread
sudo supervisorctl update
sudo systemctl restart nginx
sudo systemctl enable supervisor

echo "✅ Track VPS deployment setup complete!"
echo "🌐 API will be available at: https://track-api.marvelhomes.pro"
echo "📋 Next steps:"
echo "   1. Update .env.production with real secret keys"
echo "   2. Configure email settings"
echo "   3. Create Django superuser"
echo "   4. Test the deployment"

# Display service status
echo "📊 Service Status:"
sudo supervisorctl status
sudo systemctl status nginx --no-pager -l