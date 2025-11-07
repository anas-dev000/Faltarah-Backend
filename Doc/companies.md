# 📋 Companies Module - Complete Documentation

## 📑 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Authentication & Authorization](#authentication--authorization)
5. [Service Layer](#service-layer)
6. [Repository Layer](#repository-layer)
7. [Validation Schema](#validation-schema)
8. [Error Handling](#error-handling)
9. [Usage Examples](#usage-examples)

---

## 🎯 Overview

### Purpose

The Companies Module manages company entities in a multi-tenant system. It provides complete CRUD operations with role-based access control, ensuring data isolation between companies while allowing developers full system access.

### Key Features

- ✅ Multi-company support with data isolation
- ✅ Role-based access control (Developer, Manager, Employee)
- ✅ Subscription management
- ✅ Company statistics and relationships
- ✅ Comprehensive validation
- ✅ Safe deletion with relation checks

### Technology Stack

- **Framework**: Fastify (Node.js)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT-based
- **Validation**: Custom schema validator

---

## 🗄️ Database Schema

### Company Model

```prisma
model Company {
  id                     Int       @id @default(autoincrement())
  name                   String    @unique @db.VarChar(255)
  logo                   String?   @db.VarChar(500)
  address                String?   @db.Text
  email                  String?   @db.VarChar(255)
  phone                  String?   @db.VarChar(15)
  subscriptionExpiryDate DateTime? @db.Timestamp(6)
  createdAt              DateTime  @default(now()) @db.Timestamp(6)

  // Relations
  users              User[]
  customers          Customer[]
  employees          Employee[]
  suppliers          Supplier[]
  products           Product[]
  accessories        Accessory[]
  services           Service[]
  maintenances       Maintenance[]
  invoices           Invoice[]
  invoiceItems       InvoiceItem[]
}
```

### Field Descriptions

| Field                    | Type     | Required | Description                       |
| ------------------------ | -------- | -------- | --------------------------------- |
| `id`                     | Integer  | Auto     | Primary key (auto-increment)      |
| `name`                   | String   | Yes      | Unique company name (3-255 chars) |
| `logo`                   | String   | No       | Company logo URL (max 500 chars)  |
| `address`                | String   | No       | Company address                   |
| `email`                  | String   | No       | Company email (validated format)  |
| `phone`                  | String   | No       | Company phone (10-15 digits)      |
| `subscriptionExpiryDate` | DateTime | No       | Subscription end date             |
| `createdAt`              | DateTime | Auto     | Record creation timestamp         |

### Relationships

- **Users**: Employees and managers of the company
- **Customers**: Company's customer base
- **Employees**: Sales reps and technicians
- **Suppliers**: Product and accessory suppliers
- **Products**: Company's product catalog
- **Accessories**: Available accessories
- **Services**: Offered services
- **Maintenances**: Maintenance records
- **Invoices**: Sales invoices
- **InvoiceItems**: Invoice line items

---

## 🔌 API Endpoints

### Base URL

```
/api/companies
```

### 1. Get All Companies

**Endpoint**: `GET /`

**Description**: Retrieve all companies based on user role

**Authentication**: Required

**Authorization**: All authenticated users

**Response Structure**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "شركة الندى للفلاتر",
      "logo": "https://example.com/logo.png",
      "address": "القاهرة، مدينة نصر",
      "email": "info@alnada.com",
      "phone": "01012345678",
      "subscriptionExpiryDate": "2025-12-31T00:00:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "_count": {
        "users": 5,
        "customers": 120,
        "invoices": 450
      }
    }
  ],
  "count": 1
}
```

**Access Rules**:

- **Developer**: Sees all companies
- **Manager/Employee**: Sees only their company

---

### 2. Get Company by ID

**Endpoint**: `GET /:id`

**Description**: Retrieve specific company details

**Authentication**: Required

**Authorization**: All authenticated users

**Parameters**:

- `id` (path): Company ID (integer)

**Response Structure**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "شركة الندى للفلاتر",
    "logo": "https://example.com/logo.png",
    "address": "القاهرة، مدينة نصر",
    "email": "info@alnada.com",
    "phone": "01012345678",
    "subscriptionExpiryDate": "2025-12-31T00:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "_count": {
      "users": 5,
      "customers": 120,
      "employees": 15,
      "suppliers": 8,
      "products": 25,
      "accessories": 40,
      "services": 6,
      "maintenances": 200,
      "invoices": 450
    }
  }
}
```

**Access Rules**:

- **Developer**: Can access any company
- **Manager/Employee**: Can only access their own company

**Error Responses**:

```json
{
  "success": false,
  "error": "Company not found or access denied",
  "statusCode": 404
}
```

---

### 3. Create Company

**Endpoint**: `POST /`

**Description**: Create a new company

**Authentication**: Required

**Authorization**: Developer only

**Request Body**:

```json
{
  "name": "شركة النيل للتكييفات",
  "logo": "https://example.com/logos/nile.png",
  "address": "الجيزة، المهندسين، شارع جامعة الدول",
  "email": "contact@nile-ac.com",
  "phone": "01098765432",
  "subscriptionExpiryDate": "2026-06-30"
}
```

**Response Structure**:

```json
{
  "success": true,
  "message": "Company created successfully",
  "data": {
    "id": 2,
    "name": "شركة النيل للتكييفات",
    "logo": "https://example.com/logos/nile.png",
    "address": "الجيزة، المهندسين، شارع جامعة الدول",
    "email": "contact@nile-ac.com",
    "phone": "01098765432",
    "subscriptionExpiryDate": "2026-06-30T00:00:00.000Z",
    "createdAt": "2024-11-07T12:00:00.000Z"
  }
}
```

**Validation Rules**:

- `name`: Required, 3-255 characters, must be unique
- `logo`: Optional, max 500 characters
- `address`: Optional, string
- `email`: Optional, valid email format
- `phone`: Optional, 10-15 digits
- `subscriptionExpiryDate`: Optional, valid date

**Error Responses**:

```json
{
  "success": false,
  "error": "Company name already exists",
  "statusCode": 409
}
```

---

### 4. Update Company

**Endpoint**: `PUT /:id`

**Description**: Update existing company information

**Authentication**: Required

**Authorization**: Manager (own company) or Developer (any company)

**Parameters**:

- `id` (path): Company ID (integer)

**Request Body** (all fields optional):

```json
{
  "name": "شركة الندى للفلاتر والتكييفات",
  "logo": "https://example.com/logos/new-logo.png",
  "address": "القاهرة، مدينة نصر، الحي الثامن",
  "email": "info@alnada-updated.com",
  "phone": "01012345679"
}
```

**Response Structure**:

```json
{
  "success": true,
  "message": "Company updated successfully",
  "data": {
    "id": 1,
    "name": "شركة الندى للفلاتر والتكييفات",
    "logo": "https://example.com/logos/new-logo.png",
    "address": "القاهرة، مدينة نصر، الحي الثامن",
    "email": "info@alnada-updated.com",
    "phone": "01012345679",
    "subscriptionExpiryDate": "2025-12-31T00:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
```

**Access Rules**:

- **Developer**: Can update any company
- **Manager**: Can only update their own company (cannot update subscription date)
- **Employee**: Cannot update companies

**Restrictions**:

- Manager cannot update `subscriptionExpiryDate`
- Company name must remain unique

---

### 5. Update Subscription

**Endpoint**: `PUT /:id/subscription`

**Description**: Update company subscription expiry date

**Authentication**: Required

**Authorization**: Developer only

**Parameters**:

- `id` (path): Company ID (integer)

**Request Body**:

```json
{
  "subscriptionExpiryDate": "2026-12-31"
}
```

**Response Structure**:

```json
{
  "success": true,
  "message": "Subscription expiry date updated successfully",
  "data": {
    "id": 1,
    "name": "شركة الندى للفلاتر",
    "subscriptionExpiryDate": "2026-12-31T00:00:00.000Z"
  }
}
```

**Validation Rules**:

- `subscriptionExpiryDate`: Required, valid date, must be in the future

---

### 6. Delete Company

**Endpoint**: `DELETE /:id`

**Description**: Delete a company (with safety checks)

**Authentication**: Required

**Authorization**: Developer only

**Parameters**:

- `id` (path): Company ID (integer)

**Response Structure**:

```json
{
  "success": true,
  "message": "Company deleted successfully"
}
```

**Safety Rules**:

1. Developer cannot delete their own company
2. Cannot delete company with related records

**Error Responses**:

```json
{
  "success": false,
  "error": "You cannot delete your own company",
  "statusCode": 400
}
```

```json
{
  "success": false,
  "error": "Cannot delete company. It has 585 related records. (Users: 5, Customers: 120, Invoices: 450, etc.)",
  "statusCode": 400
}
```

---

## 🔐 Authentication & Authorization

### User Roles

| Role          | Description          | Permissions                                 |
| ------------- | -------------------- | ------------------------------------------- |
| **Developer** | System administrator | Full access to all companies and operations |
| **Manager**   | Company manager      | Manage own company data, view own company   |
| **Employee**  | Company employee     | View own company data only                  |

### Access Matrix

| Operation            | Developer | Manager  | Employee |
| -------------------- | --------- | -------- | -------- |
| View all companies   | ✅ All    | ✅ Own   | ✅ Own   |
| View company details | ✅ Any    | ✅ Own   | ✅ Own   |
| Create company       | ✅        | ❌       | ❌       |
| Update company       | ✅ Any    | ✅ Own\* | ❌       |
| Update subscription  | ✅        | ❌       | ❌       |
| Delete company       | ✅\*\*    | ❌       | ❌       |

\* Manager cannot update subscription date  
\*\* Developer cannot delete own company

### Authentication Flow

1. User logs in and receives JWT token
2. Token contains: `userId`, `role`, `companyId`
3. `authenticate` middleware validates token
4. `authorize` middleware checks role permissions
5. Service layer enforces data isolation

---

## 🔧 Service Layer

### File: `companies.service.js`

#### 1. getAllCompanies

**Purpose**: Fetch companies based on user role

**Function Signature**:

```javascript
getAllCompanies(prisma, currentUser);
```

**Parameters**:

- `prisma`: Prisma client instance
- `currentUser`: Object containing `{ role, companyId }`

**Business Logic**:

- Developer → Returns all companies
- Manager/Employee → Returns only their company
- Invalid role → Throws 403 error

---

#### 2. getCompanyById

**Purpose**: Retrieve specific company with access control

**Function Signature**:

```javascript
getCompanyById(prisma, id, currentUser);
```

**Parameters**:

- `prisma`: Prisma client instance
- `id`: Target company ID
- `currentUser`: Object containing `{ role, companyId }`

**Business Logic**:

- Developer → Can access any company
- Manager/Employee → Can only access their own company
- Returns 404 if not found or access denied

---

#### 3. createNewCompany

**Purpose**: Create new company (developer only)

**Function Signature**:

```javascript
createNewCompany(prisma, data, currentUser);
```

**Parameters**:

- `prisma`: Prisma client instance
- `data`: Company data object
- `currentUser`: Object containing `{ role }`

**Business Logic**:

1. Verify user is developer
2. Check if company name already exists
3. Convert subscription date to Date object
4. Create company record

**Validations**:

- Only developers can create
- Company name must be unique

---

#### 4. updateExistingCompany

**Purpose**: Update company information

**Function Signature**:

```javascript
updateExistingCompany(prisma, id, data, currentUser);
```

**Parameters**:

- `prisma`: Prisma client instance
- `id`: Company ID to update
- `data`: Update data object
- `currentUser`: Object containing `{ role, companyId }`

**Business Logic**:

1. Verify company exists and user has access
2. Check name uniqueness if name is changing
3. Prevent manager from updating subscription date
4. Apply updates

**Access Rules**:

- Developer → Can update any company
- Manager → Can only update own company (except subscription)
- Employee → Cannot update

---

#### 5. updateCompanySubscription

**Purpose**: Update subscription expiry date (developer only)

**Function Signature**:

```javascript
updateCompanySubscription(prisma, id, newExpiryDate, currentUser);
```

**Parameters**:

- `prisma`: Prisma client instance
- `id`: Company ID
- `newExpiryDate`: New subscription date
- `currentUser`: Object containing `{ role }`

**Business Logic**:

1. Verify user is developer
2. Check company exists
3. Update subscription date

---

#### 6. deleteExistingCompany

**Purpose**: Safely delete company

**Function Signature**:

```javascript
deleteExistingCompany(prisma, id, currentUser);
```

**Parameters**:

- `prisma`: Prisma client instance
- `id`: Company ID to delete
- `currentUser`: Object containing `{ role, companyId }`

**Business Logic**:

1. Verify user is developer
2. Prevent deleting own company
3. Check company exists
4. Check for related records
5. Delete if safe

**Safety Checks**:

- Cannot delete if has users, customers, invoices, etc.
- Cannot delete own company

---

## 💾 Repository Layer

### File: `companies.repository.js`

#### 1. findAllCompanies

**Purpose**: Fetch companies with optional filtering

**Function Signature**:

```javascript
findAllCompanies(prisma, (companyId = null));
```

**Parameters**:

- `prisma`: Prisma client instance
- `companyId`: Optional company ID filter (null = all companies)

**Returns**:

```javascript
[
  {
    id,
    name,
    logo,
    address,
    email,
    phone,
    subscriptionExpiryDate,
    createdAt,
    _count: { users, customers, invoices },
  },
];
```

---

#### 2. findCompanyById

**Purpose**: Retrieve single company by ID

**Function Signature**:

```javascript
findCompanyById(prisma, id, (restrictToCompanyId = null));
```

**Parameters**:

- `prisma`: Prisma client instance
- `id`: Target company ID
- `restrictToCompanyId`: Restrict to specific company (null = no restriction)

**Returns**:

```javascript
{
  id, name, logo, address, email, phone,
  subscriptionExpiryDate, createdAt,
  _count: {
    users, customers, employees, suppliers,
    products, accessories, services,
    maintenances, invoices
  }
}
```

---

#### 3. findCompanyByName

**Purpose**: Check if company name exists

**Function Signature**:

```javascript
findCompanyByName(prisma, name, (excludeCompanyId = null));
```

**Parameters**:

- `prisma`: Prisma client instance
- `name`: Company name to search
- `excludeCompanyId`: Exclude specific company (for updates)

**Returns**:

```javascript
{ id, name } or null
```

---

#### 4. createCompany

**Purpose**: Insert new company record

**Function Signature**:

```javascript
createCompany(prisma, data);
```

**Parameters**:

- `prisma`: Prisma client instance
- `data`: Company data object

---

#### 5. updateCompany

**Purpose**: Update company record

**Function Signature**:

```javascript
updateCompany(prisma, id, data);
```

**Parameters**:

- `prisma`: Prisma client instance
- `id`: Company ID
- `data`: Update data object

---

#### 6. deleteCompany

**Purpose**: Delete company record

**Function Signature**:

```javascript
deleteCompany(prisma, id);
```

---

#### 7. checkCompanyRelations

**Purpose**: Check if company has related records

**Function Signature**:

```javascript
checkCompanyRelations(prisma, id);
```

**Returns**:

```javascript
{
  hasRelations: true/false,
  counts: {
    users: 5,
    customers: 120,
    employees: 15,
    suppliers: 8,
    products: 25,
    accessories: 40,
    services: 6,
    maintenances: 200,
    invoices: 450
  },
  totalRelations: 863
}
```

---

## ✅ Validation Schema

### File: `companies.schema.js`

### Create Company Schema

```javascript
createCompanySchema = {
  name: {
    type: "string",
    required: true,
    rules: "3-255 characters",
  },
  logo: {
    type: "string",
    required: false,
    rules: "max 500 characters",
  },
  address: {
    type: "string",
    required: false,
  },
  email: {
    type: "string",
    required: false,
    rules: "valid email format",
  },
  phone: {
    type: "string",
    required: false,
    rules: "10-15 digits, can include +, -, (, ), spaces",
  },
  subscriptionExpiryDate: {
    type: "string",
    required: false,
    rules: "valid date format",
  },
};
```

### Update Company Schema

- Same as create schema but all fields are optional

### Update Subscription Schema

```javascript
updateSubscriptionSchema = {
  subscriptionExpiryDate: {
    type: "string",
    required: true,
    rules: "valid date format, must be in future",
  },
};
```

---

## ⚠️ Error Handling

### Error Types

| Error            | Status Code | Description                        |
| ---------------- | ----------- | ---------------------------------- |
| Validation Error | 400         | Invalid input data                 |
| Unauthorized     | 401         | Missing or invalid authentication  |
| Forbidden        | 403         | Insufficient permissions           |
| Not Found        | 404         | Company not found or access denied |
| Conflict         | 409         | Company name already exists        |
| Server Error     | 500         | Internal server error              |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": {},
  "statusCode": 400
}
```

---

## 📝 Usage Examples

### Example 1: Developer Creates Company

```javascript
POST /api/companies
Headers: { Authorization: "Bearer <developer_token>" }
Body: {
  "name": "شركة الهرم للمياه",
  "email": "info@elharam.com",
  "phone": "01123456789",
  "subscriptionExpiryDate": "2025-12-31"
}
```

### Example 2: Manager Views Own Company

```javascript
GET / api / companies / 1;
Headers: {
  Authorization: "Bearer <manager_token>";
}
```

### Example 3: Manager Updates Company Info

```javascript
PUT /api/companies/1
Headers: { Authorization: "Bearer <manager_token>" }
Body: {
  "address": "القاهرة، مدينة نصر، الحي العاشر",
  "phone": "01012345680"
}
```

### Example 4: Developer Updates Subscription

```javascript
PUT /api/companies/1/subscription
Headers: { Authorization: "Bearer <developer_token>" }
Body: {
  "subscriptionExpiryDate": "2027-12-31"
}
```

### Example 5: Employee Views All Companies (Own Only)

```javascript
GET / api / companies;
Headers: {
  Authorization: "Bearer <employee_token>";
}
// Returns only employee's company
```

---

## 🔄 Data Flow Diagram

```
Request
  ↓
