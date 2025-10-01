# WebOS - A Complete Operating System Interface

## Overview
WebOS is a complete operating system interface designed to provide a modern, intuitive, and feature-rich web-based user experience. Built with a robust frontend using Vuetify 3 (with TypeScript support) and a scalable backend powered by Node.js Express in TypeScript with TypeORM 0.31, WebOS offers a seamless integration between user-facing components and data management.

Core Features:
- A responsive, customizable dashboard with real-time system monitoring
- User authentication and role-based access control
- File system navigation and management
- Application launcher with drag-and-drop functionality
- System settings and configuration panel
- Real-time notifications and alerts
- Integrated terminal emulator with command history

WebOS is designed to serve as a comprehensive platform for developers and end-users alike, providing a familiar operating system experience through a web interface accessible from any modern browser.

## Architecture

### Security Best Practices Overview

This project ships with a lightweight Express REST API and a Vue 3/Vite client. When deploying to any hosted environment—especially cloud-based file storage—apply the following practices:

- **Enforce authentication & authorization**: protect every `/api` route behind session or token checks before exposing it publicly.
- **Validate and sanitize inputs**: reuse the server-side path utilities (`sanitizePath`, `sanitizeName`) for any user-supplied file paths or names and reject unexpected characters early.
- **Rate limit & log**: configure middleware such as `express-rate-limit` plus structured logging to detect brute-force or scraping attempts.
- **TLS everywhere**: terminate TLS in front of the Node.js server (e.g., via a reverse proxy) so credentials and file transfers never traverse the network in cleartext.
- **Least-privilege storage**: run the server with a dedicated OS user that can only read/write within `src/server/storage/workbench/`; mount cloud volumes with scoped IAM roles or service accounts.
- **Integrity & retention**: version JSON state files and user documents in object storage or backups so tampering can be detected and data can be restored quickly.
- **Automated security testing**: add CI jobs that lint dependencies (`npm audit`), run type checks, and execute integration tests against the REST API before every deployment cycle.

### WebAssembly Extension SDK (AWML Platform)

Phase 3 introduces a pluggable SDK that allows Workbench extensions to be authored as XML-based **AWML** manifests coupled with WebAssembly binaries. The new runtime provides:

- **AWML descriptors** – XML files with the `.awml` extension declare module metadata, the WebAssembly module to load, the exported entry point, and user configuration (`<config><setting name="key" value="foo"/></config>`). AWML files live inside the workbench storage just like any other document.
- **Deterministic WASM execution** – On double-click, the Vue client loads the AWML descriptor, resolves the referenced `.wasm` asset via the `/api/files/raw` endpoint, and instantiates it inside an isolated runtime with Amiga-flavoured host bindings.
- **Host environment** – The SDK exposes `env.awml_log(ptr,len)` for retro console output and passes module configuration as UTF-8 JSON into the declared entry function (by convention, modules export `awml_alloc` for memory allocation and an entry such as `awml_entry(configPtr, configLen)`). Future imports can be added without breaking existing extensions.
- **Windowed execution shell** – AWML programs run inside `AmigaAwmlRunner`, a desktop window that surfaces runtime status, logs, and resolved metadata so developers can debug their extensions in real-time.
- **Fallback behaviour** – Files without AWML support now open in a metadata inspector window, ensuring unknown types are still discoverable while AWML and classic text documents retain their specialised experiences.

### Frontend (Vuetify 3 with TypeScript)

The frontend of WebOS is built using Vuetify 3, a modern, component-based UI framework for Vue.js. Vuetify 3 provides a rich set of pre-designed components that adhere to Material Design principles, ensuring a consistent and visually appealing user interface.

Key Frontend Components:
- Responsive layout system with flexible grid and responsive breakpoints
- Material Design components (buttons, cards, dialogs, forms, navigation bars)
- Dynamic theming with support for light and dark modes
- State management using Vuex or Pinia for complex application state
- TypeScript integration for type safety and better developer experience

Vuetify 3 is configured with TypeScript support, requiring Node.js v14 or higher and TypeScript to be installed. The framework is designed to work seamlessly with modern TypeScript features, providing type safety and improved code quality.

### Backend (Node.js Express with TypeScript and TypeORM 0.31)

The backend of WebOS is built using Node.js Express, a minimal and flexible Node.js web application framework. The application leverages TypeScript for type safety and maintainability, and TypeORM 0.31 for database operations.

