use actix_cors::Cors;
use actix_files as fs;
use actix_session::{storage::CookieSessionStore, Session, SessionMiddleware};
use actix_web::HttpRequest;
use actix_web::{cookie::Key, middleware::Logger, web, App, HttpResponse, HttpServer, Responder};
use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};
use log::info;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use std::sync::{Arc, Mutex}; // Add this import for HttpRequest
use actix_web::cookie::{time::Duration as ActixDuration, SameSite};
use chrono::{DateTime, Utc};

type UserId = i64; // SQLite uses i64 for AUTOINCREMENT IDs

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[derive(FromRow)]
struct User {
    id: UserId,
    username: String,
    password_hash: String,
    email: String,
    gender: String,
}

#[derive(Clone)]
struct ChatRoom {
    messages: Arc<Mutex<Vec<(UserId, String)>>>,
}

impl ChatRoom {
    fn new() -> Self {
        ChatRoom {
            messages: Arc::new(Mutex::new(Vec::new())),
        }
    }

    fn add_message(&self, user_id: UserId, message: String) {
        let mut messages = self.messages.lock().unwrap();
        messages.push((user_id, message.clone()));
        info!("Added message from user {}: {}", user_id, message);
    }

    fn get_messages(&self) -> Vec<(UserId, String)> {
        let messages = self.messages.lock().unwrap();
        info!("Fetched messages");
        messages.clone()
    }
}

#[derive(Serialize, Deserialize)]
struct MessageRequest {
    message: String,
}

#[derive(Serialize, Deserialize)]
struct RegisterRequest {
    username: String,
    password: String,
    email: String,
    gender: String, // 'male' or 'female'
}

#[derive(Serialize, Deserialize)]
struct AuthRequest {
    username: String,
    password: String,
}

#[derive(Serialize, FromRow)]
struct Challenge {
    id: i32,
    title: String,
    description: String,
    points: i32,
    progress: i32,
    goal: i32,
    user_id: i32,
}

#[derive(Serialize, FromRow)]
struct Activity {
    id: i32,
    description: String,
    timestamp: DateTime<Utc>,
    user_id: i32,
}

#[derive(Deserialize)]
struct UpdateChallengeProgress {
    challenge_id: i32,
    progress: i32,
}

async fn get_messages(chat_room: web::Data<ChatRoom>) -> impl Responder {
    info!("Reached get_messages handler");
    let messages = chat_room.get_messages();
    HttpResponse::Ok().json(messages)
}

async fn post_message(
    chat_room: web::Data<ChatRoom>,
    msg: web::Json<MessageRequest>,
    session: Session,
    req: HttpRequest, // Add HttpRequest to access cookies
) -> impl Responder {
    info!("Handling post_message request");
    let cookies = req.cookies();
    info!("Cookies in request: {:?}", cookies); // Log cookies in the request
    let user_id: Option<UserId> = session.get("user_id").unwrap_or(None);
    info!("Session user_id: {:?}", user_id); // Log session user_id
    if let Some(user_id) = user_id {
        chat_room.add_message(user_id, msg.message.clone());
        info!("Added message from user {}: {}", user_id, msg.message);
        HttpResponse::Ok().json(msg.message.clone())
    } else {
        info!("Session invalid or missing");
        // Log session state for debugging
        let session_state = session.entries();
        info!("Session state: {:?}", session_state);
        HttpResponse::Unauthorized().json("Not logged in")
    }
}

