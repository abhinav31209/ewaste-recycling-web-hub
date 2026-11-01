# eWaste Recycling Web Hub (B2C)



## Project Overview

The eWaste Recycling Web Hub is a full-stack role-based platform for managing electronic device recycling workflows.

The system enables device owners to submit old electronic devices, track staff-reviewed outcomes, and continue through the appropriate route after classification. Depending on the result, a device may move into resale guidance, recycling, free data wipe preparation, paid data retrieval, or secure retrieval access.

The platform supports three main roles: OWNER, STAFF, and ADMIN. Owners focus on device submission, result tracking, payment, and retrieval access. Staff users manage operational work such as review queues, hidden drafts, data wipe preparation, and retrieval order fulfilment. Admin users oversee accounts, device records, reports, and platform activity.

The system provides:

- User authentication and registration
- Session-based role access control (OWNER / STAFF / ADMIN)
- Device submission and classification
- Owner device progress tracking
- Staff review, publish, and hidden draft workflow
- Data wipe preparation for recycle devices
- Paid data retrieval request workflow
- Sandbox Stripe and PayPal payment handling
- Secure retrieval token and expiry window management
- Admin account management
- Global device database and audit view
- Operational reports for payments, referrals, device processing, and staff draft activity

The architecture follows a layered RESTful design with Spring Boot, React/Vite, and PostgreSQL. The frontend is structured around action-first workflow pages so that each role can quickly understand the current status of a record and the next available action.

---


## System Roles 

The platform defines the following user roles:

- OWNER — Device owner submitting items and creating orders
- STAFF — Recycling staff handling classification, workflow updates, and order processing
- ADMIN — System administrator managing users and system-level configuration

Access control is implemented using Spring Security.

---

## Project Structure

Main backend package:

`com.team04.ewaste`

Core modules:

- `auth` — Authentication, user management, and security configuration
- `admin` — Administrative operations
- `device` — Core device domain logic and classification
- `owner` — Device owner operations
- `staff` — Workflow management and order processing
- `config` — Security and system configuration

Database layer (schema under refinement)::

- Spring Data JPA repositories
- Entity models mapped using JPA annotations
- Persistent storage for Users, Roles, Devices, Orders, and Workflow Status
- Database configuration defined in `/resources/application.properties`


Additional directories and files:

- `/src` – Backend source code
- `/frontend` – Frontend source code
- `/pom.xml` – Maven configuration
- `/mvnw` and `/mvnw.cmd` – Maven wrapper scripts
- `/API document` – API testing helper file
- `/setup_guide.md` – Set up configuration


---

## Collaboration Rules

- All team members should commit regularly.
- Use GitLab Issues to manage tasks.
- Create feature branches for new development.
- Write clear commit messages.
- Test locally before pushing.
- The `main` branch should remain stable.

---

## Current Progress

- Core backend domain, repository, and service layers implemented
- Role-based REST APIs completed for Owner, Staff, and Admin users
- Owner device submission, result viewing, retrieval request, and payment workflows implemented
- Staff review, hidden draft, data wipe preparation, and order fulfilment workflows implemented
- Admin account management, device audit, and reporting pages implemented
- Secure retrieval token and access window logic implemented
- Frontend UI/UX refined into consistent action-first workflow pages
- API test file updated and project structure cleaned
- Frontend lint/build and backend tests passing

---

## Future Work

- Add live third-party resale and marketplace integrations
- Replace sandbox payments with production payment gateway support
- Implement secure cloud storage and automatic deletion for retrieved data
- Expand reporting with export, filters, and trend charts
- Add stronger automated integration and end-to-end tests
- Improve deployment scripts, accessibility, and responsive behaviour

---