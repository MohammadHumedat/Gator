🐊 Gator: The CLI RSS Feed Aggregator

Welcome to Gator, a high-performance command-line tool designed to keep you updated with your favorite RSS feeds — without ever leaving the terminal.

Whether you're a developer tracking tech blogs or a news junkie, Gator makes content consumption efficient and distraction-free.

🚀 Features

👥 Multi-user Support – Register and switch between different user profiles.

🧠 Smart Aggregation – A background worker that intelligently fetches the oldest feeds first to ensure fresh data.

🔗 Many-to-Many Relationships – Users can follow many feeds, and feeds can have many followers.

🛡️ Conflict Resolution – Built-in handling for duplicate posts and unique feed URLs.

⏱️ Flexible Intervals – Control how often you scrape the web with human-readable durations (e.g., 1m, 1h).

🛠️ Prerequisites

To run Gator, make sure you have:

Node.js (v18.x or higher)

PostgreSQL (v14.x or higher)

TypeScript environment (handled via tsx)

⚙️ Setup & Installation
1️⃣ Clone the Repository
git clone https://github.com/your-username/gator.git
cd gator
2️⃣ Install Dependencies
npm install
3️⃣ Database Migration

Ensure your PostgreSQL server is running, then generate and apply the schema:

npx drizzle-kit generate
npx drizzle-kit migrate
4️⃣ Configuration

Create a file named .gatorconfig.json in your home directory:

{
"db_url": "postgres://username:password@localhost:5432/gator_db",
"current_user_name": "your_user"
}
🎮 Usage & Commands

Run commands using:

npm run start -- <command> <args>
👤 User Management
Command Arguments Description
register <name> Creates a new user and logs them in
login <name> Switches the current active user
users — Lists all registered users
📡 Feed Management
Command Arguments Description
addfeed <name> <url> Adds a new RSS feed and follows it
feeds — Shows all feeds in the database and who created them
follow <url> Starts following an existing feed
unfollow <url> Stops following a specific feed
following — Lists all feeds the current user is following
⚙️ The Aggregator (The Engine)

This is the core of Gator.

Run this in a separate terminal window to keep your database synced:

npm run start -- agg 1m

This will fetch the next available feed every 1 minute.

📖 Reading Content

To view the latest posts from the feeds you follow:

npm run start -- browse 5

The number 5 is optional (defaults to 2).

🛡️ Technical Overview

🗄️ ORM: Drizzle ORM for type-safe database interactions

🧩 Middleware: Custom logged-in middleware to DRY up command handlers

🔄 Concurrency: Graceful handling of SIGINT (Ctrl+C) to safely shut down the aggregator

🧮 SQL Optimization: Uses NULLS FIRST ordering and JOIN operations to optimize feed scheduling and post retrieval

🤝 Contributing

Found a bug or have a feature request?

Feel free to open an issue or submit a pull request.

Let’s make Gator the snappiest aggregator in the swamp 🐊
