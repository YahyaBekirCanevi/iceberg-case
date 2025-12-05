# Design Document - Estate Agency Transaction System

## 1. Module Organization

The application is structured into the following modules to ensure separation of concerns and scalability:

- **AppModule**: The root module that orchestrates the application.
- **AuthModule**: Handles authentication and authorization (JWT, Login).
  - `AuthController`: Manages login endpoints.
  - `AuthService`: Handles password validation and token generation.
- **TransactionsModule**: Handles the core business logic for transaction lifecycle management.
  - `TransactionsController`: Exposes RESTful endpoints for transaction operations.
  - `TransactionsService`: Contains business logic for state transitions and data persistence.
  - `TransactionSchema`: Defines the MongoDB data model.
- **AgentsModule**: Manages agent data (listing and selling agents).
  - `AgentsController`: Manages agent operations.
  - `AgentsService`: Handles agent logic.
  - `AgentSchema`: Defines agent data model.
- **SharedModule**: Encapsulates shared resources used across the application to avoid circular dependencies and promote reusability.
  - `types.ts`: Shared enums and interfaces (e.g., `TransactionStatus`, `AgentRole`).
  - `filters`: Global exception filters (e.g., `AllExceptionsFilter`).

## 2. Database Schema Design

### Transaction Collection

The `Transaction` document is the central entity. It references `Agent` documents for `listingAgent` and `sellingAgent`.

- **Fields**:
  - `_id`: ObjectId
  - `propertyAddress`: String
  - `contractPrice`: Number
  - `totalServiceFee`: Number
  - `status`: Enum (`AGREEMENT`, `EARNEST_MONEY`, `TITLE_DEED`, `COMPLETED`)
  - `listingAgent`: ObjectId (Ref: Agent)
  - `sellingAgent`: ObjectId (Ref: Agent)
  - `financialBreakdown`: Embedded Document (Optional, present only when status is `COMPLETED`)
  - `createdAt`: Date
  - `updatedAt`: Date

### Financial Breakdown (Embedded)

We chose the **embedded approach** for financial breakdown storage because:

1.  **Read Performance**: Financial data is always accessed in the context of a completed transaction. Embedding avoids an extra database lookup.
2.  **Immutability**: Once a transaction is completed, the financial breakdown is a historical record and shouldn't change. Embedding it effectively "snapshots" the calculation.
3.  **Simplicity**: Reduces complexity in managing separate collections and relations.

- **Fields**:
  - `agencyAmount`: Number (50% of totalServiceFee)
  - `agentPoolAmount`: Number (50% of totalServiceFee)
  - `agentDistributions`: Array of objects
    - `agentId`: ObjectId
    - `agentName`: String (Snapshot)
    - `role`: Enum (`LISTING`, `SELLING`)
    - `amount`: Number

## 3. Business Logic Implementation Choices

### Stage Transition Policy

- Transitions are strictly linear: `AGREEMENT` -> `EARNEST_MONEY` -> `TITLE_DEED` -> `COMPLETED`.
- The system prevents skipping stages or moving backwards (unless specifically allowed, but for this PRD we enforce forward progress).
- Validation logic resides in `TransactionsService.updateStatus`.

### Commission Calculation

- Triggered automatically when the status transitions to `COMPLETED`.
- **Rules**:
  - **Agency**: Takes 50% of `totalServiceFee`.
  - **Agents**: The remaining 50% is the "Agent Pool".
    - If `listingAgent` == `sellingAgent`: They get 100% of the Agent Pool.
    - If `listingAgent` != `sellingAgent`: They split the Agent Pool 50/50 (25% of total fee each).

## 4. API Design

### Endpoints

#### Auth & Agents

- `POST /agents`: Create a new agent (Sign Up).
- `POST /auth/login`: Login and retrieve JWT token.

#### Transactions

- `POST /transactions`: Create a new transaction (starts at `AGREEMENT`).
- `GET /transactions`: List all transactions.
- `GET /transactions/:id`: Get details of a specific transaction.
- `PATCH /transactions/:id/status`: Advance the stage of a transaction.
  - Body: `{ status: 'NEXT_STAGE' }`
