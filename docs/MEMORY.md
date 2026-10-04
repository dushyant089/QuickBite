\# QuickBite Project Memory



\## Project



QuickBite is a full-stack food delivery application built for professional portfolio and freelance showcase purposes.



\## Current Technology



\### Frontend



\- React

\- Tailwind CSS

\- React Router

\- REST API integration



\### Backend



\- Spring Boot 3.3.4

\- Java 21

\- Spring Security

\- JWT

\- MySQL

\- Maven



\### Payment



\- Razorpay integration

\- Test payment flow implemented and tested locally



\### Authentication



Authentication supports:



\- CUSTOMER

\- RESTAURANT\_OWNER

\- ADMIN



OTP-based verification is planned/supported for email and mobile authentication.



\## Completed Features



\- Home page

\- Navbar

\- Mobile navigation

\- Restaurant listing

\- Restaurant menu

\- Cart

\- Quantity management

\- Order placement

\- Order success page

\- Order tracking

\- Razorpay test payment

\- Customer authentication

\- Restaurant owner dashboard

\- Admin dashboard

\- Admin restaurant management

\- Admin menu management

\- Admin order management

\- Premium dark UI improvements



\## Important Local Paths



Frontend:



`C:\\Desktop\\QuickBite\\quickbite-frontend`



Backend:



`C:\\Desktop\\QuickBite\\quickbite-backend\\demo`



\## Local Development



Frontend:



`http://localhost:3000`



Backend:



`http://localhost:8080`



API base path:



`/api`



\## API Configuration



Frontend API configuration is centralized in:



`src/config.js`



Production API URL is controlled through:



`REACT\_APP\_API\_URL`



\## Security



Sensitive values must be supplied through environment variables.



Do not commit:



\- Database passwords

\- JWT secrets

\- Razorpay secrets

\- Gmail passwords

\- Admin passwords

\- `.env` files

\- Local application configuration containing secrets



\## Deployment Plan



Planned deployment architecture:



\- GitHub for source code

\- Railway for Spring Boot backend

\- Railway/MySQL for production database

\- Vercel for React frontend



\## Development Preference



Backend should not be modified unnecessarily while polishing or fixing the frontend.



When a frontend file requires a major update, prefer providing the complete replacement file.

