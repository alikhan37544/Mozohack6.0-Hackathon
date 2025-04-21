from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
from flask_migrate import Migrate
import random
from datetime import datetime, timedelta
from config import Config
from models import db, User, InventoryItem, ActivityLog

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize database
db.init_app(app)
migrate = Migrate(app, db)

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/inventory')
def api_inventory():
    # Get all inventory items from database
    items = InventoryItem.query.all()
    return jsonify([item.serialize() for item in items])

@app.route('/api/inventory/categories')
def api_inventory_categories():
    # Get inventory counts by category
    categories = db.session.query(
        InventoryItem.category, 
        db.func.sum(InventoryItem.quantity).label('total')
    ).group_by(InventoryItem.category).all()
    
    return jsonify([{
        'category': cat,
        'total': total
    } for cat, total in categories])

@app.route('/api/inventory/expiring')
def api_inventory_expiring():
    # Get items expiring soon (within 30 days)
    thirty_days = datetime.utcnow() + timedelta(days=30)
    items = InventoryItem.query.filter(
        InventoryItem.expiration_date.isnot(None),
        InventoryItem.expiration_date <= thirty_days
    ).order_by(InventoryItem.expiration_date).all()
    
    return jsonify([item.serialize() for item in items])

@app.route('/api/activity')
def api_activity():
    # Get recent activities
    activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    return jsonify([activity.serialize() for activity in activities])

@app.route('/api/estimate', methods=['POST'])
def api_estimate():
    data = request.json
    patient_info = data.get('patient_info', {})
    # TODO: Replace with real RAG call
    # For now, return a mock estimation
    return jsonify({
        "estimated_time": f"{random.randint(1, 8)} hours",
        "resources": [
            {"name": "IV Solution (1L)", "amount": random.randint(1, 3)},
            {"name": "Surgical Masks", "amount": random.randint(2, 10)}
        ],
        "explanation": "This is a mock estimation. Integrate with Ollama RAG for real results."
    })

@app.route('/update_inventory', methods=['POST'])
def update_inventory():
    data = request.json
    item_id = data.get('id')
    new_quantity = data.get('quantity')
    
    item = InventoryItem.query.get_or_404(item_id)
    old_quantity = item.quantity
    quantity_change = new_quantity - old_quantity
    
    # Update item
    item.quantity = new_quantity
    
    # Update status based on quantity
    if new_quantity < 50:
        item.status = 'low'
    elif new_quantity < 200:
        item.status = 'medium'
    else:
        item.status = 'good'
    
    item.last_updated = datetime.utcnow()
    
    # Log activity
    activity = ActivityLog(
        action='updated',
        item_id=item.id,
        quantity_change=quantity_change,
        description=f"Updated quantity from {old_quantity} to {new_quantity}"
    )
    
    db.session.add(activity)
    db.session.commit()
    
    return jsonify(success=True)

# Initialize database with sample data
@app.cli.command('init-db')
def init_db_command():
    """Initialize the database with sample data."""
    # Create tables
    db.create_all()
    
    # Check if we already have data
    if InventoryItem.query.count() > 0:
        print('Database already contains data. Skipping initialization.')
        return
    
    # Create sample inventory items
    items = [
        InventoryItem(
            name="Surgical Masks", 
            category="PPE", 
            location="Storage A", 
            quantity=1250, 
            status="good", 
            last_updated=datetime.utcnow() - timedelta(hours=3),
            expiration_date=datetime.utcnow() + timedelta(days=180)
        ),
        InventoryItem(
            name="Nitrile Gloves (M)", 
            category="PPE", 
            location="Storage B", 
            quantity=850, 
            status="medium", 
            last_updated=datetime.utcnow() - timedelta(days=1, hours=5),
            expiration_date=datetime.utcnow() + timedelta(days=365)
        ),
        InventoryItem(
            name="Insulin", 
            category="Medication", 
            location="Pharmacy", 
            quantity=120, 
            status="low", 
            last_updated=datetime.utcnow() - timedelta(days=10),
            expiration_date=datetime.utcnow() + timedelta(days=15)
        ),
        InventoryItem(
            name="IV Solution (1L)", 
            category="Fluids", 
            location="Storage C", 
            quantity=432, 
            status="good", 
            last_updated=datetime.utcnow() - timedelta(days=12),
            expiration_date=datetime.utcnow() + timedelta(days=180)
        ),
        InventoryItem(
            name="Syringes (10ml)", 
            category="Supplies", 
            location="Storage A", 
            quantity=75, 
            status="low", 
            last_updated=datetime.utcnow() - timedelta(days=13),
            expiration_date=datetime.utcnow() + timedelta(days=730)
        ),
        InventoryItem(
            name="Gauze Pads", 
            category="Supplies", 
            location="Storage B", 
            quantity=620, 
            status="good", 
            last_updated=datetime.utcnow() - timedelta(days=14),
            expiration_date=datetime.utcnow() + timedelta(days=365)
        ),
        InventoryItem(
            name="Ventilator Filters", 
            category="Equipment", 
            location="ICU Storage", 
            quantity=28, 
            status="low", 
            last_updated=datetime.utcnow() - timedelta(days=15),
            expiration_date=datetime.utcnow() + timedelta(days=25)
        ),
        InventoryItem(
            name="N95 Respirators", 
            category="PPE", 
            location="Storage A", 
            quantity=450, 
            status="good", 
            last_updated=datetime.utcnow() - timedelta(days=5),
            expiration_date=datetime.utcnow() + timedelta(days=545)
        )
    ]
    
    db.session.add_all(items)
    
    # Create an admin user
    admin = User(username='admin', email='admin@example.com', role='admin')
    admin.set_password('admin123')
    db.session.add(admin)
    
    # Create sample activities
    activities = [
        ActivityLog(
            timestamp=datetime.utcnow() - timedelta(hours=2),
            action='added',
            item_id=1,
            quantity_change=50,
            description="Received new shipment of surgical masks"
        ),
        ActivityLog(
            timestamp=datetime.utcnow() - timedelta(days=1),
            action='updated',
            item_id=2,
            quantity_change=-25,
            description="Distributed to Emergency Department"
        ),
        ActivityLog(
            timestamp=datetime.utcnow() - timedelta(days=2),
            action='updated',
            item_id=3,
            quantity_change=-5,
            description="Used for patient care"
        )
    ]
    
    db.session.add_all(activities)
    db.session.commit()
    
    print('Database initialized with sample data!')

if __name__ == '__main__':
    app.run(debug=True, port=5001)
