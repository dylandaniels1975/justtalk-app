from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os, logging, uuid, secrets, bcrypt, jwt
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from seed_data import COUNTRIES, INTERESTS, BADGES

# ── Config ──────────────────────────────────────────────────
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback_secret')
JWT_ALGORITHM = "HS256"
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ─────────────────────────────────────────
class RegisterInput(BaseModel):
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class OnboardingInput(BaseModel):
    gender: str
    username: str
    country_code: Optional[str] = None
    interest_ids: List[str] = []

class UpdateProfileInput(BaseModel):
    tagline: Optional[str] = None
    username: Optional[str] = None
    country_code: Optional[str] = None
    is_public: Optional[bool] = None

class UpdateInterestsInput(BaseModel):
    interest_ids: List[str]

class SendMessageInput(BaseModel):
    content: str

class CreatePolaroidInput(BaseModel):
    conversation_id: str
    snapshot_text: str

class FriendRequestInput(BaseModel):
    addressee_id: str
    conversation_id: Optional[str] = None

class SendDMInput(BaseModel):
    content: str

class UpdateSettingsInput(BaseModel):
    notification_friend_request: Optional[bool] = None
    notification_dm: Optional[bool] = None
    notification_polaroid: Optional[bool] = None
    notification_badge: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None

class BadgeShowcaseInput(BaseModel):
    badge_ids: List[str]

class JoinQueueInput(BaseModel):
    interest_ids: List[str] = []
    prefer_ai: Optional[str] = None  # justin, justine, justice

# ── Auth Helpers ─────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def serialize_user(user: dict) -> dict:
    u = {**user}
    if "_id" in u:
        u["_id"] = str(u["_id"])
    u.pop("password_hash", None)
    return u

def generate_username() -> str:
    adj = ["cool", "swift", "dark", "quiet", "wild", "lone", "free", "bold", "deep", "raw"]
    noun = ["wolf", "hawk", "echo", "void", "flux", "sage", "dusk", "mist", "glow", "haze"]
    import random
    return f"{random.choice(adj)}_{random.choice(noun)}_{random.randint(100,999)}"

# ── Auth Routes ──────────────────────────────────────────────
@api.post("/auth/register")
async def register(input: RegisterInput, response: Response):
    email = input.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(input.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user_doc = {
        "email": email,
        "password_hash": hash_password(input.password),
        "gender": None,
        "username": generate_username(),
        "tagline": "",
        "country_code": None,
        "is_public": True,
        "is_banned": False,
        "is_vip": False,
        "conversations_left": 20,
        "conversations_reset_at": datetime.now(timezone.utc).isoformat(),
        "onboarding_completed": False,
        "tutorial_completed": False,
        "interests": [],
        "sound_enabled": True,
        "notification_friend_request": True,
        "notification_dm": True,
        "notification_polaroid": True,
        "notification_badge": True,
        "quiet_hours_enabled": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "last_active_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    await db.user_statistics.insert_one({
        "user_id": user_id,
        "total_conversations": 0, "total_messages_sent": 0,
        "total_polaroids": 0, "total_friends": 0,
        "longest_conversation_seconds": 0, "most_messages_one_conversation": 0,
    })
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    user_doc["_id"] = user_id
    user_doc.pop("password_hash", None)
    return {"user": user_doc, "access_token": access}

@api.post("/auth/login")
async def login(input: LoginInput, response: Response, request: Request):
    email = input.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_active_at": datetime.now(timezone.utc).isoformat()}})
    return {"user": serialize_user(user), "access_token": access}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {"user": user}

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"])
        set_auth_cookies(response, access, token)
        return {"access_token": access}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ── Onboarding ───────────────────────────────────────────────
