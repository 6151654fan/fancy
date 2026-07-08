# CLAUDE.md

# Fancy Chat Project Documentation

## 1. Project Overview

## 1.1 Introduction

Fancy Chat is a customized AI chat platform based on the NextChat open-source project.

The project provides a ChatGPT-like web interface with support for:

* Multi-model AI conversations
* OpenAI-compatible API services
* Local/self-hosted LLM deployment
* User authentication and management
* Persistent local storage
* Hardware information display
* Desktop application packaging

The project is designed to provide a private, extensible AI assistant platform that can run on personal servers.

---

# 2. Main Development Goals

The main goals of this project are:

1. Provide a modern ChatGPT-style user interface.
2. Support multiple AI backend services.
3. Enable private deployment without depending on third-party platforms.
4. Provide user management and access control.
5. Support integration with local inference servers.

Potential backend integrations include:

* OpenAI API
* Azure OpenAI
* OpenAI-compatible inference servers
* SGLang
* vLLM
* Other self-hosted LLM services

---

# 3. Technology Stack

## 3.1 Frontend

Framework:

```
Next.js 14
```

Language:

```
TypeScript
```

Rendering:

```
React
```

UI:

```
Tailwind CSS
```

State Management:

```
Zustand
```

Markdown:

```
react-markdown
```

Main frontend directory:

```
app/components/
```

---

## 3.2 Backend

The backend is implemented using:

```
Next.js App Router API Routes
```

Backend location:

```
app/api/
```

Examples:

```
app/api/users/
app/api/hardware/
```

The backend provides:

* User management
* Authentication
* Configuration APIs
* AI request forwarding
* System information APIs

---

## 3.3 Database

Database:

```
SQLite
```

Library:

```
better-sqlite3
```

Database file:

```
local_chat.db
```

The database stores:

* User information
* Authentication data
* Application configuration
* Persistent application state

---

# 4. Repository Structure

```
fancy/

├── app/
│
│   ├── api/
│   │   │
│   │   ├── users/
│   │   │   └── User related APIs
│   │   │
│   │   ├── hardware/
│   │   │   └── Hardware information APIs
│   │   │
│   │   └── Other backend services
│   │
│   ├── components/
│   │   │
│   │   ├── chat.tsx
│   │   ├── auth.tsx
│   │   ├── markdown.tsx
│   │   ├── exporter.tsx
│   │   └── UI components
│   │
│   ├── page.tsx
│   └── layout.tsx
│
├── public/
│   Static resources
│
├── src-tauri/
│   Desktop application support
│
├── scripts/
│   Build scripts
│
├── test/
│   Test files
│
├── package.json
├── package-lock.json
├── next.config.mjs
├── tsconfig.json
└── local_chat.db
```

---

# 5. Development Environment

Recommended environment:

## Operating System

Linux

Example deployment:

```
Ubuntu Server
```

---

## Node.js

Required:

```
Node.js >= 20
```

Recommended:

```
Node.js 22 LTS
```

Check:

```bash
node -v
npm -v
```

---

# 6. Installation

Clone:

```bash
git clone <repository>
cd fancy
```

Install dependencies:

Recommended:

```bash
npm ci
```

or:

```bash
npm install
```

---

# 7. Development Commands

## Development Server

Start:

```bash
npm run dev
```

Default:

```
http://localhost:3000
```

---

## Production Build

Build:

```bash
npm run build
```

The project uses:

```
BUILD_MODE=standalone
```

The output can run independently.

---

## Production Start

After build:

```bash
node .next/standalone/server.js
```

---

# 8. Configuration Files

## package.json

Contains:

* Dependencies
* Build scripts
* Development scripts

Important:

```
scripts.build
```

Current:

```json
{
 "build": "cross-env BUILD_MODE=standalone next build"
}
```

---

## next.config.mjs

Controls:

* Next.js behavior
* Standalone output
* Experimental options

---

## tsconfig.json

TypeScript configuration.

---

# 9. Database Development Guidelines

## IMPORTANT

Do not initialize SQLite connections during module loading.

Bad:

```typescript
const db = new Database("local_chat.db");
```

Reason:

During:

```
next build
```

Next.js may analyze API routes using multiple workers.

Multiple database initialization can cause:

```
SQLITE_BUSY
database is locked
```

---

Recommended:

```typescript
import Database from "better-sqlite3";

let database = null;

function getDatabase(){

    if(database === null){
        database = new Database(
            "./local_chat.db"
        );

        database.pragma(
            "journal_mode=WAL"
        );
    }

    return database;
}
```

Database should only be opened when API requests arrive.

---

# 10. API Development Rules

API files:

```
app/api/
```

Example:

```
app/api/users/route.ts
```

Standard format:

```typescript
export async function GET(){

}

export async function POST(){

}
```

Rules:

1. Avoid expensive initialization outside functions.
2. Validate all user input.
3. Handle database exceptions.
4. Keep API response format consistent.
5. Avoid blocking operations.

---

# 11. AI Backend Integration

The frontend communicates with AI services through backend APIs.

Supported services:

## OpenAI Compatible API

Example:

```
https://api.openai.com/v1
```

---

## Local Inference Servers

Compatible with:

* SGLang
* vLLM
* Other OpenAI-compatible servers

Typical request:

```
Frontend
   |
   |
Next.js API
   |
   |
LLM Server
```

---

# 12. Important Components

## Chat Component

Location:

```
app/components/chat.tsx
```

Responsibilities:

* Chat interface
* Message rendering
* Streaming response
* Conversation management

---

## Authentication

Location:

```
app/components/auth.tsx
```

Responsibilities:

* Login
* User state
* Permission handling

---

## Markdown Rendering

Location:

```
app/components/markdown.tsx
```

Responsibilities:

* Markdown display
* Code rendering
* Rich content rendering

---

# 13. Current Known Issues

## 13.1 SQLite Build Failure

Error:

```
SqliteError:
database is locked
```

Cause:

SQLite initialization during Next.js build.

Solution:

Use lazy initialization.

---

## 13.2 Missing Sharp Warning

Warning:

```
sharp package is strongly recommended
```

Optional:

```bash
npm install sharp
```

Purpose:

Improve Next.js image optimization.

---

## 13.3 systeminformation Warning

Warning:

```
Cannot resolve:
osx-temperature-sensor
macos-temperature-sensor
```

Reason:

Optional macOS hardware dependencies.

Linux deployment can ignore.

---

# 14. Deployment Guidelines

## Standalone Deployment

Build:

```bash
npm run build
```

Run:

```bash
node .next/standalone/server.js
```

---

## Docker Deployment

Build:

```bash
docker compose build
```

Run:

```bash
docker compose up
```

---

# 15. Development Rules for Claude Code

When modifying this project:

## Before Coding

1. Analyze existing architecture.
2. Identify related components.
3. Avoid unnecessary refactoring.

## Code Changes

1. Prefer minimal modifications.
2. Keep Next.js 14 compatibility.
3. Keep TypeScript type safety.
4. Preserve existing UI behavior.
5. Avoid introducing new dependencies unless necessary.

## Database Changes

Before modifying database logic:

* Check concurrency behavior.
* Avoid build-time database access.
* Use lazy initialization.

## Testing

After modifications:

Run:

```bash
npm run build
```

Check:

* Type errors
* Runtime errors
* API behavior

---

# 16. Project Maintenance

Do not:

* Delete package-lock.json casually.
* Upgrade Next.js without testing.
* Change database schema without migration.
* Put secrets directly into source code.

---

# 17. Future Extension Direction

Possible extensions:

* More LLM provider support
* Local model management
* Multi-user deployment
* RAG knowledge base
* Agent workflows
* Plugin system
* GPU monitoring
* Model performance monitoring

---

# 18. Summary for Claude

This project is a customized NextChat-based AI assistant platform.

Main technologies:

* Next.js 14
* React
* TypeScript
* Tailwind CSS
* SQLite
* better-sqlite3

Main development focus:

* Chat interface
* AI backend integration
* User management
* Private deployment

Always preserve existing architecture and make incremental changes.