Authentication Middleware (JWT validation)
  ↓
Authorization Middleware (Role check)
  ↓
Validation Middleware (Schema validation)
  ↓
Controller (Route handler)
  ↓
Service Layer (Business logic & access control)
  ↓
Repository Layer (Database operations)
  ↓
Prisma ORM
  ↓
PostgreSQL Database
  ↓
Response
```

---

## 📊 Seeded Data Example

```javascript
Company 1:
- Name: "شركة الندى للفلاتر"
- Users: 2 (1 manager, 1 employee)
- Customers: 2
- Employees: 2 (1 sales rep, 1 technician)
- Products: 2 (water filters)
- Services: 2 (installation, maintenance)
- Invoices: 2 (1 cash, 1 installment)

Company 2:
- Name: "شركة النيل للتكييفات"
- Customers: 1
- Employees: 2 (1 sales rep, 1 technician)
- Products: 1 (AC unit)
- Services: 1 (installation)
```

---

## 🛡️ Security Considerations

1. **Data Isolation**: Each company's data is strictly isolated
2. **Role Validation**: All operations check user role
3. **Access Control**: Users can only access authorized companies
4. **Safe Deletion**: Prevents deletion of companies with dependencies
5. **Name Uniqueness**: Enforced at database and application level
6. **Subscription Management**: Only developers can modify subscriptions

---

## 📌 Best Practices

1. **Always authenticate**: All endpoints require authentication
2. **Check permissions**: Service layer enforces role-based access
3. **Validate input**: Use schema validation for all requests
4. **Handle errors**: Proper error messages and status codes
5. **Audit trail**: Track creation dates and modifications
6. **Test thoroughly**: Test all role combinations

---

## 🔗 Related Modules

- **Users Module**: Manages company users
- **Customers Module**: Company customer management
- **Employees Module**: Company employee management
- **Invoices Module**: Sales and billing
- **Products Module**: Product catalog
- **Services Module**: Service offerings

---

**Documentation Version**: 1.0  
**Last Updated**: November 7, 2024  
**Module Version**: 1.0.0
