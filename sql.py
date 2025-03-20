from sqlalchemy import create_engine, Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from passlib.context import CryptContext

DATABASE_URL = "sqlite:///./database.db"

# SQLAlchemy Setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Verschlüsselt ein Passwort mit bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Überprüft ein Passwort gegen den gespeicherten Hash."""
    return pwd_context.verify(plain_password, hashed_password)


# Datenbank-Modelle
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    todos = relationship("ToDo", back_populates="owner", cascade="all, delete-orphan")


class ToDo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    done = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="todos")


# Datenbank erstellen
Base.metadata.create_all(bind=engine)


class SQLManager:
    """Verwaltet die Datenbankoperationen für Nutzer und To-Dos."""

    def __init__(self):
        self.db = SessionLocal()

    def add_user(self, username: str, email: str, password: str):
        """Fügt einen neuen Benutzer zur Datenbank hinzu."""
        user = self.db.query(User).filter((User.username == username) | (User.email == email)).first()
        if user:
            return None  # Benutzer existiert bereits

        new_user = User(username=username, email=email, password=hash_password(password))
        self.db.add(new_user)
        self.db.commit()
        return new_user

    def get_user(self, username: str = None, email: str = None):
        """Liest einen Nutzer aus der Datenbank."""
        if username:
            return self.db.query(User).filter(User.username == username).first()
        if email:
            return self.db.query(User).filter(User.email == email).first()
        return self.db.query(User).all()

    def delete_user(self, username: str):
        """Löscht einen Nutzer aus der Datenbank."""
        user = self.db.query(User).filter(User.username == username).first()
        if not user:
            return False
        self.db.delete(user)
        self.db.commit()
        return True

    def add_todo(self, username: str, title: str, description: str):
        """Fügt ein ToDo zu einem Benutzer hinzu."""
        user = self.get_user(username=username)
        if not user:
            return None  # User existiert nicht

        todo = ToDo(title=title, description=description, owner=user)
        self.db.add(todo)
        self.db.commit()
        return todo

    # def get_todos(self, username: str):
    #     user = self.get_user(username=username)
    #     if not user:
    #         return None  # Falls Nutzer nicht existiert

    #     return self.db.query(ToDo).filter(ToDo.user_id == user.id).all()
    
    def get_todos(self, username: str):
        user = self.get_user(username=username)
        if not user:
            return None  # Falls Nutzer nicht existiert
    
        todos = self.db.query(ToDo).filter(ToDo.user_id == user.id).all()
    
        # Konvertiere die ToDos in ein Dictionary mit Titel als Key
        return {todo.title: {"description": todo.description, "done": todo.done} for todo in todos}



    def delete_todo(self, username: str, title: str):
        """Löscht ein spezifisches ToDo eines Nutzers."""
        user = self.get_user(username=username)
        if not user:
            return None

        todo = self.db.query(ToDo).filter(ToDo.user_id == user.id, ToDo.title == title).first()
        if not todo:
            return False

        self.db.delete(todo)
        self.db.commit()
        return True

    def update_todo_status(self, username: str, title: str, done: bool):
        """Aktualisiert den Status eines ToDos."""
        user = self.get_user(username=username)
        if not user:
            return None

        todo = self.db.query(ToDo).filter(ToDo.user_id == user.id, ToDo.title == title).first()
        if not todo:
            return False

        todo.done = done
        self.db.commit()
        return True
