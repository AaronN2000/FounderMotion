"""MyRISK local web server.

The server keeps credentials private, provides account sessions, saves each
company's map data in SQLite, and sends map requests to the AI service.
SQLite is a relational database included with Python, so there is no install.
"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from http import cookies
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).parent
DATABASE = ROOT / "myrisk.db"
PORT = int(os.environ.get("PORT", "3000"))
SESSION_COOKIE = "myrisk_session"


def load_local_environment():
    """Load local development settings without displaying their values."""
    file = ROOT / ".env.local"
    if not file.exists():
        return
    for line in file.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            name, value = line.split("=", 1)
            os.environ.setdefault(name.strip(), value.strip().strip("'\""))


def database_connection():
    """Return a database connection that exposes rows by column name."""
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialise_database():
    """Create the relational tables once; existing data is never removed."""
    with database_connection() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                company_name TEXT NOT NULL DEFAULT 'MyRISK',
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                expires_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS map_states (
                user_id INTEGER PRIMARY KEY,
                state_json TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS processes (
                process_number INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                purpose TEXT NOT NULL,
                inputs_json TEXT NOT NULL,
                outputs TEXT NOT NULL,
                feeds TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS process_questions (
                id INTEGER PRIMARY KEY,
                process_number INTEGER NOT NULL,
                question_number INTEGER NOT NULL,
                question TEXT NOT NULL,
                FOREIGN KEY (process_number) REFERENCES processes(process_number)
            );
            CREATE TABLE IF NOT EXISTS process_inputs (
                id INTEGER PRIMARY KEY,
                process_number INTEGER NOT NULL,
                input_number INTEGER NOT NULL,
                input_label TEXT NOT NULL,
                FOREIGN KEY (process_number) REFERENCES processes(process_number)
            );
            CREATE TABLE IF NOT EXISTS process_output_dependencies (
                process_number INTEGER NOT NULL,
                source_process_number INTEGER NOT NULL,
                PRIMARY KEY (process_number, source_process_number),
                FOREIGN KEY (process_number) REFERENCES processes(process_number),
                FOREIGN KEY (source_process_number) REFERENCES processes(process_number)
            );
            CREATE TABLE IF NOT EXISTS process_answers (
                user_id INTEGER NOT NULL,
                process_number INTEGER NOT NULL,
                answer TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                PRIMARY KEY (user_id, process_number),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (process_number) REFERENCES processes(process_number)
            );
            CREATE TABLE IF NOT EXISTS process_answer_history (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                process_number INTEGER NOT NULL,
                answer TEXT NOT NULL,
                replaced_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (process_number) REFERENCES processes(process_number)
            );
            CREATE TABLE IF NOT EXISTS schema_migrations (
                name TEXT PRIMARY KEY,
                applied_at INTEGER NOT NULL
            );
        """)
        try:
            db.execute("ALTER TABLE process_output_dependencies ADD COLUMN source_order INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass  # The column already exists in databases created after this update.
        seed_processes(db)
        seed_process_inputs_and_dependencies(db)
        apply_process_question_update(db)
        apply_plain_language_input_update(db)
        apply_additional_company_context_input_update(db)


def seed_processes(db):
    """Add the initial 13 process definitions only when the table is empty."""
    if db.execute("SELECT 1 FROM processes LIMIT 1").fetchone():
        return

    names = [
        "Market Positioning Analysis", "Sector Challenges / Why Now / Why", "ICP & Buyer Persona Pack",
        "Voice of Customer / Beta Learning Plan", "PMF Metrics Dashboard", "Wedge Value Mapping",
        "Offer Architecture — Trace", "Offer Architecture — Essentials", "Value Proposition Canvases — Trace and Essentials",
        "Product Roadmap & Feature Prioritisation Matrix", "Product Proof Architecture", "Pricing Diagnostic",
        "Price List / Commercial Model"
    ]
    first_inputs = ["Gartner PMF & target-market prioritisation", "Brand handbook & wedge definitions", "Sector / competitive-category research", "Early customer / beta feedback & buyer language", "Trace vs Essentials use-case logic"]
    first_questions = ["Which market should MyRISK target first?", "Which buyer feels the problem most urgently?", "Which category should MyRISK avoid being trapped in?", "What alternatives does the buyer use today?", "Which wedge leads in each priority market?"]
    for number, name in enumerate(names, 1):
        purpose = "Define MyRISK market focus, competitive frame, wedge positioning and market-entry logic." if number == 1 else f"Develop the strategic decisions and evidence for {name}."
        inputs = first_inputs if number == 1 else ["Previous process outputs", "Customer and market evidence", "Relevant internal documentation"]
        outputs = "Priority ICPs and segments; competitive frame of reference; positioning statement and differentiation themes; Trace / Essentials market-entry logic." if number == 1 else f"Clear decisions, evidence gaps, and downstream inputs for {name}."
        questions = first_questions if number == 1 else [f"What is the key decision for {name}?", "What evidence supports the decision?", "What should be carried into the next process?"]
        db.execute("INSERT INTO processes (process_number, name, purpose, inputs_json, outputs, feeds) VALUES (?, ?, ?, ?, ?, ?)", (number, name, purpose, json.dumps(inputs), outputs, "Next process"))
        for question_number, question in enumerate(questions, 1):
            db.execute("INSERT INTO process_questions (process_number, question_number, question) VALUES (?, ?, ?)", (number, question_number, question))


def seed_process_inputs_and_dependencies(db):
    """Backfill normalized input and output-dependency tables for existing databases."""
    if not db.execute("SELECT 1 FROM process_inputs LIMIT 1").fetchone():
        for process in db.execute("SELECT process_number, inputs_json FROM processes").fetchall():
            for input_number, label in enumerate(json.loads(process["inputs_json"]), 1):
                db.execute("INSERT INTO process_inputs (process_number, input_number, input_label) VALUES (?, ?, ?)", (process["process_number"], input_number, label))

    dependencies = {
        1: [], 2: [1], 3: [1, 2], 4: [3], 5: [4], 6: [1, 2, 3], 7: [3],
        8: [6, 3], 9: [3, 4, 6], 10: [4, 6, 7, 8], 11: [7, 8, 10],
        12: [4, 6, 7, 8, 10], 13: [12, 7, 8, 10]
    }
    for process_number, sources in dependencies.items():
        for source_order, source in enumerate(sources, 1):
            db.execute("INSERT OR IGNORE INTO process_output_dependencies (process_number, source_process_number, source_order) VALUES (?, ?, ?)", (process_number, source, source_order))
            db.execute("UPDATE process_output_dependencies SET source_order = ? WHERE process_number = ? AND source_process_number = ?", (source_order, process_number, source))


def apply_process_question_update(db):
    """Apply the supplied Phase 2–13 questions once without overwriting future edits."""
    migration_name = "process_questions_v2"
    if db.execute("SELECT 1 FROM schema_migrations WHERE name = ?", (migration_name,)).fetchone():
        return

    questions = {
        2: ["What is changing in each sector?", "Why does the problem matter now?", "Is the dominant strain scrutiny, or growth and complexity?", "Which sectors fit Trace first and which fit Essentials first?", "What trigger creates a buying conversation?"],
        3: ["Who is the ideal first buyer?", "What account conditions indicate readiness?", "Who is economic buyer, functional owner and influencer?", "What triggers action and what blocks purchase?", "How does the buyer define success?"],
        4: ["What problem is painful enough to act on?", "Which use case is most urgent?", "What language do buyers use?", "What would they pay for and when?", "What feature or proof is required for a pilot?"],
        5: ["Which segment converts best?", "Which use case produces urgency?", "What objections repeat?", "Are diagnostics converting to pilots?", "What features, proof points or prices are blocking progress?"],
        6: ["What exact problem does Trace solve?", "What exact problem does Essentials solve?", "Which use cases belong to each wedge?", "What outcome matters most to each buyer?", "Which sector / use-case combinations should be prioritised first?"],
        7: ["What can the buyer buy first?", "What is diagnostic vs pilot vs implementation?", "Is it product, service or combined?", "Which use cases are in and out of scope?", "What does success prove?"],
        8: ["What practical problem does Essentials solve first?", "What is the minimum viable setup?", "What support is needed to start?", "What is in / out of scope?", "How does the offer stay simple but valuable?"],
        9: ["What job is the buyer hiring each wedge to do?", "What pain is urgent enough to act on?", "What gain would make the buyer feel progress?", "What alternatives are used today?", "Which messages should be tested?"],
        10: ["Which capabilities are essential for beta?", "Which features support the first landable use case?", "What is must-have, should-have or later?", "What dependencies exist?", "How should the roadmap be communicated?"],
        11: ["What does Trace capture and prove?", "What does Essentials capture and prove?", "What outputs does the buyer receive?", "What evidence supports the claim?", "What proof is needed for a pilot to succeed?"],
        12: ["What is the value metric?", "How should Trace price (decision class, workflow, user, entity or scope)?", "How should Essentials price (org size, users, module or support tier)?", "What should diagnostics, pilots and implementations cost?", "What price creates commitment without blocking early adoption?"],
        13: ["What can sales quote?", "What is fixed fee, subscription or custom scope?", "What is included and excluded?", "What discounting is allowed?", "What requires approval?"]
    }
    for process_number, process_questions in questions.items():
        db.execute("DELETE FROM process_questions WHERE process_number = ?", (process_number,))
        for question_number, question in enumerate(process_questions, 1):
            db.execute("INSERT INTO process_questions (process_number, question_number, question) VALUES (?, ?, ?)", (process_number, question_number, question))
    db.execute("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)", (migration_name, int(time.time())))


def apply_plain_language_input_update(db):
    """Replace the first process's specialist labels with plain-language requests."""
    migration_name = "plain_language_process_1_inputs_v1"
    if db.execute("SELECT 1 FROM schema_migrations WHERE name = ?", (migration_name,)).fetchone():
        return

    plain_language_inputs = [
        "Any research or notes showing which customers or industries may need your product most",
        "A short description of your company, what you offer, and what makes you different",
        "Information about the industries you serve, competitors, and other options customers use today",
        "Notes, emails, interviews, or feedback from early customers and testers",
        "Any other information we ought to know about your company or business, or anything that makes your company special"
    ]
    for input_number, label in enumerate(plain_language_inputs, 1):
        db.execute("UPDATE process_inputs SET input_label = ? WHERE process_number = 1 AND input_number = ?", (label, input_number))
    db.execute("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)", (migration_name, int(time.time())))


def apply_additional_company_context_input_update(db):
    """Keep the final first-process input clear and useful for every workspace."""
    migration_name = "additional_company_context_input_v1"
    if db.execute("SELECT 1 FROM schema_migrations WHERE name = ?", (migration_name,)).fetchone():
        return

    db.execute(
        "UPDATE process_inputs SET input_label = ? WHERE process_number = 1 AND input_number = 5",
        ("Any other information we ought to know about your company or business, or anything that makes your company special",)
    )
    db.execute("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)", (migration_name, int(time.time())))


def all_processes():
    """Read process names and questions from the relational database for the UI."""
    with database_connection() as db:
        processes = db.execute("SELECT * FROM processes ORDER BY process_number").fetchall()
        questions = db.execute("SELECT * FROM process_questions ORDER BY process_number, question_number").fetchall()
        inputs = db.execute("SELECT * FROM process_inputs ORDER BY process_number, input_number").fetchall()
        dependencies = db.execute("SELECT * FROM process_output_dependencies ORDER BY process_number, source_order").fetchall()
    questions_by_process = {}
    for question in questions:
        questions_by_process.setdefault(question["process_number"], []).append(question["question"])
    inputs_by_process = {}
    for input_row in inputs:
        inputs_by_process.setdefault(input_row["process_number"], []).append(input_row["input_label"])
    dependencies_by_process = {}
    for dependency in dependencies:
        dependencies_by_process.setdefault(dependency["process_number"], []).append(dependency["source_process_number"])
    return [{"number": row["process_number"], "title": row["name"], "category": "Strategic process", "purpose": row["purpose"], "inputs": inputs_by_process.get(row["process_number"], []), "questions": questions_by_process.get(row["process_number"], []), "outputSources": dependencies_by_process.get(row["process_number"], []), "outputs": row["outputs"], "feeds": row["feeds"]} for row in processes]


def password_hash(password, salt):
    """Hash a password slowly so database contents cannot reveal passwords."""
    return hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 210_000).hex()


