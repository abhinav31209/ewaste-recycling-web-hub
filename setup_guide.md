# Setup Guide

This appendix describes the local development setup needed to run eWaste Hub.

## System Overview

eWaste Hub is a full stack web application built with:

- Spring Boot for the backend
- React and Vite for the frontend
- PostgreSQL for persistent data storage

## Software Requirements

To run the project locally, the following software is required:

- Java 17
- Node.js, recommended version 18 or above
- npm
- PostgreSQL
- Git
- An IDE such as IntelliJ IDEA or Visual Studio Code
- Optional: pgAdmin 4 for database inspection and manual SQL updates

## Project Structure

The repository is organised into backend and frontend sections:

```text
projectmain/
+   src/                 backend source code
+   frontend/            frontend source code
+   pom.xml              Maven configuration
+   mvnw / mvnw.cmd      Maven wrapper
+   api test.http        API testing helper file
```

## Clone the Repository

Clone the project from GitLab and enter the project directory:

```text
git clone <repository url>
cd projectmain
```

If working on a specific branch, switch to that branch:

```text
git checkout <branch name>
```

## Database Setup

Create a PostgreSQL database named `ewaste`. The backend is configured to use the following local database connection:

- Host: `localhost`
- Port: `5433`
- Database: `ewaste`
- Username: `postgres`
- Password: `12345`

Example SQL command:

```sql
CREATE DATABASE ewaste;
```

## Backend Configuration

The backend configuration is stored in `src/main/resources/application.properties`. The current project configuration is:

```properties
spring.application.name=ewaste
spring.datasource.url=jdbc:postgresql://localhost:5433/ewaste
spring.datasource.username=postgres
spring.datasource.password=12345
spring.datasource.driver-class-name=org.postgresql.Driver
spring.flyway.enabled=false
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Flyway is currently disabled and Hibernate is set to `update`. This means the application can create or update some schema automatically, but workflow related fields or constraints may still need manual SQL updates if the local database was created from an older version of the project.

## Database Migration Files

The project includes migration files in `src/main/resources/db/migration`. Current migration files include:

- `V1__init.sql`
- `V2__create_qr_access_tokens.sql`
- `V3__add_follow_up_fields.sql`
- `V4__payment_enhancements.sql`
- `V5_email_notification.sql`
- `V6__create_referral_fees.sql`
- `V7__create_data_erasure_records.sql`
- `V8__expand_device_types.sql`
- `V9__align_order_enum_constraints.sql`
- `V10__drop_legacy_offered_devices_fk_from_orders.sql`
- `V11__retrieval_workflow_alignment.sql`

Because Flyway is disabled, these SQL files do not run automatically on startup. If the local database is out of date, schema changes may need to be applied manually through pgAdmin.

## Run the Backend

From the project root, start the backend with:

```text
.\mvnw.cmd spring-boot:run
```

To verify compilation only, run:

```text
.\mvnw.cmd -DskipTests compile
```

The backend runs on:

```text
http://localhost:8080
```

## Run the Frontend

Open a second terminal and run:

```text
cd frontend
npm install
npm run dev
```

The frontend runs on the default Vite development port:

```text
http://localhost:5173
```

## Recommended Startup Order

For a clean local setup, use the following order:

1. Start PostgreSQL.
2. Confirm that the `ewaste` database exists on port `5433`.
3. Start the backend on port `8080`.
4. Start the frontend on port `5173`.
5. Log in using one of the seeded test accounts listed in Appendix A.

## Troubleshooting

If the backend returns database related errors, check that PostgreSQL is running on port `5433`, the database name is `ewaste`, the username and password are correct, and the schema fields and constraints are up to date.

If the frontend shows a blank page or API failure, check that the backend is running on `localhost:8080`, the frontend is running on `localhost:5173`, the browser console does not show React runtime errors, and the backend returns valid JSON data.

If workflow behaviour is inconsistent after pulling new code, the local schema may not fully match the newest backend code because Flyway is disabled. In this case, the database may need manual updates in pgAdmin.

If the payment flow does not progress, check the retrieval order status, payment status, and whether staff fulfilment is being attempted before payment succeeds.

## Setup Summary

To run eWaste Hub locally, the team must create and configure the PostgreSQL database, start the Spring Boot backend on port `8080`, start the React frontend on port `5173`, and then log in using a seeded test account.