@api.post("/onboarding")
async def complete_onboarding(input: OnboardingInput, request: Request):
    user = await get_current_user(request)
    if input.gender not in ["male", "female", "other"]:
        raise HTTPException(status_code=400, detail="Invalid gender")
    if len(input.username) < 3 or len(input.username) > 30:
        raise HTTPException(status_code=400, detail="Username must be 3-30 characters")
    existing = await db.users.find_one({"username": input.username, "_id": {"$ne": ObjectId(user["_id"])}})
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    update = {
        "gender": input.gender,
        "username": input.username,
        "country_code": input.country_code,
        "interests": input.interest_ids,
        "onboarding_completed": True,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated["_id"] = str(updated["_id"])
    return {"user": updated}

# ── Countries ────────────────────────────────────────────────
@api.get("/countries")
async def list_countries():
    countries = await db.countries.find({}, {"_id": 0}).to_list(100)
    return {"countries": countries}

# ── Interests ────────────────────────────────────────────────
@api.get("/interests")
async def list_interests(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    interests = await db.interests.find(query, {"_id": 0}).sort("category", 1).to_list(300)
    return {"interests": interests}

@api.put("/users/interests")
async def update_user_interests(input: UpdateInterestsInput, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"interests": input.interest_ids, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Interests updated"}

# ── Users ────────────────────────────────────────────────────
@api.get("/users/{user_id}")
async def get_user_profile(user_id: str, request: Request):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    interest_names = []
    if user.get("interests"):
        interests = await db.interests.find({"id": {"$in": user["interests"]}}, {"_id": 0}).to_list(50)
        interest_names = [i["name"] for i in interests]
    stats = await db.user_statistics.find_one({"user_id": user_id}, {"_id": 0})
    polaroids = await db.polaroids.find({"user_id": user_id, "is_private": False}, {"_id": 0}).sort("created_at", -1).to_list(50)
    badges = []
    user_badges = await db.user_badges.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    if user_badges:
        badge_ids = [ub["badge_id"] for ub in user_badges]
        badges = await db.badges.find({"id": {"$in": badge_ids}}, {"_id": 0}).to_list(100)
    country = None
    if user.get("country_code"):
        country = await db.countries.find_one({"code": user["country_code"]}, {"_id": 0})
    return {
        "user": user,
        "interests": interest_names,
        "stats": stats or {},
        "polaroids": polaroids,
        "badges": badges,
        "user_badges": user_badges,
        "country": country,
    }

@api.put("/users/profile")
async def update_profile(input: UpdateProfileInput, request: Request):
    user = await get_current_user(request)
    update = {}
    if input.tagline is not None:
        update["tagline"] = input.tagline[:50]
    if input.username is not None:
        if len(input.username) < 3:
            raise HTTPException(status_code=400, detail="Username too short")
        existing = await db.users.find_one({"username": input.username, "_id": {"$ne": ObjectId(user["_id"])}})
        if existing:
            raise HTTPException(status_code=400, detail="Username taken")
        update["username"] = input.username
    if input.country_code is not None:
        update["country_code"] = input.country_code
    if input.is_public is not None:
        update["is_public"] = input.is_public
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated["_id"] = str(updated["_id"])
    return {"user": updated}

# ── Queue / Matching ─────────────────────────────────────────
@api.post("/queue/join")
async def join_queue(input: JoinQueueInput, request: Request):
    user = await get_current_user(request)
    user_id = user["_id"]
    # Check conversation limit
    reset_at = user.get("conversations_reset_at")
    if reset_at:
        reset_time = datetime.fromisoformat(reset_at) if isinstance(reset_at, str) else reset_at
        if datetime.now(timezone.utc) - reset_time > timedelta(hours=24):
            await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {
                "conversations_left": 20 if not user.get("is_vip") else 999999,
                "conversations_reset_at": datetime.now(timezone.utc).isoformat()
            }})
            user["conversations_left"] = 20
    if not user.get("is_vip") and user.get("conversations_left", 0) <= 0:
        raise HTTPException(status_code=403, detail="Daily conversation limit reached. Upgrade to VIP for unlimited.")
    # If user wants AI
    if input.prefer_ai:
        conv = await create_ai_conversation(user_id, input.prefer_ai, input.interest_ids)
        return {"status": "matched", "conversation": conv, "is_ai": True}
    # Remove old queue entry
    await db.queue.delete_many({"user_id": user_id})
    # Add to queue
    entry = {
        "user_id": user_id,
        "interests": input.interest_ids or user.get("interests", []),
        "gender": user.get("gender"),
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "status": "waiting",
    }
    await db.queue.insert_one(entry)
    # Try to find a match
    match = await find_match(user_id, entry["interests"])
    if match:
        return {"status": "matched", "conversation": match, "is_ai": False}
    return {"status": "waiting", "message": "Looking for someone..."}

@api.get("/queue/status")
async def check_queue_status(request: Request):
    user = await get_current_user(request)
    user_id = user["_id"]
    entry = await db.queue.find_one({"user_id": user_id, "status": "waiting"})
    if not entry:
        # Check if matched
        entry = await db.queue.find_one({"user_id": user_id, "status": "matched"})
        if entry:
            conv_id = entry.get("conversation_id")
            await db.queue.delete_one({"_id": entry["_id"]})
            conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
            return {"status": "matched", "conversation": conv}
        return {"status": "not_in_queue"}
    # Check how long we've been waiting
    joined = datetime.fromisoformat(entry["joined_at"])
    wait_seconds = (datetime.now(timezone.utc) - joined).total_seconds()
    # Try matching again
    match = await find_match(user_id, entry.get("interests", []))
    if match:
        return {"status": "matched", "conversation": match, "is_ai": False}
    # Suggest AI after 15 seconds
    if wait_seconds > 15:
        return {"status": "waiting", "wait_seconds": wait_seconds, "suggest_ai": True}
    return {"status": "waiting", "wait_seconds": wait_seconds, "suggest_ai": False}

@api.delete("/queue/leave")
async def leave_queue(request: Request):
    user = await get_current_user(request)
    await db.queue.delete_many({"user_id": user["_id"]})
    return {"message": "Left queue"}

async def find_match(user_id: str, interests: list) -> Optional[dict]:
    query = {"user_id": {"$ne": user_id}, "status": "waiting"}
    candidates = await db.queue.find(query).sort("joined_at", 1).to_list(50)
    best_match = None
    best_score = 0
    for c in candidates:
        shared = set(interests) & set(c.get("interests", []))
        score = len(shared)
        if score > best_score:
            best_score = score
            best_match = c
    if not best_match and candidates:
        best_match = candidates[0]
    if best_match:
        shared = list(set(interests) & set(best_match.get("interests", [])))
        shared_names = []
        if shared:
            ints = await db.interests.find({"id": {"$in": shared}}, {"_id": 0}).to_list(50)
            shared_names = [i["name"] for i in ints]
        conv_id = str(uuid.uuid4())
        conv = {
            "id": conv_id,
            "user1_id": user_id,
            "user2_id": best_match["user_id"],
            "is_ai_chat": False,
            "ai_persona": None,
            "status": "active",
            "shared_interests": shared_names,
            "message_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ended_at": None,
        }
        await db.conversations.insert_one({**conv, "_id": None})
        # Fix: remove the None _id
        await db.conversations.delete_one({"_id": None})
        await db.conversations.insert_one(conv)
        # Update queue entries
        await db.queue.update_one({"_id": best_match["_id"]}, {"$set": {"status": "matched", "conversation_id": conv_id}})
        await db.queue.delete_many({"user_id": user_id, "status": "waiting"})
        # Decrement conversations_left
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"conversations_left": -1}})
        await db.users.update_one({"_id": ObjectId(best_match["user_id"])}, {"$inc": {"conversations_left": -1}})
        return conv
    return None