def create_session(user_id, remember):
    """Create an opaque cookie token that points to a database session."""
    token = secrets.token_urlsafe(32)
    lifetime = 60 * 60 * 24 * (30 if remember else 1)
    with database_connection() as db:
        db.execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)", (user_id, token, int(time.time()) + lifetime))
    return token, lifetime


def user_from_cookie(header):
    """Find the currently signed-in user from a valid, unexpired session."""
    jar = cookies.SimpleCookie(header or "")
    if SESSION_COOKIE not in jar:
        return None
    token = jar[SESSION_COOKIE].value
    with database_connection() as db:
        row = db.execute("""
            SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ? AND sessions.expires_at > ?
        """, (token, int(time.time()))).fetchone()
    return row


def public_user(user):
    """Return only the account details that are safe to send to the browser."""
    return {"username": user["username"], "email": user["email"], "companyName": user["company_name"]}


def response_text(response):
    """Extract readable text from a Responses API result."""
    if response.get("output_text"):
        return response["output_text"]
    return "\n".join(
        item.get("text", "")
        for output in response.get("output", [])
        for item in output.get("content", [])
        if item.get("type") == "output_text"
    )


def create_decision_brief(payload):
    """Use the submitted evidence to create a decision brief through the AI API."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("The AI API key is not configured.")
    step = payload.get("step", {})
    documents = payload.get("documents", [])[:20]
    questions = "\n".join(f"{number}. {question}" for number, question in enumerate(step.get("questions", []), 1))
    sources = "\n\n".join(
        f"SOURCE {number}: {doc.get('name', 'Untitled')}\nInput supported: {doc.get('input', 'General')}\n{str(doc.get('text', ''))[:12000]}"
        for number, doc in enumerate(documents, 1)
    )
    if not sources:
        raise ValueError("Please add documentation before generating an output.")
    previous = "\n\n".join(payload.get("previousOutputs", [])) or "None yet."
    body = {"model": "gpt-5.6-sol", "input": [
        {"role": "developer", "content": "You are a strategic market-positioning analyst. Answer every numbered question using the substantive content of the supplied evidence. Do not require documents to mention a particular company or brand name: evidence may still be relevant when it describes the business, market, customers, products, or operations without naming the company. Do not invent facts. Identify any important evidence gaps briefly, then still give the best practical answer and recommendation possible from the available evidence. Clearly label conclusions that are informed assumptions rather than established facts. Ignore sources that are clearly unrelated. Make the response presentation-ready Markdown: begin every answer with its full question in bold on its own line, followed by a concise answer beneath it; use short paragraphs or bullets; and use a Markdown table only where it makes a comparison easier to understand. End with a bold Recommended decision heading and a short recommendation."},
        {"role": "user", "content": f"Purpose: {step.get('purpose', '')}\n\nQuestions:\n{questions}\n\nDocumentation:\n{sources}\n\nPrevious outputs:\n{previous}"}
    ]}
    request = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return response_text(json.loads(response.read().decode()))
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors="replace")[:500]
        raise ValueError(f"AI service returned {error.code}: {detail}") from error


class MyRiskHandler(BaseHTTPRequestHandler):
    """HTTP routes for account actions, saved map data, AI analysis, and web files."""

    def send_json(self, status, body, cookie=None):
        encoded = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        if cookie:
            self.send_header("Set-Cookie", cookie.output(header="").strip())
        self.end_headers()
        self.wfile.write(encoded)

    def read_body(self):
        size = int(self.headers.get("Content-Length", "0"))
        if size > 1_500_000:
            raise ValueError("Request is too large.")
        return json.loads(self.rfile.read(size).decode("utf-8"))

    def current_user(self):
        return user_from_cookie(self.headers.get("Cookie"))

    def session_cookie(self, token, max_age):
        jar = cookies.SimpleCookie()
        jar[SESSION_COOKIE] = token
        jar[SESSION_COOKIE]["path"] = "/"
        jar[SESSION_COOKIE]["httponly"] = True
        jar[SESSION_COOKIE]["samesite"] = "Lax"
        jar[SESSION_COOKIE]["max-age"] = max_age
        return jar

    def require_user(self):
        user = self.current_user()
        if not user:
            self.send_json(401, {"error": "Please log in first."})
        return user

    def do_POST(self):
        try:
            payload = self.read_body()
            if self.path == "/api/auth/register":
                self.register(payload)
            elif self.path == "/api/auth/login":
                self.login(payload)
            elif self.path == "/api/auth/logout":
                self.logout()
            elif self.path == "/api/auth/forgot-password":
                self.send_json(200, {"message": "If the account exists, a reset email will be sent when email delivery is configured."})
            elif self.path == "/api/analyze":
                user = self.require_user()
                if user:
                    self.send_json(200, {"answer": create_decision_brief(payload) or "No answer was returned."})
            else:
                self.send_json(404, {"error": "Not found."})
        except (ValueError, sqlite3.IntegrityError) as error:
            self.send_json(400, {"error": str(error)})

    def do_GET(self):
        if self.path == "/api/processes":
            self.send_json(200, {"processes": all_processes()})
            return
        if self.path == "/api/auth/session":
            user = self.current_user()
            self.send_json(200, {"user": public_user(user) if user else None})
            return
        if self.path == "/api/state":
            user = self.require_user()
            if user:
                with database_connection() as db:
                    row = db.execute("SELECT state_json FROM map_states WHERE user_id = ?", (user["id"],)).fetchone()
                    answers = db.execute("SELECT process_number, answer FROM process_answers WHERE user_id = ?", (user["id"],)).fetchall()
                    history_rows = db.execute("SELECT process_number, answer, replaced_at FROM process_answer_history WHERE user_id = ? ORDER BY replaced_at DESC, id DESC", (user["id"],)).fetchall()
                state = json.loads(row["state_json"]) if row else {"step": 0, "documents": []}
                state["outputs"] = (state.get("outputs", []) + [""] * 13)[:13]
                for answer in answers:
                    state["outputs"][answer["process_number"] - 1] = answer["answer"]
                state["history"] = {}
                for history in history_rows:
                    versions = state["history"].setdefault(str(history["process_number"]), [])
                    if len(versions) < 3:
                        versions.append({"answer": history["answer"], "replacedAt": history["replaced_at"]})
                self.send_json(200, {"state": state})
            return
        self.serve_file()

    def do_PUT(self):
        try:
            user = self.require_user()
            if not user:
                return
            payload = self.read_body()
            if self.path == "/api/state":
                with database_connection() as db:
                    existing_answers = {
                        row["process_number"]: row["answer"]
                        for row in db.execute("SELECT process_number, answer FROM process_answers WHERE user_id = ?", (user["id"],)).fetchall()
                    }
                    new_answers = {index: answer for index, answer in enumerate(payload.get("outputs", []), 1) if answer}
                    changed_processes = []
                    for process_number, previous_answer in existing_answers.items():
                        if new_answers.get(process_number) != previous_answer:
                            db.execute("INSERT INTO process_answer_history (user_id, process_number, answer, replaced_at) VALUES (?, ?, ?, ?)", (user["id"], process_number, previous_answer, int(time.time())))
                            changed_processes.append(process_number)
                    for process_number in changed_processes:
                        db.execute("DELETE FROM process_answer_history WHERE id IN (SELECT id FROM process_answer_history WHERE user_id = ? AND process_number = ? ORDER BY replaced_at DESC, id DESC LIMIT -1 OFFSET 3)", (user["id"], process_number))
                    state_for_storage = {"step": payload.get("step", 0), "documents": payload.get("documents", [])}
                    db.execute("INSERT INTO map_states (user_id, state_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at", (user["id"], json.dumps(state_for_storage), int(time.time())))
                    db.execute("DELETE FROM process_answers WHERE user_id = ?", (user["id"],))
                    for index, answer in new_answers.items():
                        if answer:
                            db.execute("INSERT INTO process_answers (user_id, process_number, answer, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, process_number) DO UPDATE SET answer = excluded.answer, updated_at = excluded.updated_at", (user["id"], index, answer, int(time.time())))
                self.send_json(200, {"saved": True})
            elif self.path == "/api/company":
                name = str(payload.get("companyName", "")).strip()
                if not 2 <= len(name) <= 50:
                    raise ValueError("Company name must be between 2 and 50 characters.")
                with database_connection() as db:
                    db.execute("UPDATE users SET company_name = ? WHERE id = ?", (name, user["id"]))
                self.send_json(200, {"companyName": name})
            else:
                self.send_json(404, {"error": "Not found."})
        except ValueError as error:
            self.send_json(400, {"error": str(error)})

    def register(self, payload):
        identity = str(payload.get("identity", "")).strip().lower()
        password = str(payload.get("password", ""))
        company = str(payload.get("companyName", "")).strip() or "MyRISK"
        if len(identity) < 3 or len(password) < 8:
            raise ValueError("Enter a username or email and a password of at least 8 characters.")
        salt = secrets.token_hex(16)
        email = identity if "@" in identity else None
        with database_connection() as db:
            existing = db.execute("SELECT 1 FROM users WHERE username = ? OR email = ?", (identity, email)).fetchone()
            if existing:
                raise ValueError("That username or email is already registered. Please log in or choose another one.")
            cursor = db.execute("INSERT INTO users (username, email, password_hash, password_salt, company_name, created_at) VALUES (?, ?, ?, ?, ?, ?)", (identity, email, password_hash(password, salt), salt, company, int(time.time())))
        token, lifetime = create_session(cursor.lastrowid, bool(payload.get("remember")))
        self.send_json(201, {"user": {"username": identity, "companyName": company}}, self.session_cookie(token, lifetime))

    def login(self, payload):
        identity = str(payload.get("identity", "")).strip().lower()
        password = str(payload.get("password", ""))
        with database_connection() as db:
            user = db.execute("SELECT * FROM users WHERE username = ? OR email = ?", (identity, identity)).fetchone()
        if not user or not hmac.compare_digest(user["password_hash"], password_hash(password, user["password_salt"])):
            raise ValueError("Incorrect username/email or password.")
        token, lifetime = create_session(user["id"], bool(payload.get("remember")))
        self.send_json(200, {"user": public_user(user)}, self.session_cookie(token, lifetime))

    def logout(self):
        jar = cookies.SimpleCookie(self.headers.get("Cookie", ""))
        if SESSION_COOKIE in jar:
            with database_connection() as db:
                db.execute("DELETE FROM sessions WHERE token = ?", (jar[SESSION_COOKIE].value,))
        expired = self.session_cookie("", 0)
        self.send_json(200, {"loggedOut": True}, expired)

    def serve_file(self):
        requested = "index.html" if self.path in ("/", "") else self.path.lstrip("/").split("?", 1)[0]
        file = (ROOT / requested).resolve()
        if ROOT not in file.parents or not file.is_file():
            self.send_error(404)
            return
        data = file.read_bytes()
        content_types = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8"}
        self.send_response(200)
        self.send_header("Content-Type", content_types.get(file.suffix, "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    load_local_environment()
    initialise_database()
    print(f"MyRISK is running at http://localhost:{PORT}")
    ThreadingHTTPServer(("", PORT), MyRiskHandler).serve_forever()
