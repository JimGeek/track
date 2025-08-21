#!/usr/bin/env python3
import os
import json
import subprocess
import sys
import hashlib
import hmac
from http.server import BaseHTTPRequestHandler, HTTPServer

# Configuration
WEBHOOK_SECRET = "track-webhook-secret-2024"
PROJECT_DIR = "/home/jimit/production-projects/track"
BACKEND_DIR = "/home/jimit/production-projects/track/backend"
VENV_DIR = "/tmp/track_venv"

def verify_signature(payload_body, signature_header):
    """Verify the webhook signature"""
    if not signature_header:
        return False
    
    sha_name, signature = signature_header.split('=')
    if sha_name != 'sha256':
        return False
    
    mac = hmac.new(WEBHOOK_SECRET.encode(), msg=payload_body, digestmod=hashlib.sha256)
    return hmac.compare_digest(mac.hexdigest(), signature)

def deploy():
    """Deploy the application"""
    try:
        # Change to project directory
        os.chdir(PROJECT_DIR)
        
        # Pull latest changes
        subprocess.run(['git', 'fetch', '--all'], check=True)
        subprocess.run(['git', 'checkout', 'main'], check=True)
        subprocess.run(['git', 'pull', 'origin', 'main'], check=True)
        
        # Change to backend directory
        os.chdir(BACKEND_DIR)
        
        # Set environment variables
        env = os.environ.copy()
        env['DJANGO_SETTINGS_MODULE'] = 'track_project.settings'
        env['PATH'] = f"{VENV_DIR}/bin:" + env['PATH']
        
        # Run migrations
        subprocess.run([f'{VENV_DIR}/bin/python', 'manage.py', 'migrate'], 
                      check=True, env=env)
        
        # Collect static files
        subprocess.run([f'{VENV_DIR}/bin/python', 'manage.py', 'collectstatic', '--noinput'], 
                      check=True, env=env)
        
        # Restart the application
        subprocess.run(['sudo', 'supervisorctl', 'restart', 'track_web'], check=True)
        
        print("Deployment completed successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Deployment failed: {e}")
        return False

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/webhook':
            self.send_response(404)
            self.end_headers()
            return
        
        content_length = int(self.headers.get('Content-Length', 0))
        payload = self.rfile.read(content_length)
        
        signature = self.headers.get('X-Hub-Signature-256')
        
        # Verify signature
        if not verify_signature(payload, signature):
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b'Forbidden')
            return
        
        try:
            data = json.loads(payload.decode())
            
            # Check if it's a push to main branch
            if (data.get('ref') == 'refs/heads/main' and 
                data.get('repository', {}).get('name') == 'track'):
                
                print("Received push to main branch, deploying...")
                success = deploy()
                
                if success:
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b'Deployment successful')
                else:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(b'Deployment failed')
            else:
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'Not a main branch push, ignoring')
                
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Invalid JSON')
    
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9000
    server = HTTPServer(('127.0.0.1', port), WebhookHandler)
    print(f"Webhook server starting on port {port}...")
    server.serve_forever()