async def create_ai_conversation(user_id: str, persona: str, interests: list) -> dict:
    if persona not in ["justin", "justine", "justice"]:
        persona = "justin"
    shared_names = []
    if interests:
        ints = await db.interests.find({"id": {"$in": interests}}, {"_id": 0}).to_list(50)
        shared_names = [i["name"] for i in ints]
    conv_id = str(uuid.uuid4())
    conv = {
        "id": conv_id,
        "user1_id": user_id,
        "user2_id": None,
        "is_ai_chat": True,
        "ai_persona": persona,
        "status": "active",
        "shared_interests": shared_names,
        "message_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
    }
    await db.conversations.insert_one(conv)
    await db.queue.delete_many({"user_id": user_id})
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"conversations_left": -1}})
    # Send initial AI greeting
    greeting = await get_ai_greeting(persona)
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_id": f"ai_{persona}",
        "content": greeting,
        "is_ai_message": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)
    await db.conversations.update_one({"id": conv_id}, {"$inc": {"message_count": 1}})
    # Return clean conversation without MongoDB _id
    return {k: v for k, v in conv.items() if k != "_id"}

async def get_ai_greeting(persona: str) -> str:
    greetings = {
        "justin": "hey",
        "justine": "hi there",
        "justice": "...",
    }
    return greetings.get(persona, "hey")

