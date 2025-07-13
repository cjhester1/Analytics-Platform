# Detailed Setup Guide for Developers

This guide provides comprehensive, step-by-step instructions for setting up and running the Analytics Platform project locally. It expands on the `README.md` by offering detailed guidance on prerequisites, database configuration, authentication setup, and common troubleshooting tips.

## Table of Contents

1.  [Prerequisites](#1-prerequisites)
2.  [PostgreSQL Database Setup](#2-postgresql-database-setup)
3.  [Clerk Authentication Setup](#3-clerk-authentication-setup)
4.  [Project Installation and Running](#4-project-installation-and-running)
5.  [Troubleshooting](#5-troubleshooting)

---

## 1. Prerequisites

Before you begin, ensure you have the following software installed on your machine:

- **Docker Desktop:** This includes Docker Engine and Docker Compose, essential for running our containerized application.
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Git:** For cloning the project repository.
  - [Download Git](https://git-scm.com/downloads)

## 2. PostgreSQL Database Setup

The project uses a PostgreSQL database. While Docker Compose will manage the database container, you need to provide credentials.

### Option A: Using Docker Compose's Internal Database (Recommended for Local Development)

Docker Compose will automatically create a PostgreSQL container. You just need to define the environment variables it will use.

1.  **Create a `.env` file** in the **root directory** of your project (where `docker-compose.yml` is located).
2.  Add the following lines to this `.env` file, replacing the placeholder values with your desired credentials. For local development, these can be simple, but for any shared environment, use strong, unique passwords.

    ```dotenv
    POSTGRES_USER=your_db_username
    POSTGRES_PASSWORD=your_db_password
    POSTGRES_DB=your_db_name
    ```

    _Example:_

    ```dotenv
    POSTGRES_USER=analytics_user
    POSTGRES_PASSWORD=supersecret
    POSTGRES_DB=analytics_db
    ```

    _Note: The `POSTGRES_DB` value should match the database name expected by the backend service, which is `lac_fullstack_dev` by default in `backend/main.py` and `backend/transfer_data.py`'s `DATABASE_URL`._

### Option B: Using an Existing PostgreSQL Instance (Advanced)

If you prefer to use an already running PostgreSQL instance (e.g., on your local machine directly, or a cloud service), you will need to:

1.  **Create a new database** and a dedicated user for this project within your PostgreSQL instance.
2.  **Obtain the connection details:** Host, Port, Database Name, Username, and Password.
3.  **Modify the `DATABASE_URL`** in your `docker-compose.yml` file under the `backend` service to point to your external database.
    - Find the line: `DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`
    - Change `db:5432` to your external database's host and port (e.g., `localhost:5432` or `your.cloud.db.com:5432`).
    - Ensure the `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` environment variables (from your `.env` file) match the credentials of your external database.

## 3. Clerk Authentication Setup

The frontend uses [Clerk.dev](https://clerk.dev/) for user authentication and management. You will need to create a Clerk account and set up an application to obtain the necessary API keys.

1.  **Sign Up for Clerk.dev:**
    - Go to [https://clerk.dev/](https://clerk.dev/) and sign up for a free account.
2.  **Create a New Application:**
    - Once logged in, follow the prompts to create a new application. You can choose a "Next.js" template if available, or a "Custom" application.
    - Give your application a meaningful name (e.g., "Analytics Platform Auth").
3.  **Obtain API Keys:**
    - After creating your application, navigate to its dashboard.
    - Look for your **Publishable Key** (starts with `pk_test_...`) and your **Secret Key** (starts with `sk_test_...`).
4.  **Configure Frontend Environment Variables:**
    - In the **root directory** of your project, navigate into the `frontend/` folder.
    - You will find a file named `.env.example`. Copy this file to create `.env.local`:
      ```bash
      cp frontend/.env.example frontend/.env.local
      ```
    - Open `frontend/.env.local` and populate it with your Clerk API keys and the backend URL:
      ```dotenv
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
      CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
      NEXT_PUBLIC_API_URL=http://localhost:8000
      ```
    - Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` and `sk_test_YOUR_SECRET_KEY_HERE` with the actual keys you obtained from your Clerk.dev dashboard.

## 4. Project Installation and Running

Once you have configured your database and Clerk credentials, you can build and run the project.

1.  **Clone the Repository:**
    If you haven't already, clone the project repository:
    ```bash
    git clone git@github.com:cjhester1/Analytics-Platform.git # Or your HTTPS URL
    cd Analytics-Platform
    ```
2.  **Build and Run Docker Containers:**
    Execute the following command in the **root directory** of your project:

    ```bash
    docker-compose up --build
    ```

    This command will:

    - **Build** the Docker images for the frontend and backend services based on their respective Dockerfiles.
    - **Start** the PostgreSQL database, backend API, and frontend application.
    - **Crucially, during the backend startup (via `transfer_data.py`):**
      - It will automatically drop existing database tables (if any).
      - It will create new tables and load initial data from the JSON files located in `backend/dev_test_data/`.
      - It will create all necessary SQL functions in the PostgreSQL database from the `sql-files/` directory.
    - _Note: The initial build and database setup might take a few minutes._

3.  **Access the Application:**
    Once all services are up and running (you'll see logs indicating the backend and frontend are listening), open your web browser and navigate to:
    ```
    http://localhost:3000
    ```
    You can also access the **backend API documentation** (Swagger UI) at:
    ```
    http://localhost:8000/docs
    ```

## 5. Troubleshooting

If you encounter any issues during setup or while running the application, here are some common troubleshooting steps:

- **Check Docker Desktop Status:** Ensure Docker Desktop is running on your machine.
- **Port Conflicts:** Make sure ports `3000` (frontend), `8000` (backend), and `5434` (database, as exposed by `docker-compose.yml`) are not already in use by other applications on your machine.
  - You can check port usage (e.g., `lsof -i :3000` on macOS/Linux, or `netstat -ano | findstr :3000` on Windows).
- **Review Docker Logs:** Check the logs for each service to identify errors:
  ```bash
  docker-compose logs backend
  docker-compose logs frontend
  docker-compose logs db
  ```
- **Detailed Database Initialization Logs:** For specific issues during database setup, check the `startup_log.txt` file generated inside the backend container:
  ```bash
  docker-compose exec backend cat /app/startup_log.txt
  ```
- **Environment Variable Issues:**
  - Double-check that your `.env` and `.env.local` files are correctly named and located.
  - Ensure there are no typos in your keys or values.
  - Remember that Docker Compose automatically picks up `.env` files in the same directory as `docker-compose.yml`.
- **Rebuild Containers:** If you make changes to Dockerfiles or encounter persistent issues, try rebuilding the containers:
  ```bash
  docker-compose up --build --force-recreate
  ```
  This ensures fresh images and containers are created.
