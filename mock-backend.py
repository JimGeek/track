#!/usr/bin/env python3
"""
Mock Backend Server for Track Calendar Testing
Provides minimal API endpoints for authentication and task management
Runs on port 8001 to match frontend expectations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
import json

app = Flask(__name__)
CORS(app, origins=["http://localhost:3001"])

# Mock data storage
users = {
    "demo@example.com": {
        "id": "user_1",
        "email": "demo@example.com",
        "first_name": "Demo",
        "last_name": "User",
        "password": "password123"  # In real app, this would be hashed
    }
}

# Sample tasks with various statuses, priorities, and dates
sample_tasks = [
    {
        "id": str(uuid.uuid4()),
        "title": "Design System Setup",
        "description": "Set up the design system with tokens and components",
        "status": "todo",
        "priority": "high",
        "start_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
        "is_overdue": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "todo_list": "project_1",
        "can_edit": True
    },
    {
        "id": str(uuid.uuid4()),
        "title": "User Authentication",
        "description": "Implement secure login and registration",
        "status": "ongoing",
        "priority": "urgent",
        "start_date": datetime.now().strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
        "is_overdue": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "todo_list": "project_1",
        "can_edit": True
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Database Migration",
        "description": "Complete database schema migration",
        "status": "done",
        "priority": "medium",
        "start_date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
        "is_overdue": False,
        "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "todo_list": "project_1"
    },
    {
        "id": str(uuid.uuid4()),
        "title": "UI/UX Review",
        "description": "Review and improve user interface designs",
        "status": "todo",
        "priority": "low",
        "start_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "is_overdue": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "todo_list": "project_2",
        "can_edit": True
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Performance Testing",
        "description": "Conduct comprehensive performance tests",
        "status": "ongoing",
        "priority": "high",
        "start_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "is_overdue": False,
        "created_at": (datetime.now() - timedelta(days=3)).isoformat(),
        "updated_at": datetime.now().isoformat(),
        "todo_list": "project_2",
        "can_edit": True
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Overdue Task Example",
        "description": "This task is overdue for testing purposes",
        "status": "todo",
        "priority": "urgent",
        "start_date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "is_overdue": True,
        "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=1)).isoformat(),
        "todo_list": "project_3",
        "can_edit": True
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Calendar Integration",
        "description": "Implement calendar view for task management",
        "status": "ongoing",
        "priority": "medium",
        "start_date": datetime.now().strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
        "is_overdue": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "todo_list": "project_3",
        "can_edit": True
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Mobile Responsive Design",
        "description": "Make the application mobile-friendly",
        "status": "done",
        "priority": "high",
        "start_date": (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() - timedelta(days=6)).strftime("%Y-%m-%d"),
        "is_overdue": False,
        "created_at": (datetime.now() - timedelta(days=15)).isoformat(),
        "updated_at": (datetime.now() - timedelta(days=6)).isoformat(),
        "todo_list": "project_1"
    }
]

# Mock authentication token
current_user = None

@app.route('/api/auth/login/', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if email in users and users[email]['password'] == password:
        global current_user
        current_user = users[email]
        return jsonify({
            "access": "mock_access_token",
            "refresh": "mock_refresh_token",
            "user": {
                "id": current_user["id"],
                "email": current_user["email"],
                "first_name": current_user["first_name"],
                "last_name": current_user["last_name"]
            },
            "message": "Login successful"
        })
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/auth/profile/', methods=['GET'])
def get_profile():
    if current_user:
        return jsonify({
            "id": current_user["id"],
            "email": current_user["email"],
            "first_name": current_user["first_name"],
            "last_name": current_user["last_name"]
        })
    else:
        return jsonify({"error": "Not authenticated"}), 401

@app.route('/api/auth/logout/', methods=['POST'])
def logout():
    global current_user
    current_user = None
    return jsonify({"message": "Logged out successfully"})

@app.route('/api/tasks/', methods=['GET'])
def get_tasks():
    if not current_user:
        return jsonify({"error": "Not authenticated"}), 401
    
    # Get query parameters for date filtering
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    tasks = sample_tasks.copy()
    
    # Filter by date range if provided
    if start_date or end_date:
        filtered_tasks = []
        for task in tasks:
            task_start = datetime.strptime(task['start_date'], "%Y-%m-%d") if task['start_date'] else None
            task_end = datetime.strptime(task['end_date'], "%Y-%m-%d") if task['end_date'] else None
            
            # Check if task overlaps with requested range
            if start_date:
                range_start = datetime.strptime(start_date, "%Y-%m-%d")
                if task_end and task_end < range_start:
                    continue
            
            if end_date:
                range_end = datetime.strptime(end_date, "%Y-%m-%d")
                if task_start and task_start > range_end:
                    continue
            
            filtered_tasks.append(task)
        
        tasks = filtered_tasks
    
    return jsonify({
        "results": tasks,
        "count": len(tasks)
    })

@app.route('/api/tasks/', methods=['POST'])
def create_task():
    if not current_user:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    new_task = {
        "id": str(uuid.uuid4()),
        "title": data.get('title', ''),
        "description": data.get('description', ''),
        "status": data.get('status', 'todo'),
        "priority": data.get('priority', 'medium'),
        "start_date": data.get('start_date'),
        "end_date": data.get('end_date'),
        "is_overdue": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "todo_list": data.get('todo_list', 'default')
    }
    
    sample_tasks.append(new_task)
    return jsonify(new_task), 201

@app.route('/api/tasks/<task_id>/', methods=['PUT'])
def update_task(task_id):
    if not current_user:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    
    for i, task in enumerate(sample_tasks):
        if task['id'] == task_id:
            # Update task fields
            for field in ['title', 'description', 'status', 'priority', 'start_date', 'end_date']:
                if field in data:
                    task[field] = data[field]
            
            task['updated_at'] = datetime.now().isoformat()
            sample_tasks[i] = task
            return jsonify(task)
    
    return jsonify({"error": "Task not found"}), 404

@app.route('/api/tasks/<task_id>/', methods=['DELETE'])
def delete_task(task_id):
    if not current_user:
        return jsonify({"error": "Not authenticated"}), 401
    
    for i, task in enumerate(sample_tasks):
        if task['id'] == task_id:
            deleted_task = sample_tasks.pop(i)
            return jsonify({"message": "Task deleted successfully"})
    
    return jsonify({"error": "Task not found"}), 404

@app.route('/api/dashboard/summary/', methods=['GET'])
def dashboard_summary():
    if not current_user:
        return jsonify({"error": "Not authenticated"}), 401
    
    total_tasks = len(sample_tasks)
    completed_tasks = len([t for t in sample_tasks if t['status'] == 'done'])
    ongoing_tasks = len([t for t in sample_tasks if t['status'] == 'ongoing'])
    overdue_tasks = len([t for t in sample_tasks if t['is_overdue']])
    
    return jsonify({
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "ongoing_tasks": ongoing_tasks,
        "overdue_tasks": overdue_tasks
    })

if __name__ == '__main__':
    print("🚀 Starting Mock Backend Server for Calendar Testing")
    print("📍 Running on http://localhost:8001")
    print("🔑 Demo login: demo@example.com / password123")
    print("📊 Sample tasks loaded for calendar testing")
    print("")
    app.run(host='0.0.0.0', port=8001, debug=True)