- `GET /transactions/:id/financials`: Retrieve the financial breakdown (only if completed).
- `GET /transactions/:id/history`: Retrieve the history of status changes for a transaction.

## 5. Testing Strategy

We employ a comprehensive testing strategy covering both unit logic and end-to-end flows.

### Unit Tests

Located in `src/**/*.spec.ts`. These tests focus on isolated business logic within services.

- **TransactionsService** (`src/transactions/transactions.service.spec.ts`):
  - Verifies commission calculation rules (50% Agency, 50% Agent Pool).
  - Validates split scenarios: Same agent (100% of pool) vs. Different agents (50/50 split).
  - Enforces strict stage transitions (`AGREEMENT` -> `EARNEST_MONEY` -> `TITLE_DEED` -> `COMPLETED`).
  - Ensures invalid transitions (skipping stages, moving backward) are rejected.

- **AgentsService** (`src/agents/agents.service.spec.ts`):
  - Verifies agent creation and retrieval logic.
  - Ensures password hashing and validation.

### End-to-End (E2E) Tests

Located in `test/*.e2e-spec.ts`. These tests spin up the full NestJS application with a test database to verify the entire flow from HTTP request to database persistence.

- **Transactions Flow** (`test/transactions.e2e-spec.ts`):
  - Tests the full lifecycle of a transaction via API.
  - Creates a transaction -> Updates status step-by-step -> Verifies `COMPLETED` state and financial breakdown in the response.

- **Agents & Auth** (`test/agents-auth.e2e-spec.ts`, `test/agents.e2e-spec.ts`):
  - Verifies Agent Registration (Sign Up).
  - Verifies Login flow and JWT token generation.
  - Tests protected routes using the generated token.
  - Verifies Agent CRUD operations.

- **App** (`test/app.e2e-spec.ts`):
  - Basic health check and application bootstrap verification.

## 6. Most Challenging / Riskiest Part

### Challenge: Financial Breakdown Immutability vs. Data Integrity

The most critical design decision was how to store the financial breakdown.

- **Risk**: Calculating commissions dynamically every time (on read) risks inconsistency if agent details (e.g., commission rates, roles) change in the future.
- **Mitigation**: We chose the **Snapshot Pattern**.
  - When a transaction is `COMPLETED`, we calculate the financials _once_ and store them as an embedded document within the transaction.
  - This ensures that historical financial records remain accurate even if business rules or agent details change later.
  - We also store the `agentName` at the time of the transaction to preserve the historical context.

## 7. What to Improve in the Future

### 1. Audit Logging

- **Why**: In financial systems, "who changed what and when" is crucial.
- **Next Step**: Implement a dedicated `AuditLog` collection that tracks every state change, user action, and sensitive data modification.

### 2. Role-Based Access Control (RBAC)

- **Why**: Currently, the system likely allows broad access. In reality, only admins should be able to approve `COMPLETED` status or view sensitive financial breakdowns.
- **Next Step**: Implement Guards and Decorators (e.g., `@Roles('ADMIN')`) to restrict sensitive endpoints.

### 3. Reporting & Analytics Module

- **Why**: The current system stores data but doesn't aggregate it.
- **Next Step**: Create a separate module for generating monthly reports, agent performance metrics, and agency revenue dashboards using MongoDB Aggregation Framework.

### 4. Notification System

- **Why**: Stakeholders need to know when a transaction moves to the next stage.
- **Next Step**: Integrate an event emitter system (e.g., `EventEmitter2`) to send emails or push notifications on status changes.

### 5. Pagination & Filtering

- **Why**: As the number of transactions grows, fetching all of them (`GET /transactions`) will become slow and inefficient.
- **Next Step**: Implement pagination (limit/offset or cursor-based) and filtering (by status, date range, agent) for list endpoints.

### 6. Rate Limiting & Security

- **Why**: To protect the API from abuse and denial-of-service attacks.
- **Next Step**: Implement `ThrottlerModule` to limit the number of requests per IP/User.

### 7. CI/CD Pipeline

- **Why**: To ensure code quality and automate deployments.
- **Next Step**: Set up GitHub Actions or GitLab CI to run tests automatically on PRs and deploy to staging/production on merge.
