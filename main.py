from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sql import SQLManager, verify_password  # Importiere die SQLManager-Klasse

app = FastAPI()
db = SQLManager()  # Initialisiere die Datenbankverbindung

class User(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginData(BaseModel):
    username: str
    password: str

class ToDo(BaseModel):
    title: str
    description: str
    done: bool = False

class ToDoUpdate(BaseModel):
    title: str
    done: bool
    
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # <-- Erlaubt ALLE Ursprünge (nur für Entwicklung)
    allow_credentials=True,
    allow_methods=["*"],  # <-- Erlaubt ALLE HTTP-Methoden
    allow_headers=["*"],  # <-- Erlaubt ALLE Header
)

@app.post("/users/")
def add_user(user: User):
    new_user = db.add_user(user.username.lower(), user.email, user.password)
    if not new_user:
        raise HTTPException(status_code=409, detail="User already exists!")
    return {"username": new_user.username, "email": new_user.email}

@app.get("/users/")
def get_users(username: str = None, email: str = None):
    user = db.get_user(username, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found!")
    return user

@app.delete("/users/")
def remove_user(user_data: LoginData):
    if not db.delete_user(user_data.username.lower()):
        raise HTTPException(status_code=404, detail="User not found!")
    return {"message": f"User {user_data.username} deleted successfully!"}

@app.post("/login/")
def login(login_data: LoginData):
    user = db.get_user(username=login_data.username.lower())
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password!")
    return {"message": "Login successful!"}

@app.put("/users/{username}/todos/")
def add_todo(username: str, todo: ToDo):
    new_todo = db.add_todo(username.lower(), todo.title, todo.description)
    if not new_todo:
        raise HTTPException(status_code=404, detail="User not found!")
    return {"message": f"Todo '{todo.title}' added successfully!"}

@app.get("/users/{username}/todos/")
def get_todos(username: str):
    todos = db.get_todos(username.lower())
    if todos is None:
        raise HTTPException(status_code=404, detail="User not found!")
    return todos

@app.delete("/users/{username}/todos/")
def remove_todo(username: str, todo_title: str):
    if not db.delete_todo(username.lower(), todo_title):
        raise HTTPException(status_code=404, detail="Todo not found!")
    return {"message": f"Todo '{todo_title}' deleted successfully!"}

@app.patch("/users/{username}/todos/")
def update_todo_status(username: str, todo_update: ToDoUpdate):
    if not db.update_todo_status(username.lower(), todo_update.title, todo_update.done):
        raise HTTPException(status_code=404, detail="Todo not found!")
    return {"message": f"Todo '{todo_update.title}' updated!"}
