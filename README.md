# Skyline Haven - Backend

Welcome to the **Skyline Haven Backend**, the API that powers the Skyline Haven platform. This backend serves as the core for handling user authentication, rental requests, apartment data, and payment integration.

## Admin Credentials

- **Admin Username**:bappi561@gmail.com
- **Admin Password**: Bappi56

## Live Site URL

- **Live API URL**: [https://skyline-server-nine.vercel.app/]

## Features

1. **User Authentication**: Secure login and registration using JWT tokens for user and admin access.
2. **Apartment Management**: Manage apartment listings, including details like rent, location, and availability.
3. **Rental Request Handling**: Users can submit rental requests for apartments, which are processed and can be accepted or rejected by the admin.
4. **Admin Dashboard API**: Endpoints for admins to view, approve, or reject rental requests from users.
5. **Payment Integration**: Payment handling via Stripe for processing rental payments.
6. **Database Operations**: MongoDB used to store user data, apartment details, and rental requests.
7. **Image Hosting Integration**: Apartments can include images stored via imgbb API.
8. **Secure API**: All sensitive endpoints are protected with proper authentication and authorization using JWT.
9. **Stripe API**: Integration with Stripe for handling payments, including generating payment links and verifying payment status.
10. **Request Logging and Error Handling**: Detailed logging and centralized error handling for easy debugging.
