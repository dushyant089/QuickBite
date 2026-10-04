\# QuickBite Project Rules



\## 1. Project Structure



QuickBite is a full-stack food delivery application.



\- Frontend: React

\- Backend: Spring Boot

\- Database: MySQL

\- Payment: Razorpay

\- Authentication: JWT + Email OTP + Mobile OTP



\## 2. Frontend Rules



\- Frontend runs on React.

\- API URLs must use the central `src/config.js` configuration.

\- Do not hardcode production backend URLs inside components.

\- Keep reusable UI components where possible.

\- Maintain responsive design for desktop and mobile.

\- Keep the UI professional and production-ready.



\## 3. Backend Rules



\- Backend uses Spring Boot.

\- Java version: 21.

\- Database: MySQL.

\- Backend runs on port 8080 during local development.

\- Avoid unnecessary backend changes when working on frontend UI.

\- API behavior should remain backward compatible unless a change is required.



\## 4. Security Rules



\- Never commit passwords.

\- Never commit API secrets.

\- Never commit JWT secrets.

\- Never commit Razorpay secret keys.

\- Never commit email passwords.

\- Never commit production environment variables.

\- Use environment variables for sensitive configuration.



\## 5. Git Rules



\- Do not commit `node\_modules`.

\- Do not commit Java `target` folders.

\- Do not commit local configuration files containing secrets.

\- Do not commit temporary files.

\- Keep documentation updated when major architecture changes are made.



\## 6. Deployment Rules



Production configuration must use environment variables.



Frontend production API URL should be configured through:



`REACT\_APP\_API\_URL`



Backend production secrets should be configured through deployment environment variables.



\## 7. Development Rule



Before making major changes:



1\. Check the existing implementation.

2\. Avoid breaking working features.

3\. Prefer complete file replacement when a file needs major changes.

4\. Test the application after important changes.

