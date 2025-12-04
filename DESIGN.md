# Design Document - Estate Agency Transaction System

## 1. Module Organization

The application is structured into the following modules to ensure separation of concerns and scalability:

- **AppModule**: The root module that orchestrates the application.
- **TransactionsModule**: Handles the core business logic for transaction lifecycle management.
  - `TransactionsController`: Exposes RESTful endpoints for transaction operations.
  - `TransactionsService`: Contains business logic for state transitions and data persistence.
  - `TransactionSchema`: Defines the MongoDB data model.
- **AgentsModule**: Manages agent data (listing and selling agents).
  - `AgentsController`: Manages agent operations.
  - `AgentsService`: Handles agent logic.
  - `AgentSchema`: Defines agent data model.
- **SharedModule** (Optional/Implicit): Common types and utilities (e.g., `TransactionStatus`, `AgentRole`).

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

- `POST /transactions`: Create a new transaction (starts at `AGREEMENT`).
- `GET /transactions`: List all transactions.
- `GET /transactions/:id`: Get details of a specific transaction.
- `PATCH /transactions/:id/status`: Advance the stage of a transaction.
  - Body: `{ status: 'NEXT_STAGE' }`
- `GET /transactions/:id/financials`: Retrieve the financial breakdown (only if completed).

## 5. Testing Strategy

- **Unit Tests**: Focus on `TransactionsService`.
  - Verify commission calculation logic for both scenarios (same agent vs different agents).
  - Verify stage transition enforcement.
- **Integration Tests**: Focus on `TransactionsController` and Database.
  - Verify API endpoints work as expected.
  - Verify data is correctly saved to MongoDB.
