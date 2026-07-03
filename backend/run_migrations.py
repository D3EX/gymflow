# create_super_admin.py
from sqlalchemy import text
from app.database import engine
from app.utils.auth import hash_password

# Super admin credentials
EMAIL = "super@gymflow.com"
PASSWORD = "super123"
NAME = "Super Admin"
ROLE = "super_admin"

# Hash the password
hashed = hash_password(PASSWORD)

# Insert the user
with engine.connect() as conn:
    conn.execute(
        text("INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)"),
        {"name": NAME, "email": EMAIL, "password": hashed, "role": ROLE}
    )
    conn.commit()
    print(f"✅ Super Admin created: {EMAIL}")
    print(f"   Password: {PASSWORD}")