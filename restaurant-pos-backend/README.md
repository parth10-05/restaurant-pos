# Restaurant POS Backend

This is a backend application for a Restaurant Point of Sale (POS) system built using Node.js, Express, Prisma ORM, and PostgreSQL.

## Features

- Health check route to monitor the status of the application.
- Structured codebase with separation of concerns.
- Utilizes Prisma for database interactions.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- PostgreSQL (version 12 or higher)
- A package manager like npm or yarn

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd restaurant-pos-backend
   ```

2. Install the dependencies:

   ```
   npm install
   ```

3. Set up your environment variables:

   Copy the `.env.example` to `.env` and update the `DATABASE_URL` with your PostgreSQL connection string.

4. Run the Prisma migrations to set up the database:

   ```
   npx prisma migrate dev --name init
   ```

### Running the Application

To start the server, run:

```
npm start
```

The application will be running on `http://localhost:3000`.

### Health Check

You can check the health of the application by navigating to:

```
GET /health
```

### License

This project is licensed under the MIT License. See the LICENSE file for details.