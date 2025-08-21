#!/bin/bash
cd /home/jimit/production-projects/track/backend
export $(grep -v '^#' .env.production | xargs)
exec /tmp/track_venv/bin/gunicorn track_project.wsgi:application --bind 127.0.0.1:8000 --workers 3
