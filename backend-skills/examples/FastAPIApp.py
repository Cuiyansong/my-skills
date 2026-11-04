from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI(title="User API", version="1.0.0")

class User(BaseModel):
    id: int
    name: str
    email: str

users_db = []

@app.get("/")
async def root():
    return {"message": "Hello, FastAPI!"}

@app.get("/users", response_model=List[User])
async def get_users():
    return users_db

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    for user in users_db:
        if user.id == user_id:
            return user
    raise HTTPException(status_code=404, detail="User not found")

@app.post("/users", response_model=User)
async def create_user(user: User):
    users_db.append(user)
    return user

@app.put("/users/{user_id}", response_model=User)
async def update_user(user_id: int, user: User):
    for i, u in enumerate(users_db):
        if u.id == user_id:
            users_db[i] = user
            return user
    raise HTTPException(status_code=404, detail="User not found")