async fn register_user(
    state: web::Data<AppState>,
    req: web::Json<RegisterRequest>,
) -> impl Responder {
    info!("Handling register_user request");

    // Validate input
    if req.username.is_empty() || req.password.is_empty() || req.email.is_empty() {
        // Removed unnecessary parentheses
        return HttpResponse::BadRequest().json("Username, password, and email cannot be empty");
    }
    if !["male", "female"].contains(&req.gender.as_str()) {
        return HttpResponse::BadRequest().json("Gender must be 'male' or 'female'");
    }

    // Check if username or email exists
    let existing_user: Option<User> =
        sqlx::query_as("SELECT * FROM users WHERE username = ? OR email = ?")
            .bind(&req.username)
            .bind(&req.email)
            .fetch_optional(&state.db)
            .await
            .unwrap_or(None);

    if existing_user.is_some() {
        info!("Username or email already exists: {}", req.username);
        return HttpResponse::BadRequest().json("Username or email already exists");
    }

    // Hash password
    let salt = SaltString::generate(&mut OsRng);
    let hashed_password = Argon2::default()
        .hash_password(req.password.as_bytes(), &salt)
        .unwrap()
        .to_string();

    // Insert user into database
    let result = sqlx::query(
        "INSERT INTO users (username, password_hash, email, gender) VALUES (?, ?, ?, ?)",
    )
    .bind(&req.username)
    .bind(&hashed_password)
    .bind(&req.email)
    .bind(&req.gender)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => {
            info!("Added user: {}", req.username);
            HttpResponse::Ok().json("User registered successfully")
        }
        Err(e) => {
            info!("Failed to register user: {}", e);
            HttpResponse::InternalServerError().json("Failed to register user")
        }
    }
}

async fn authenticate_user(
    state: web::Data<AppState>,
    req: web::Json<AuthRequest>,
    session: Session,
) -> impl Responder {
    info!("Handling authenticate_user request");
    info!("Received login request for username: {}", req.username);

    // Validate input
    if req.username.is_empty() || req.password.is_empty() {
        info!("Invalid input: username or password is empty");
        return HttpResponse::BadRequest().json("Username and password cannot be empty");
    }

    // Fetch user from database
    let user: Option<User> = sqlx::query_as("SELECT * FROM users WHERE username = ?")
        .bind(&req.username)
        .fetch_optional(&state.db)
        .await
        .unwrap_or_else(|e| {
            info!("Database query failed: {}", e);
            None
        });

    match user {
        Some(user) => {
            info!("User found: {}", user.username);
            // Verify password
            let parsed_hash = PasswordHash::new(&user.password_hash).unwrap();
            if Argon2::default()
                .verify_password(req.password.as_bytes(), &parsed_hash)
                .is_ok()
            {
                // Store user_id in session
                session.insert("user_id", user.id).unwrap();
                let session_data: Option<UserId> = session.get("user_id").unwrap();
                info!("Session set with user_id: {:?}", session_data); // Debug
                HttpResponse::Ok().json(user.id)
            } else {
                info!("Password verification failed for user: {}", req.username);
                HttpResponse::Unauthorized().json("Invalid username or password")
            }
        }
        None => {
            info!("User not found: {}", req.username);
            HttpResponse::Unauthorized().json("Invalid username or password")
        }
    }
}

async fn logout(session: Session) -> impl Responder {
    info!("Handling logout request");
    session.clear();
    HttpResponse::Ok().json("Logged out successfully")
}

async fn favicon() -> actix_web::Result<actix_files::NamedFile> {
    Ok(actix_files::NamedFile::open(
        "../frontend/public/favicon.ico",
    )?)
}

async fn index() -> actix_web::Result<actix_files::NamedFile> {
    Ok(fs::NamedFile::open("../frontend/build/index.html")?)
}

async fn get_challenges(pool: web::Data<SqlitePool>, user_id: web::Path<i32>) -> impl Responder {
    let challenges = sqlx::query_as::<_, Challenge>("SELECT * FROM challenges WHERE user_id = ?")
        .bind(user_id.into_inner())
        .fetch_all(pool.get_ref())
        .await
        .unwrap_or_default();
    HttpResponse::Ok().json(challenges)
}

