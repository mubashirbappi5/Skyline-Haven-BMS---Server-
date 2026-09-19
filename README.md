# Skyline Haven - Backend

Welcome to the **Skyline Haven Backend**, the API that powers the Skyline Haven platform. This backend serves as the core for handling user authentication, rental requests, apartment data, and payment integration.

## Admin & Demo Credentials

- **Admin email:** `admin@demo.com` / **Password:** `password123`
- **Member email:** `member@demo.com` / **Password:** `password123`

## Live Site URL

- **Live API URL**: [https://skyline-haven-server.vercel.app/](https://skyline-haven-server.vercel.app/)

## Features

1. **User Authentication**: Secure login and registration using JWT tokens for user and admin access.
2. **Apartment Management**: Fetch apartment listings, including details like rent, location, and availability.
3. **Rental Request Handling**: Users can submit rental requests for apartments, which are processed and can be accepted or rejected by the admin.
4. **Admin Dashboard API**: Endpoints for admins to view, approve, or reject rental requests from users.
5. **Payment Integration**: Payment handling via Stripe for processing rental payments.
6. **Database Operations**: Prisma ORM with Neon Serverless Postgres used to store user data, apartment details, and rental requests.
7. **Secure API**: All sensitive endpoints are protected with proper authentication and authorization using JWT middlewares.
8. **Stripe API**: Integration with Stripe for handling payments, including generating payment intents.
9. **Global Error Handling**: Centralized error handling using `express-async-errors` to gracefully handle promise rejections and timeouts.
10. **Automated Deployments**: Automated deployment scripts configuration for serverless deployment on Vercel.

## Technologies Used

- **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
- **Prisma ORM**: Next-generation Node.js and TypeScript ORM for Neon Postgres.
- **Neon Postgres**: Serverless Postgres database.
- **JSON Web Token (JWT)**: For securing routes and verifying user roles.
- **Stripe**: For secure payment processing.
- **Bcryptjs**: For password hashing.
- **Vercel**: Serverless backend hosting.

## Setup Instructions

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Setup `.env` file with `DATABASE_URL` (Neon Postgres), `JwT_Token`, `STRIPE_SECRET_KEY`, and `GOOGLE_CLIENT_ID`.
4. Run `npx prisma db push` to sync the database schema.
5. Run `node index.js` to start the local development server.

## Deployment

This backend is configured for **Vercel Serverless Functions**. Use the included `deploy.js` script to automate Vercel environment variable injection and deployment.