Key Backend Components:
- RESTful API endpoints for frontend communication
- TypeORM 0.31 for database modeling and operations
- Authentication and authorization middleware
- Data validation and error handling
- Caching and performance optimization

TypeORM 0.31 requires Node.js 16, 18, or 20 and TypeScript 5.x or later. The framework supports multiple database drivers (PostgreSQL, MySQL, SQLite, etc.) and provides a clean, intuitive API for database operations. The latest release (0.3.27) includes important security updates and breaking changes that should be considered during implementation.

### Integration

The frontend and backend communicate through RESTful API endpoints. Vuetify 3 components make HTTP requests to the Express backend to retrieve data, update user preferences, and perform system operations. The backend processes these requests, validates data, and returns appropriate responses in JSON format.

## Installation Guide

### Prerequisites
- Node.js v14 or higher (recommended: v18 or v20)
- npm or yarn package manager
- A code editor (e.g., VS Code)
- A database (PostgreSQL, MySQL, or SQLite) for data storage

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/webos.git
   cd webos
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the project root with the following content:
   ```env
   DATABASE_TYPE=postgres
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=your_username
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=webos
   ```
   Adjust the values according to your database configuration.

4. **Set Up the Database**
   - For PostgreSQL: Ensure PostgreSQL is installed and running on your machine
   - For MySQL: Install MySQL and configure the database
   - For SQLite: No separate database server required; files are stored in the project directory

5. **Initialize the Database**
   ```bash
   npx typeorm migration:run
   ```
   This command will execute all pending migrations and create the necessary database schema.

6. **Start the Application**
   ```bash
   npm run dev
   ```
   The application will start on http://localhost:3000.

## Usage Instructions

### Running the Application

After successful installation, you can access the WebOS interface by opening your browser and navigating to http://localhost:3000.

### Interacting with the Interface

- **Dashboard**: View system status, performance metrics, and recent activity
- **File System**: Navigate through directories, create, edit, and delete files
- **Applications**: Launch installed applications with drag-and-drop functionality
- **Settings**: Configure system preferences, user accounts, and notifications
- **Terminal**: Access a command-line interface with history and autocomplete

### API Endpoints

The backend exposes the following RESTful endpoints:
- `GET /api/system/status` - Retrieve system status information
- `POST /api/auth/login` - Authenticate user and return JWT token
- `GET /api/files` - List files in the current directory
- `POST /api/files` - Create a new file
- `PUT /api/files/:id` - Update an existing file
- `DELETE /api/files/:id` - Delete a file

All endpoints return JSON responses with appropriate HTTP status codes.

## Compatibility Notes

### Vuetify 3 Requirements
- Node.js v14 or higher (recommended: v18 or v20)
- TypeScript (required for type safety and better developer experience)
- Vue.js 3 (required for Vuetify 3 integration)

### TypeORM 0.31 Requirements
- Node.js 16, 18, or 20
- TypeScript 5.x or later
- Compatible database drivers (PostgreSQL, MySQL, SQLite, etc.)

### Important Version-Specific Notes
- **TypeORM Breaking Change (0.3.23)**: Empty objects (`{}`) are no longer allowed in `delete()` or `update()` methods. Use `createQueryBuilder()` for bulk operations:
  ```ts
  await repository.createQueryBuilder().delete().execute();
  ```
- **MySQL Security Update**: When using MySQL, TypeORM now connects with `stringifyObjects: true` to avoid a potential security vulnerability in the `mysql2` client. You can revert to the old behavior by setting:
  ```ts
  extra: {
    stringifyObjects: false
  }
  ```
- **SAP HANA**: The deprecated `hdb-pool` is no longer needed. Use the built-in pool from `@sap/hana-client` instead.

### Recommended Development Environment
- Use Node.js v18 or v20 for optimal performance and stability
- Ensure TypeScript is properly configured with `tsconfig.json` to support modern TypeScript features
- Test the application with multiple database drivers to ensure compatibility

Note: The latest TypeORM release is 0.3.27 (as of September 19, 2025), and the version 0.31 mentioned in the task appears to be a reference to an older or potentially outdated version. The current stable version is 0.3.27, which includes the latest security updates and features.

The Vuetify 3 and TypeORM 0.31 combination is viable for the specified use case, with the caveat that TypeORM 0.31 may be an outdated version. The current stable version (0.3.27) provides better compatibility and security features.