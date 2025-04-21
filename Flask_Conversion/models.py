from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    email = db.Column(db.String(120), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), default='user')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class InventoryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100))
    quantity = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20))  # 'low', 'medium', 'good'
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    expiration_date = db.Column(db.DateTime, nullable=True)
    
    activities = db.relationship('ActivityLog', backref='item', lazy='dynamic')
    
    def serialize(self):
        """Return object data in easily serializable format"""
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'location': self.location,
            'quantity': self.quantity,
            'status': self.status,
            'last_updated': self.last_updated.strftime("%b %d, %Y") if not self.is_recent() else self.get_relative_time(),
            'expiration_date': self.expiration_date.strftime("%Y-%m-%d") if self.expiration_date else None
        }
    
    def is_recent(self):
        """Check if item was updated today or yesterday"""
        delta = datetime.utcnow() - self.last_updated
        return delta.days < 2
    
    def get_relative_time(self):
        """Return 'Today' or 'Yesterday' for recent updates"""
        delta = datetime.utcnow() - self.last_updated
        if delta.days == 0:
            return f"Today, {self.last_updated.strftime('%I:%M %p')}"
        elif delta.days == 1:
            return f"Yesterday, {self.last_updated.strftime('%I:%M %p')}"

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    action = db.Column(db.String(50))  # 'added', 'updated', 'removed'
    item_id = db.Column(db.Integer, db.ForeignKey('inventory_item.id'))
    quantity_change = db.Column(db.Integer, default=0)
    description = db.Column(db.String(200))
    
    def serialize(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.strftime("%b %d, %Y %I:%M %p"),
            'action': self.action,
            'item_name': self.item.name if self.item else 'Unknown',
            'quantity_change': self.quantity_change,
            'description': self.description
        }