# LA Clippers Full-Stack Data Application

This project is a full-stack application designed to ingest, analyze, and visualize basketball data. The application features a Python-based backend with FastAPI, a Next.js frontend, and a PostgreSQL database, all containerized with Docker.

## Features

- **Data Ingestion & Processing**: Scripts to ingest JSON data into a PostgreSQL database.
- **Containerized Environment**: Fully containerized with Docker and Docker Compose for easy setup and deployment.
- **RESTful API**: A backend built with Python and FastAPI to serve the basketball data.
- **Interactive Frontend**: A responsive frontend built with Next.js and Tailwind CSS to visualize the data.
- **In-depth SQL Analysis**: A suite of complex SQL queries to analyze:
  - Team win-loss records
  - Rankings by total, home, and away games
  - Back-to-back game schedules
  - Player stints (continuous time on court)
- **Role-Based Access Control**: The frontend features two user roles (Admin and Regular) with different permissions for viewing data visualizations.

## Technologies Used

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: PostgreSQL
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose must be installed on your machine.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd Christopher_Hester
    ```

2.  **Set up environment variables:**
    Create a `.env.local` file inside the `frontend` directory. You can copy the example file:

    ```bash
    cp frontend/.env.example frontend/.env.local
    ```

    The default configuration should work with the `docker-compose` setup.

3.  **Build and run the containers:**

    ```bash
    docker-compose up --build
    ```

4.  **Access the application:**
    - The **frontend** will be available at [http://localhost:3000](http://localhost:3000).
    - The **backend API** documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

## Project Structure

```
.
├── backend/         # Python FastAPI backend
├── frontend/        # Next.js frontend
├── sql-files/       # Contains all SQL queries
├── dev_test_data/   # Sample JSON data
├── docker-compose.yml # Docker orchestration file
└── README.md
```
