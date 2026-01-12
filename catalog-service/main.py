#!/usr/bin/env python3
"""
Glacier AI - Catalog Service
Python FastAPI Microservice for Product Management and Order Processing
"""

import os
import logging
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, String, Integer, DECIMAL, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+mysqlconnector://root:password@localhost:3306/glacier_ai"
)

# FastAPI App
app = FastAPI(
    title="Glacier AI - Catalog Service",
    description="Product Catalog and Order Management Microservice",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLAlchemy Setup
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Product(Base):
    __tablename__ = "products"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    category_id = Column(String(36), nullable=False)
    image_url = Column(String(500))
    inventory = Column(Integer, default=0)
    tags = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    status = Column(String(20), default="PENDING")
    payment_status = Column(String(20), default="PENDING")
    payment_method = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(String(36), primary_key=True)
    order_id = Column(String(36), nullable=False)
    product_id = Column(String(36), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Pydantic Models
class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str]
    inventory: int
    tags: List[str]
    
    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    image_url: Optional[str]
    
    class Config:
        from_attributes = True

class OrderItemRequest(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)

class OrderRequest(BaseModel):
    user_id: str
    items: List[OrderItemRequest]
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    user_id: str
    total_amount: float
    status: str
    payment_status: str
    items: List[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True

class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)

class CartResponse(BaseModel):
    items: List[dict]
    total: float

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication dependency
async def verify_auth_token(authorization: Optional[str] = Header(None)):
    """
    Verify the authentication token by calling the auth service
    In a real microservice setup, this would be a gRPC call or internal API call
    For this implementation, we'll simulate token validation
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    
    # In production, this would call the auth service
    # For now, we'll validate basic structure
    if len(token) < 10:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return token

# Health Check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return {"status": "healthy", "service": "catalog-service"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Unhealthy: {str(e)}")

# Product Endpoints
@app.get("/products", response_model=List[ProductResponse])
async def get_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all products or filter by category"""
    try:
        query = db.query(Product).filter(Product.is_active == True)
        
        if category:
            # Get category ID
            category_obj = db.query(Category).filter(
                Category.name == category, 
                Category.is_active == True
            ).first()
            if category_obj:
                query = query.filter(Product.category_id == category_obj.id)
        
        products = query.all()
        
        # Get category names for response
        category_ids = [p.category_id for p in products]
        categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
        category_map = {c.id: c.name for c in categories}
        
        return [
            ProductResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                price=float(p.price),
                category=category_map.get(p.category_id, "Unknown"),
                image_url=p.image_url,
                inventory=p.inventory,
                tags=p.tags if p.tags else []
            )
            for p in products
        ]
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")

@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: Session = Depends(get_db)):
    """Get a specific product by ID"""
    try:
        product = db.query(Product).filter(
            Product.id == product_id, 
            Product.is_active == True
        ).first()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Get category name
        category = db.query(Category).filter(Category.id == product.category_id).first()
        
        return ProductResponse(
            id=product.id,
            name=product.name,
            description=product.description,
            price=float(product.price),
            category=category.name if category else "Unknown",
            image_url=product.image_url,
            inventory=product.inventory,
            tags=product.tags if product.tags else []
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch product")

@app.get("/categories", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    """Get all active categories"""
    try:
        categories = db.query(Category).filter(Category.is_active == True).all()
        return categories
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")

# Order Endpoints
@app.post("/orders", response_model=OrderResponse)
async def create_order(order_request: OrderRequest, db: Session = Depends(get_db)):
    """Create a new order"""
    try:
        # Validate items and calculate total
        total_amount = Decimal('0.00')
        order_items = []
        
        for item in order_request.items:
            product = db.query(Product).filter(
                Product.id == item.product_id,
                Product.is_active == True
            ).first()
            
            if not product:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Product {item.product_id} not found"
                )
            
            if product.inventory < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient inventory for {product.name}"
                )
            
            item_total = product.price * item.quantity
            total_amount += item_total
            
            order_items.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": float(product.price),
                "name": product.name
            })
        
        # Create order
        import uuid
        order_id = str(uuid.uuid4())
        
        order = Order(
            id=order_id,
            user_id=order_request.user_id,
            total_amount=total_amount,
            status="PENDING",
            payment_status="PENDING",
            payment_method=order_request.payment_method,
            notes=order_request.notes
        )
        
        db.add(order)
        db.flush()  # Get order ID
        
        # Create order items and update inventory
        for item_data in order_items:
            order_item = OrderItem(
                id=str(uuid.uuid4()),
                order_id=order_id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                price=item_data["price"]
            )
            db.add(order_item)
            
            # Update product inventory
            product = db.query(Product).filter(
                Product.id == item_data["product_id"]
            ).first()
            product.inventory -= item_data["quantity"]
        
        db.commit()
        db.refresh(order)
        
        return OrderResponse(
            id=order.id,
            user_id=order.user_id,
            total_amount=float(order.total_amount),
            status=order.status,
            payment_status=order.payment_status,
            items=order_items,
            created_at=order.created_at
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

@app.get("/orders/user/{user_id}", response_model=List[OrderResponse])
async def get_user_orders(user_id: str, db: Session = Depends(get_db)):
    """Get all orders for a user"""
    try:
        orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
        
        result = []
        for order in orders:
            order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            items = [
                {
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "price": float(item.price)
                }
                for item in order_items
            ]
            
            result.append(OrderResponse(
                id=order.id,
                user_id=order.user_id,
                total_amount=float(order.total_amount),
                status=order.status,
                payment_status=order.payment_status,
                items=items,
                created_at=order.created_at
            ))
        
        return result
    except Exception as e:
        logger.error(f"Error fetching user orders: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch orders")

@app.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, db: Session = Depends(get_db)):
    """Update order status (for admin use)"""
    valid_statuses = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order.status = status
        db.commit()
        db.refresh(order)
        
        return {"message": "Order status updated", "order_id": order_id, "status": status}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating order status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update order status")

# Inventory Management
@app.put("/products/{product_id}/inventory")
async def update_inventory(product_id: str, quantity: int, db: Session = Depends(get_db)):
    """Update product inventory"""
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product.inventory = quantity
        db.commit()
        db.refresh(product)
        
        return {"message": "Inventory updated", "product_id": product_id, "inventory": quantity}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating inventory: {e}")
        raise HTTPException(status_code=500, detail="Failed to update inventory")

# Search endpoint
@app.get("/search")
async def search_products(query: str, db: Session = Depends(get_db)):
    """Search products by name or description"""
    try:
        search_term = f"%{query}%"
        products = db.query(Product).filter(
            Product.is_active == True,
            (Product.name.like(search_term)) | (Product.description.like(search_term))
        ).all()
        
        # Get category names
        category_ids = [p.category_id for p in products]
        categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
        category_map = {c.id: c.name for c in categories}
        
        return [
            ProductResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                price=float(p.price),
                category=category_map.get(p.category_id, "Unknown"),
                image_url=p.image_url,
                inventory=p.inventory,
                tags=p.tags if p.tags else []
            )
            for p in products
        ]
    except Exception as e:
        logger.error(f"Error searching products: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3002,
        reload=True,
        log_level="info"
    )