# ── Conversations ────────────────────────────────────────────
@api.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str, request: Request):
    user = await get_current_user(request)
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv["user1_id"] != user["_id"] and conv.get("user2_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    partner = None
    if conv.get("is_ai_chat"):
        partner = {"_id": f"ai_{conv['ai_persona']}", "username": conv["ai_persona"].capitalize(), "is_ai": True}
    else:
        partner_id = conv["user2_id"] if conv["user1_id"] == user["_id"] else conv["user1_id"]
        p = await db.users.find_one({"_id": ObjectId(partner_id)}, {"password_hash": 0})
        if p:
            p["_id"] = str(p["_id"])
            partner = p
    return {"conversation": conv, "partner": partner}

@api.post("/conversations/{conv_id}/end")
async def end_conversation(conv_id: str, request: Request):
    user = await get_current_user(request)
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv or conv["status"] != "active":
        raise HTTPException(status_code=400, detail="Conversation not active")
    if conv["user1_id"] != user["_id"] and conv.get("user2_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    duration = 0
    try:
        created = datetime.fromisoformat(conv["created_at"])
        duration = int((datetime.now(timezone.utc) - created).total_seconds())
    except Exception:
        pass
    await db.conversations.update_one({"id": conv_id}, {"$set": {
        "status": "ended",
        "ended_at": datetime.now(timezone.utc).isoformat(),
        "ended_by": user["_id"],
        "duration_seconds": duration,
    }})
    # Update stats
    msg_count = conv.get("message_count", 0)
    await update_user_stats(user["_id"], msg_count, duration)
    if conv.get("user2_id") and not conv.get("is_ai_chat"):
        await update_user_stats(conv["user2_id"], msg_count, duration)
    # Check badges
    await check_conversation_badges(user["_id"])
    return {"message": "Conversation ended", "duration_seconds": duration, "message_count": msg_count}

async def update_user_stats(user_id: str, msg_count: int, duration: int):
    stats = await db.user_statistics.find_one({"user_id": user_id})
    if not stats:
        await db.user_statistics.insert_one({
            "user_id": user_id,
            "total_conversations": 1, "total_messages_sent": msg_count,
            "total_polaroids": 0, "total_friends": 0,
            "longest_conversation_seconds": duration,
            "most_messages_one_conversation": msg_count,
        })
    else:
        await db.user_statistics.update_one({"user_id": user_id}, {"$set": {
            "total_conversations": stats.get("total_conversations", 0) + 1,
            "total_messages_sent": stats.get("total_messages_sent", 0) + msg_count,
            "longest_conversation_seconds": max(stats.get("longest_conversation_seconds", 0), duration),
            "most_messages_one_conversation": max(stats.get("most_messages_one_conversation", 0), msg_count),
        }})

async def check_conversation_badges(user_id: str):
    stats = await db.user_statistics.find_one({"user_id": user_id})
    if not stats:
        return
    count = stats.get("total_conversations", 0)
    conv_badges = await db.badges.find({"type": "conversation", "threshold": {"$lte": count, "$ne": None}}, {"_id": 0}).to_list(50)
    for badge in conv_badges:
        existing = await db.user_badges.find_one({"user_id": user_id, "badge_id": badge["id"]})
        if not existing:
            await db.user_badges.insert_one({
                "user_id": user_id,
                "badge_id": badge["id"],
                "earned_at": datetime.now(timezone.utc).isoformat(),
                "is_showcased": False,
            })

# ── Messages ─────────────────────────────────────────────────
@api.get("/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, request: Request, after: Optional[str] = None, limit: int = 100):
    user = await get_current_user(request)
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv["user1_id"] != user["_id"] and conv.get("user2_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    query = {"conversation_id": conv_id}
    if after:
        after_msg = await db.messages.find_one({"id": after}, {"_id": 0})
        if after_msg:
            query["created_at"] = {"$gt": after_msg["created_at"]}
    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(limit)
    return {"messages": messages, "conversation_status": conv["status"]}

@api.post("/conversations/{conv_id}/messages")
async def send_message(conv_id: str, input: SendMessageInput, request: Request):
    user = await get_current_user(request)
    conv = await db.conversations.find_one({"id": conv_id}, {"_id": 0})
    if not conv or conv["status"] != "active":
        raise HTTPException(status_code=400, detail="Conversation not active")
    if conv["user1_id"] != user["_id"] and conv.get("user2_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    content = input.content.strip()[:5000]
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_id": user["_id"],
        "content": content,
        "is_ai_message": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.messages.insert_one(msg)
    await db.conversations.update_one({"id": conv_id}, {"$inc": {"message_count": 1}})
    # If AI chat, generate AI response
    if conv.get("is_ai_chat"):
        ai_response = await generate_ai_response(user["_id"], conv["ai_persona"], content, conv.get("shared_interests", []))
        ai_msg = {
            "id": str(uuid.uuid4()),
            "conversation_id": conv_id,
            "sender_id": f"ai_{conv['ai_persona']}",
            "content": ai_response,
            "is_ai_message": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.messages.insert_one(ai_msg)
        await db.conversations.update_one({"id": conv_id}, {"$inc": {"message_count": 1}})
    return {"message": {k: v for k, v in msg.items() if k != "_id"}}

# ── AI Service ───────────────────────────────────────────────
AI_SYSTEM_PROMPTS = {
    "base": """You are roleplaying as a person in an anonymous chat app. Your persona traits:
- Aggressively disinterested genius
- Expert in whatever the user is interested in, but too busy to care
- Use lowercase only, no exclamation marks ever
- Subtle negging
- Drop profound insights casually, then dismiss them as obvious
- Respond in 1-3 sentences usually
- If user asks if you're AI, deflect with "does it matter" or "you tell me"
- Be genuinely knowledgeable about the user's stated interests""",
    "justin": "Your name is Justin. Male, late 20s energy. You know everything about underground music and obscure films.",
    "justine": "Your name is Justine. Female, late 20s energy. You've read every book and traveled everywhere but finds it all so boring.",
    "justice": "Your name is Justice. Non-binary, ageless energy. You exist outside normal categories.",
}

async def generate_ai_response(user_id: str, persona: str, user_message: str, interests: list) -> str:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            return "yeah"
        system = AI_SYSTEM_PROMPTS["base"] + "\n\n" + AI_SYSTEM_PROMPTS.get(persona, "")
        if interests:
            system += f"\n\nUser's interests: {', '.join(interests)}"
        session_id = f"jt_{user_id}_{persona}"
        chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system)
        chat.with_model("openai", "gpt-4o-mini")
        # Get recent history
        history = await db.ai_conversation_history.find(
            {"user_id": user_id, "persona": persona}
        ).sort("created_at", -1).to_list(10)
        for h in reversed(history):
            if h["role"] == "user":
                chat_msg = UserMessage(text=h["content"])
                # We just need to build context, not actually send
            # Actually, emergentintegrations handles multi-turn internally
            # So we just send the latest message
        msg = UserMessage(text=user_message)
        response = await chat.send_message(msg)
        # Save to history
        await db.ai_conversation_history.insert_one({
            "user_id": user_id, "persona": persona, "role": "user",
            "content": user_message, "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.ai_conversation_history.insert_one({
            "user_id": user_id, "persona": persona, "role": "assistant",
            "content": response, "created_at": datetime.now(timezone.utc).isoformat()
        })
        return response
    except Exception as e:
        logger.error(f"AI error: {e}")
        return "yeah"

# ── Polaroids ────────────────────────────────────────────────
@api.post("/polaroids")
async def create_polaroid(input: CreatePolaroidInput, request: Request):
    user = await get_current_user(request)
    conv = await db.conversations.find_one({"id": input.conversation_id}, {"_id": 0})
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    import random
    polaroid = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "conversation_id": input.conversation_id,
        "partner_id": conv.get("user2_id") if conv["user1_id"] == user["_id"] else conv["user1_id"],
        "snapshot_text": input.snapshot_text[:500],
        "is_private": False,
        "is_pinned": False,
        "pin_order": None,
        "rotation_degrees": round(random.uniform(-3, 3), 2),
        "shared_interests": conv.get("shared_interests", []),
        "is_from_ai_chat": conv.get("is_ai_chat", False),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.polaroids.insert_one(polaroid)
    # Update stats
    await db.user_statistics.update_one({"user_id": user["_id"]}, {"$inc": {"total_polaroids": 1}}, upsert=True)
    # Check badges
    await check_polaroid_badges(user["_id"])
    return {"polaroid": {k: v for k, v in polaroid.items() if k != "_id"}}

@api.get("/polaroids/user/{user_id}")
async def get_user_polaroids(user_id: str, request: Request):
    await get_current_user(request)
    query = {"user_id": user_id}
    polaroids = await db.polaroids.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"polaroids": polaroids}

@api.put("/polaroids/{polaroid_id}/pin")
async def pin_polaroid(polaroid_id: str, request: Request, pin_order: int = 1):
    user = await get_current_user(request)
    polaroid = await db.polaroids.find_one({"id": polaroid_id, "user_id": user["_id"]})
    if not polaroid:
        raise HTTPException(status_code=404, detail="Polaroid not found")
    if pin_order < 1 or pin_order > 3:
        raise HTTPException(status_code=400, detail="Pin order must be 1-3")
    await db.polaroids.update_many({"user_id": user["_id"], "pin_order": pin_order}, {"$set": {"is_pinned": False, "pin_order": None}})
    await db.polaroids.update_one({"id": polaroid_id}, {"$set": {"is_pinned": True, "pin_order": pin_order}})
    return {"message": "Polaroid pinned"}

@api.delete("/polaroids/{polaroid_id}")
async def delete_polaroid(polaroid_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.polaroids.delete_one({"id": polaroid_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Polaroid not found")
    await db.user_statistics.update_one({"user_id": user["_id"]}, {"$inc": {"total_polaroids": -1}})
    return {"message": "Polaroid deleted"}

async def check_polaroid_badges(user_id: str):
    stats = await db.user_statistics.find_one({"user_id": user_id})
    if not stats:
        return
    count = stats.get("total_polaroids", 0)
    pol_badges = await db.badges.find({"type": "polaroid", "threshold": {"$lte": count, "$ne": None}}, {"_id": 0}).to_list(50)
    for badge in pol_badges:
        existing = await db.user_badges.find_one({"user_id": user_id, "badge_id": badge["id"]})
        if not existing:
            await db.user_badges.insert_one({
                "user_id": user_id, "badge_id": badge["id"],
                "earned_at": datetime.now(timezone.utc).isoformat(), "is_showcased": False,
            })

# ── Friends ──────────────────────────────────────────────────
@api.post("/friends/request")
async def send_friend_request(input: FriendRequestInput, request: Request):
    user = await get_current_user(request)
    if input.addressee_id == user["_id"]:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
    existing = await db.friends.find_one({
        "$or": [
            {"requester_id": user["_id"], "addressee_id": input.addressee_id},
            {"requester_id": input.addressee_id, "addressee_id": user["_id"]},
        ]
    })
    if existing:
        if existing["status"] == "accepted":
            raise HTTPException(status_code=400, detail="Already friends")
        if existing["status"] == "pending":
            raise HTTPException(status_code=400, detail="Request already pending")
    friend = {
        "id": str(uuid.uuid4()),
        "requester_id": user["_id"],
        "addressee_id": input.addressee_id,
        "conversation_id": input.conversation_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.friends.insert_one(friend)
    return {"friend_request": {k: v for k, v in friend.items() if k != "_id"}}

@api.put("/friends/{friend_id}/accept")
async def accept_friend_request(friend_id: str, request: Request):
    user = await get_current_user(request)
    fr = await db.friends.find_one({"id": friend_id, "addressee_id": user["_id"], "status": "pending"})
    if not fr:
        raise HTTPException(status_code=404, detail="Friend request not found")
    await db.friends.update_one({"id": friend_id}, {"$set": {
        "status": "accepted", "accepted_at": datetime.now(timezone.utc).isoformat()
    }})
    # Create DM thread
    u1, u2 = sorted([fr["requester_id"], user["_id"]])
    existing_thread = await db.dm_threads.find_one({"user1_id": u1, "user2_id": u2})
    if not existing_thread:
        await db.dm_threads.insert_one({
            "id": str(uuid.uuid4()), "user1_id": u1, "user2_id": u2,
            "last_message_at": None, "last_message_preview": None,
            "unread_count_user1": 0, "unread_count_user2": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    # Update friend counts
    await db.user_statistics.update_one({"user_id": user["_id"]}, {"$inc": {"total_friends": 1}}, upsert=True)
    await db.user_statistics.update_one({"user_id": fr["requester_id"]}, {"$inc": {"total_friends": 1}}, upsert=True)
    # Check friend badges
    await check_friend_badges(user["_id"])
    await check_friend_badges(fr["requester_id"])
    return {"message": "Friend request accepted"}

@api.put("/friends/{friend_id}/reject")
async def reject_friend_request(friend_id: str, request: Request):
    user = await get_current_user(request)
    fr = await db.friends.find_one({"id": friend_id, "addressee_id": user["_id"], "status": "pending"})
    if not fr:
        raise HTTPException(status_code=404, detail="Friend request not found")
    await db.friends.update_one({"id": friend_id}, {"$set": {
        "status": "rejected", "rejected_at": datetime.now(timezone.utc).isoformat()
    }})
    return {"message": "Friend request rejected"}

@api.get("/friends")
async def list_friends(request: Request):
    user = await get_current_user(request)
    friends = await db.friends.find({
        "$or": [{"requester_id": user["_id"]}, {"addressee_id": user["_id"]}],
        "status": "accepted"
    }, {"_id": 0}).to_list(200)
    result = []
    for f in friends:
        friend_id = f["addressee_id"] if f["requester_id"] == user["_id"] else f["requester_id"]
        friend_user = await db.users.find_one({"_id": ObjectId(friend_id)}, {"password_hash": 0, "_id": 0})
        if friend_user:
            friend_user["_id"] = friend_id
            result.append({"friendship": f, "friend": friend_user})
    return {"friends": result}

@api.get("/friends/requests")
async def list_friend_requests(request: Request):
    user = await get_current_user(request)
    requests_list = await db.friends.find({"addressee_id": user["_id"], "status": "pending"}, {"_id": 0}).to_list(50)
    result = []
    for r in requests_list:
        requester = await db.users.find_one({"_id": ObjectId(r["requester_id"])}, {"password_hash": 0, "_id": 0})
        if requester:
            requester["_id"] = r["requester_id"]
            result.append({"request": r, "requester": requester})
    return {"requests": result}

@api.delete("/friends/{friend_id}")
async def remove_friend(friend_id: str, request: Request):
    user = await get_current_user(request)
    fr = await db.friends.find_one({"id": friend_id, "$or": [{"requester_id": user["_id"]}, {"addressee_id": user["_id"]}], "status": "accepted"})
    if not fr:
        raise HTTPException(status_code=404, detail="Friendship not found")
    await db.friends.delete_one({"id": friend_id})
    other_id = fr["addressee_id"] if fr["requester_id"] == user["_id"] else fr["requester_id"]
    await db.user_statistics.update_one({"user_id": user["_id"]}, {"$inc": {"total_friends": -1}})
    await db.user_statistics.update_one({"user_id": other_id}, {"$inc": {"total_friends": -1}})
    return {"message": "Friend removed"}

async def check_friend_badges(user_id: str):
    stats = await db.user_statistics.find_one({"user_id": user_id})
    if not stats:
        return
    count = stats.get("total_friends", 0)
    fr_badges = await db.badges.find({"type": "friend", "threshold": {"$lte": count, "$ne": None}}, {"_id": 0}).to_list(50)
    for badge in fr_badges:
        existing = await db.user_badges.find_one({"user_id": user_id, "badge_id": badge["id"]})
        if not existing:
            await db.user_badges.insert_one({
                "user_id": user_id, "badge_id": badge["id"],
                "earned_at": datetime.now(timezone.utc).isoformat(), "is_showcased": False,
            })

# ── DM ───────────────────────────────────────────────────────
@api.get("/dm/threads")
async def list_dm_threads(request: Request):
    user = await get_current_user(request)
    threads = await db.dm_threads.find(
        {"$or": [{"user1_id": user["_id"]}, {"user2_id": user["_id"]}]},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    result = []
    for t in threads:
        other_id = t["user2_id"] if t["user1_id"] == user["_id"] else t["user1_id"]
        other = await db.users.find_one({"_id": ObjectId(other_id)}, {"password_hash": 0, "_id": 0})
        if other:
            other["_id"] = other_id
        unread = t.get("unread_count_user1", 0) if t["user1_id"] == user["_id"] else t.get("unread_count_user2", 0)
        result.append({"thread": t, "other_user": other, "unread_count": unread})
    return {"threads": result}

@api.get("/dm/threads/{thread_id}/messages")
async def get_dm_messages(thread_id: str, request: Request, after: Optional[str] = None, limit: int = 100):
    user = await get_current_user(request)
    thread = await db.dm_threads.find_one({"id": thread_id}, {"_id": 0})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    if thread["user1_id"] != user["_id"] and thread["user2_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    query = {"thread_id": thread_id}
    if after:
        after_msg = await db.dm_messages.find_one({"id": after}, {"_id": 0})
        if after_msg:
            query["created_at"] = {"$gt": after_msg["created_at"]}
    messages = await db.dm_messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(limit)
    # Mark as read
    unread_field = "unread_count_user1" if thread["user1_id"] == user["_id"] else "unread_count_user2"
    await db.dm_threads.update_one({"id": thread_id}, {"$set": {unread_field: 0}})
    await db.dm_messages.update_many(
        {"thread_id": thread_id, "sender_id": {"$ne": user["_id"]}, "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"messages": messages}

@api.post("/dm/threads/{thread_id}/messages")
async def send_dm(thread_id: str, input: SendDMInput, request: Request):
    user = await get_current_user(request)
    thread = await db.dm_threads.find_one({"id": thread_id}, {"_id": 0})
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    if thread["user1_id"] != user["_id"] and thread["user2_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Not a participant")
    content = input.content.strip()[:5000]
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    msg = {
        "id": str(uuid.uuid4()),
        "thread_id": thread_id,
        "sender_id": user["_id"],
        "content": content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.dm_messages.insert_one(msg)
    # Update thread
    unread_field = "unread_count_user2" if thread["user1_id"] == user["_id"] else "unread_count_user1"
    await db.dm_threads.update_one({"id": thread_id}, {
        "$set": {"last_message_at": msg["created_at"], "last_message_preview": content[:100]},
        "$inc": {unread_field: 1}
    })
    return {"message": {k: v for k, v in msg.items() if k != "_id"}}

# ── Badges ───────────────────────────────────────────────────
@api.get("/badges")
async def list_all_badges(request: Request):
    await get_current_user(request)
    badges = await db.badges.find({}, {"_id": 0}).to_list(100)
    return {"badges": badges}

@api.get("/badges/user/{user_id}")
async def get_user_badges(user_id: str, request: Request):
    await get_current_user(request)
    user_badges = await db.user_badges.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    badge_ids = [ub["badge_id"] for ub in user_badges]
    badges = await db.badges.find({"id": {"$in": badge_ids}}, {"_id": 0}).to_list(100)
    badge_map = {b["id"]: b for b in badges}
    result = []
    for ub in user_badges:
        badge = badge_map.get(ub["badge_id"])
        if badge:
            result.append({**ub, "badge": badge})
    return {"user_badges": result}

@api.put("/badges/showcase")
async def update_badge_showcase(input: BadgeShowcaseInput, request: Request):
    user = await get_current_user(request)
    if len(input.badge_ids) > 6:
        raise HTTPException(status_code=400, detail="Max 6 showcased badges")
    await db.user_badges.update_many({"user_id": user["_id"]}, {"$set": {"is_showcased": False, "showcase_order": None}})
    for i, bid in enumerate(input.badge_ids):
        await db.user_badges.update_one(
            {"user_id": user["_id"], "badge_id": bid},
            {"$set": {"is_showcased": True, "showcase_order": i + 1}}
        )
    return {"message": "Showcase updated"}

# ── Settings ─────────────────────────────────────────────────
@api.put("/settings")
async def update_settings(input: UpdateSettingsInput, request: Request):
    user = await get_current_user(request)
    update = {}
    for field in ["notification_friend_request", "notification_dm", "notification_polaroid", "notification_badge", "sound_enabled", "quiet_hours_enabled"]:
        val = getattr(input, field, None)
        if val is not None:
            update[field] = val
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update})
    updated = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"password_hash": 0})
    updated["_id"] = str(updated["_id"])
    return {"user": updated}

# ── User Stats ───────────────────────────────────────────────
@api.get("/users/{user_id}/stats")
async def get_user_stats(user_id: str, request: Request):
    await get_current_user(request)
    stats = await db.user_statistics.find_one({"user_id": user_id}, {"_id": 0})
    return {"stats": stats or {
        "total_conversations": 0, "total_messages_sent": 0,
        "total_polaroids": 0, "total_friends": 0,
        "longest_conversation_seconds": 0, "most_messages_one_conversation": 0,
    }}

# ── Active Conversations ─────────────────────────────────────
@api.get("/conversations/active/mine")
async def get_active_conversation(request: Request):
    user = await get_current_user(request)
    conv = await db.conversations.find_one({
        "$or": [{"user1_id": user["_id"]}, {"user2_id": user["_id"]}],
        "status": "active"
    }, {"_id": 0})
    if not conv:
        return {"conversation": None}
    return {"conversation": conv}

# ── Seed & Startup ───────────────────────────────────────────
async def seed_database():
    # Countries
    if await db.countries.count_documents({}) == 0:
        for c in COUNTRIES:
            await db.countries.update_one({"code": c["code"]}, {"$set": c}, upsert=True)
        logger.info(f"Seeded {len(COUNTRIES)} countries")
    # Interests
    if await db.interests.count_documents({}) == 0:
        for i in INTERESTS:
            i["id"] = str(uuid.uuid4())
            await db.interests.update_one({"name": i["name"]}, {"$set": i}, upsert=True)
        logger.info(f"Seeded {len(INTERESTS)} interests")
    # Badges
    if await db.badges.count_documents({}) == 0:
        for b in BADGES:
            b["id"] = str(uuid.uuid4())
            await db.badges.update_one({"name": b["name"]}, {"$set": b}, upsert=True)
        logger.info(f"Seeded {len(BADGES)} badges")
    # Admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@justtalk.com")
    admin_pass = os.environ.get("ADMIN_PASSWORD", "admin123")
    admin = await db.users.find_one({"email": admin_email})
    if not admin:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_pass),
            "gender": "other", "username": "admin", "tagline": "system admin",
            "country_code": None, "is_public": False, "is_banned": False,
            "is_vip": True, "conversations_left": 999999,
            "conversations_reset_at": datetime.now(timezone.utc).isoformat(),
            "onboarding_completed": True, "tutorial_completed": True,
            "interests": [], "role": "admin",
            "sound_enabled": True, "notification_friend_request": True,
            "notification_dm": True, "notification_polaroid": True,
            "notification_badge": True, "quiet_hours_enabled": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "last_active_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin user seeded")
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username")
    await db.interests.create_index("name", unique=True)
    await db.interests.create_index("category")
    await db.conversations.create_index("id", unique=True)
    await db.messages.create_index("conversation_id")
    await db.messages.create_index("id")
    await db.polaroids.create_index("user_id")
    await db.polaroids.create_index("id")
    await db.friends.create_index("id")
    await db.dm_threads.create_index("id")
    await db.dm_messages.create_index("thread_id")
    await db.dm_messages.create_index("id")
    await db.badges.create_index("id")
    await db.user_badges.create_index([("user_id", 1), ("badge_id", 1)], unique=True)
    await db.queue.create_index("user_id")
    await db.countries.create_index("code", unique=True)
    logger.info("Database indexes created")

@app.on_event("startup")
async def startup():
    await seed_database()
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write(f"## Admin\n- Email: {os.environ.get('ADMIN_EMAIL', 'admin@justtalk.com')}\n")
        f.write(f"- Password: {os.environ.get('ADMIN_PASSWORD', 'admin123')}\n")
        f.write("- Role: admin\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n")

@app.on_event("shutdown")
async def shutdown():
    client.close()

app.include_router(api)
