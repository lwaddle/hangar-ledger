# Hangar Ledger — Application Specification

## 1. Overview

**Hangar Ledger** is a private, internal web application for tracking flight department expenses, fuel usage, and trip-level costs. It is designed to be simple, auditable, and tailored to a single organization operating one or more aircraft under Part 91.

The application is not intended to replace flight scheduling software. Instead, it complements scheduling tools by providing a clean, reliable ledger focused on operational costs and reporting.

---

## 2. Goals

- Track expenses associated with aircraft operations
- Associate expenses with specific trips
- Track fuel usage in both **cost** and **gallons**
- Upload and retain receipt images for expenses
- Generate simple, useful reports for owners and accountants
- Remain lightweight, understandable, and maintainable

---

## 3. Non-Goals (Important)

Hangar Ledger explicitly does **not** aim to:

- Perform full double-entry accounting
- Replace bookkeeping software (e.g., QuickBooks)
- Handle payroll, invoicing, or billing
- Perform flight scheduling or dispatch
- Act as a public or multi-tenant SaaS (at least initially)

---

## 4. Target Users

All users belong to a **single organization**.

Possible roles (not necessarily enforced in v1):
- Administrator (full access)
- Operator (can create/edit expenses and trips)
- Viewer (read-only access)

The app assumes a **small, trusted user group**.

---

## 5. Core Concepts

### 5.1 Trip
A trip represents a sequence of flights over a defined time period.

A trip may include:
- One or more legs
- One or more associated expenses
- Fuel purchases
- Notes or context

Trips exist primarily to **group costs**.

---

### 5.2 Expense
An expense represents a single financial transaction related to aircraft operations.

Examples:
- Fuel
- Maintenance
- Hangar
- Catering
- Charts & subscriptions
- Training
- Fees (landing, handling, customs, etc.)

Expenses may:
- Be linked to a trip
- Exist without a trip (e.g., monthly hangar rent)
- Have one or more receipt images attached

---

### 5.3 Fuel Entry
Fuel is treated as a special type of expense with additional structured data.

Fuel-specific attributes:
- Gallons purchased
- Total cost
- Calculated cost per gallon
- Date and location (optional)
- Aircraft (future-friendly)

Fuel data should be reportable independently of other expenses.

---

### 5.4 Receipt
A receipt is an uploaded image associated with an expense.

Receipts:
- Are optional but encouraged
- Are stored privately
- May include metadata (upload date, uploader, original filename)

---

## 6. Functional Requirements

### 6.1 Authentication
- Users must authenticate to access the app
- Authentication may be delegated to a managed auth provider
- No public or anonymous access

---

### 6.2 Trip Management
Users must be able to:
- Create a trip
- Edit trip details
- View a list of trips
- View all expenses associated with a trip
- Delete or archive a trip (soft delete preferred)

Minimum trip fields:
- Name or identifier
- Start date
- End date
- Notes (optional)

---

### 6.3 Expense Management
Users must be able to:
- Create an expense
- Edit an expense
- Assign an expense to a trip (optional)
- Categorize an expense
- View expenses by trip, category, or date
- Delete or archive expenses

Minimum expense fields:
- Date
- Vendor / payee
- Amount
- Category
- Payment method (optional)
- Notes (optional)

---

### 6.4 Fuel Tracking
Users must be able to:
- Record fuel purchases
- Enter gallons and total cost
- View calculated cost per gallon
- Associate fuel with a trip (optional)

Fuel must be reportable by:
- Trip
- Month
- Total gallons
- Total cost
- Average cost per gallon

---

### 6.5 Receipt Uploads
Users must be able to:
- Upload receipt images to an expense
- View receipts associated with an expense
- Download or view receipt images securely

Constraints:
- Receipts are private
- File size limits should be enforced
- Filenames should be system-generated

---

## 7. Reporting & Views

Initial reports (v1):
- Trip total cost
- Monthly spend by category
- Fuel summary (gallons, cost, $/gal)
- Expenses without trips (cleanup report)

Reports should be:
- Viewable in the UI
- Exportable as CSV (optional but preferred)

---

## 8. Data Integrity & Safety

- Deleting trips or expenses should not silently destroy data
- Soft deletes are preferred over hard deletes
- Uploaded receipts should not be publicly accessible
- All financial data should be auditable

---

## 9. UX Principles

- Clean, low-friction UI
- Favor clarity over density
- Default views should answer: “What did this trip cost?”
- Avoid unnecessary form complexity
- Mobile-friendly, but desktop-first

---

## 10. Future Considerations (Out of Scope for v1)

- Multiple organizations
- Multiple aircraft
- Role-based permissions
- Integration with scheduling tools
- Import from CSV or third-party systems
- Tax or accounting system integrations

---

## 11. Technical Constraints (Intentionally Loose)

- Web-based application
- Uses a relational database
- Supports secure file uploads
- Designed for small team usage
- Low operational overhead

Specific frameworks, libraries, and services are intentionally unspecified.

---

## 12. Success Criteria

Hangar Ledger is successful if:
- It replaces the accounting features previously used in third-party scheduling software
- Fuel usage can be tracked accurately alongside cost
- Reports are trusted by operators and owners
- The system remains easy to understand 6–12 months later