async fn update_challenge_progress(
    pool: web::Data<SqlitePool>,
    user_id: web::Path<i32>,
    req: web::Json<UpdateChallengeProgress>,
) -> impl Responder {
    let user_id = user_id.into_inner();
    let challenge = sqlx::query_as::<_, Challenge>("SELECT * FROM challenges WHERE id = ? AND user_id = ?")
        .bind(req.challenge_id)
        .bind(user_id)
        .fetch_optional(pool.get_ref())
        .await
        .unwrap();

    if let Some(challenge) = challenge {
        if challenge.progress < challenge.goal {
            let new_progress = req.progress.min(challenge.goal);
            sqlx::query("UPDATE challenges SET progress = ? WHERE id = ? AND user_id = ?")
                .bind(new_progress)
                .bind(req.challenge_id)
                .bind(user_id)
                .execute(pool.get_ref())
                .await
                .unwrap();

            if new_progress == challenge.goal {
                sqlx::query("UPDATE users SET points = points + ? WHERE id = ?")
                    .bind(challenge.points)
                    .bind(user_id)
                    .execute(pool.get_ref())
                    .await
                    .unwrap();

                sqlx::query("INSERT INTO activity (description, timestamp, user_id) VALUES (?, ?, ?)")
                    .bind(format!("Completed challenge: {}", challenge.title))
                    .bind(Utc::now())
                    .bind(user_id)
                    .execute(pool.get_ref())
                    .await
                    .unwrap();
            }

            return HttpResponse::Ok().body("Progress updated");
        }
    }
    HttpResponse::BadRequest().body("Invalid challenge or already completed")
}

async fn get_activity(pool: web::Data<SqlitePool>, user_id: web::Path<i32>) -> impl Responder {
    let activities = sqlx::query_as::<_, Activity>("SELECT * FROM activity WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5")
        .bind(user_id.into_inner())
        .fetch_all(pool.get_ref())
        .await
        .unwrap_or_default();
    HttpResponse::Ok().json(activities)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "info");
    env_logger::init();
    info!("Logger initialized");

    // Connect to SQLite database
    info!("Attempting to connect to database");
    let db = SqlitePool::connect("sqlite://chat.db").await.map_err(|e| {
        eprintln!("Failed to connect to database: {}", e);
        std::io::Error::new(std::io::ErrorKind::Other, "Database connection failed")
    })?;
    info!("Database connected successfully");

    let state = AppState { db };
    let chat_room = ChatRoom::new();

    info!("Starting server");

    HttpServer::new(move || {
        let secret_key = Key::generate();
        info!("Generated session key");

        App::new()
            .wrap(Logger::default())
            .wrap(
                SessionMiddleware::builder(CookieSessionStore::default(), secret_key)
                    .cookie_name("actix-session".to_string()) // Fixed type mismatch by converting to String
                    .cookie_secure(false) // Set to true in production with HTTPS
                    .cookie_http_only(true)
                    .cookie_same_site(SameSite::Lax)
                    .cookie_path("/".to_string()) // Fixed type mismatch by converting to String
                    .cookie_domain(Some("localhost".to_string())) // Fixed type mismatch by converting to String
                    .session_lifecycle(
                        actix_session::config::PersistentSession::default()
                            .session_ttl(ActixDuration::days(1)) // Set session TTL to 1 day
                    )
                    .build()
            )
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header()
                    .supports_credentials()
            )
            .app_data(web::Data::new(state.clone()))
            .app_data(web::Data::new(chat_room.clone()))
            .route("/api/register", web::post().to(register_user))
            .route("/api/authenticate", web::post().to(authenticate_user))
            .route("/api/messages", web::get().to(get_messages))
            .route("/api/messages", web::post().to(post_message))
            .route("/api/logout", web::post().to(logout))
            .route("/api/challenges/{user_id}", web::get().to(get_challenges))
            .route("/api/challenges/{user_id}", web::post().to(update_challenge_progress))
            .route("/api/activity/{user_id}", web::get().to(get_activity))
            .route("/favicon.ico", web::get().to(favicon))
            .service(fs::Files::new("/static", "../frontend/build/static").use_hidden_files())
            .service(
                fs::Files::new("/", "../frontend/build")
                    .index_file("index.html")
                    .use_hidden_files(),
            )
            .default_service(web::route().to(index))
    })
    .bind("127.0.0.1:8000")
    .map_err(|e| {
        eprintln!("Failed to bind server: {}", e);
        e
    })?
    .run()
    .await?;
    println!("Server has stopped");
    Ok(())
}
