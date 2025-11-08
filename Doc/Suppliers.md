# 📋 Suppliers Module - Complete Documentation

## 📑 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Backend API](#backend-api)
4. [Frontend Implementation](#frontend-implementation)
5. [Permission System](#permission-system)
6. [API Endpoints](#api-endpoints)
7. [Usage Examples](#usage-examples)
8. [Testing Guide](#testing-guide)

---

## 🎯 Overview

### Purpose

The Suppliers Module manages supplier entities in a multi-tenant system with role-based access control. It handles supplier information including contact details and tracks relationships with products and accessories.

### Key Features

- ✅ Multi-company support with data isolation
- ✅ Role-based access control (Developer, Manager, Employee)
- ✅ Supplier-Product/Accessory relationships
- ✅ Search and filtering capabilities
- ✅ Safe deletion with relation checks
- ✅ Comprehensive validation

### Technology Stack

**Backend:**

- Framework: Fastify (Node.js)
- ORM: Prisma
- Database: PostgreSQL
- Authentication: JWT-based

**Frontend:**

- Framework: React
- State Management: TanStack Query (React Query)
- UI: Shadcn/ui components
- Styling: Tailwind CSS

---

## 🗄️ Database Schema

### Supplier Model

```prisma
model Supplier {
  id          Int    @id @default(autoincrement())
  name        String @db.VarChar(255)
  contactInfo String @db.Text
  companyId   Int

  // Relations
  company     Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  products    Product[]
  accessories Accessory[]

  @@index([companyId])
  @@map("suppliers")
}
```

### Field Descriptions

| Field         | Type    | Required | Description                                    |
| ------------- | ------- | -------- | ---------------------------------------------- |
| `id`          | Integer | Auto     | Primary key (auto-increment)                   |
| `name`        | String  | Yes      | Supplier name (3-255 chars)                    |
| `contactInfo` | String  | Yes      | Contact information (phone/email, min 5 chars) |
| `companyId`   | Integer | Yes      | Foreign key to Company                         |

### Relationships

- **Company**: Each supplier belongs to one company (Cascade delete)
- **Products**: One-to-many relationship with products (Restrict delete)
- **Accessories**: One-to-many relationship with accessories (Restrict delete)

---

## 🔧 Backend API

### File Structure

```
suppliers/
├── suppliers.routes.js       # Route definitions
├── suppliers.controller.js   # HTTP handlers
├── suppliers.service.js      # Business logic
├── suppliers.repository.js   # Database queries
└── suppliers.schema.js       # Validation schemas
```

### Layer Responsibilities

**Routes Layer** (`suppliers.routes.js`)

- Defines API endpoints
- Applies middleware (authentication, authorization)
- Handles request routing

**Controller Layer** (`suppliers.controller.js`)

- Validates request data
- Calls service layer
- Formats responses

**Service Layer** (`suppliers.service.js`)

- Implements business logic
- Enforces access control
- Handles data validation

**Repository Layer** (`suppliers.repository.js`)

- Executes database queries
- Manages Prisma operations
- Returns raw data

---

## 🎨 Frontend Implementation

### File Structure

```
Frontend/
├── src/
│   ├── lib/api/
│   │   └── suppliers.js              # API calls
│   ├── pages/
│   │   └── Suppliers.jsx             # Main page
│   └── components/modals/
│       └── SupplierModal.jsx         # Create/Edit modal
```

### Key Components

**Suppliers.jsx** - Main page component with:

- Supplier list table
- Search functionality
- Create/Edit/Delete operations
- Role-based UI rendering

**SupplierModal.jsx** - Modal for creating/editing suppliers with:

- Form validation
- Error handling
- Responsive design

---

## 🔐 Permission System

### User Roles

| Role          | Description          | Permissions                                 |
| ------------- | -------------------- | ------------------------------------------- |
| **Developer** | System administrator | Full access to all companies and operations |
| **Manager**   | Company manager      | Manage own company suppliers                |
| **Employee**  | Company employee     | View-only access to own company             |

### Access Matrix

| Operation             | Developer      | Manager | Employee |
| --------------------- | -------------- | ------- | -------- |
| View all suppliers    | ✅ All         | ✅ Own  | ✅ Own   |
| View supplier details | ✅ Any         | ✅ Own  | ✅ Own   |
| Search suppliers      | ✅ All         | ✅ Own  | ✅ Own   |
| Create supplier       | ✅ Any company | ✅ Own  | ❌       |
| Update supplier       | ✅ Any         | ✅ Own  | ❌       |
| Delete supplier       | ✅             | ❌      | ❌       |

### Implementation Details

**Backend Authorization:**

- Implemented in middleware: `authenticate`, `authorize`, `checkCompanyAccess`
- Service layer enforces data isolation
- Role checks in business logic

**Frontend Authorization:**

- Uses `useAuth` hook for role checking
- `ConditionalRender` component for UI elements
- Permission checks before API calls

---

## 📌 API Endpoints

### Base URL

```
/api/suppliers
```

### 1. GET /api/suppliers

**Description**: Get all suppliers with optional filters

**Access**: All authenticated users

**Query Parameters**:

- `search` (string, optional) - Search in name or contact info

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "مورد الفلاتر المصرية",
      "contactInfo": "01555123456",
      "companyId": 1,
      "company": {
        "id": 1,
        "name": "شركة الندى للفلاتر"
      },
      "_count": {
        "products": 5,
        "accessories": 10
      }
    }
  ],
  "count": 1
}
```

**Access Rules**:

- Developer: Sees all suppliers
- Manager/Employee: Sees only their company's suppliers

---

### 2. GET /api/suppliers/search

**Description**: Search suppliers by name or contact info

**Access**: All authenticated users

**Query Parameters**:

- `q` (string, required) - Search term (minimum 2 characters)

**Response**: Same structure as GET /api/suppliers

**Validation**:

- Search term must be at least 2 characters
- Returns 400 error if validation fails

---

### 3. GET /api/suppliers/:id

**Description**: Get supplier by ID with full details

**Access**: All authenticated users

**URL Parameters**:

- `id` (integer, required) - Supplier ID

**Response**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "مورد الفلاتر المصرية",
    "contactInfo": "supplier1@example.com | 01555123456",
    "companyId": 1,
    "company": {
      "id": 1,
      "name": "شركة الندى للفلاتر",
      "email": "info@alnada.com",
      "phone": "01012345678"
    },
    "_count": {
      "products": 5,
      "accessories": 10
    },
    "products": [...],
    "accessories": [...]
  }
}
```

**Access Rules**:

- Developer: Can access any supplier
- Manager/Employee: Can only access suppliers in their company

**Error Responses**:

```json
{
  "success": false,
  "error": "Supplier not found or access denied",
  "statusCode": 404
}
```

---

### 4. POST /api/suppliers

**Description**: Create new supplier

**Access**: Manager, Developer only

**Request Body**:

```json
{
  "name": "مورد التكييفات الحديثة",
  "contactInfo": "supplier2@example.com",
  "companyId": 1 // Required for developers, auto-set for managers
}
```

**Validation Rules**:

- `name`: Required, 3-255 characters
- `contactInfo`: Required, minimum 5 characters, must be phone (10-15 digits) or valid email
- `companyId`: Optional for managers (auto-set), required for developers

**Business Rules**:

- Employees cannot create suppliers
- Manager creates for their company only
- Developer must specify companyId
- Supplier name must be unique within company

**Response**:

```json
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "id": 2,
    "name": "مورد التكييفات الحديثة",
    "contactInfo": "supplier2@example.com",
    "companyId": 1,
    "company": {
      "id": 1,
      "name": "شركة الندى للفلاتر"
    }
  }
}
```

**Error Responses**:

```json
{
  "success": false,
  "error": "Supplier name already exists in this company",
  "statusCode": 409
}
```

---

### 5. PUT /api/suppliers/:id

**Description**: Update supplier

**Access**: Manager (own company), Developer (any)

**URL Parameters**:

- `id` (integer, required) - Supplier ID

**Request Body** (all fields optional):

```json
{
  "name": "مورد الفلاتر المصرية المحدثة",
  "contactInfo": "new-email@example.com"
}
```

**Business Rules**:

- Manager can only update suppliers in their company
- Developer can update any supplier
- Name uniqueness checked if changed

**Response**:

```json
{
  "success": true,
  "message": "Supplier updated successfully",
  "data": {...}
}
```

**Error Responses**:

```json
{
  "success": false,
  "error": "You can only update suppliers in your company",
  "statusCode": 403
}
```

---

### 6. DELETE /api/suppliers/:id

**Description**: Delete supplier

**Access**: Developer only

**URL Parameters**:

- `id` (integer, required) - Supplier ID

**Business Rules**:

- Only developers can delete suppliers
- Cannot delete if supplier has related products or accessories

**Response**:

```json
{
  "success": true,
  "message": "Supplier deleted successfully"
}
```

**Error Responses**:

```json
{
  "success": false,
  "error": "Only developers can delete suppliers",
  "statusCode": 403
}
```

```json
{
  "success": false,
  "error": "Cannot delete supplier. It has 5 product(s) and 10 accessory(ies). Please remove these items first.",
  "statusCode": 400
}
```

---

## 💡 Usage Examples

### Example 1: Manager Creates Supplier

```javascript
// Manager automatically creates for their company
POST /api/suppliers
Headers: { Authorization: "Bearer <manager_token>" }
Body: {
  "name": "مورد الفلاتر الجديد",
  "contactInfo": "01012345678"
  // companyId automatically set to manager's company
}
```

### Example 2: Developer Creates Supplier for Specific Company

```javascript
// Developer must specify companyId
POST /api/suppliers
Headers: { Authorization: "Bearer <developer_token>" }
Body: {
  "name": "مورد التكييفات",
  "contactInfo": "supplier@example.com",
  "companyId": 2
}
```

### Example 3: Search Suppliers

```javascript
GET /api/suppliers/search?q=فلاتر
Headers: { Authorization: "Bearer <token>" }

// Returns suppliers matching "فلاتر" in name or contact info
```

### Example 4: Employee Views Suppliers

```javascript
GET / api / suppliers;
Headers: {
  Authorization: "Bearer <employee_token>";
}

// Returns only employee's company suppliers
// UI shows no create/edit/delete buttons
```

### Example 5: Developer Deletes Supplier

```javascript
DELETE / api / suppliers / 1;
Headers: {
  Authorization: "Bearer <developer_token>";
}

// Only succeeds if no products/accessories linked
```

---

## 🧪 Testing Guide

### Backend Testing

**Test Cases:**

1. **Authentication Tests**

   - ✅ Reject requests without token
   - ✅ Accept requests with valid token
   - ✅ Reject requests with expired token

2. **Authorization Tests**

   - ✅ Developer can access all suppliers
   - ✅ Manager can only access own company
   - ✅ Employee can only view, not modify
   - ✅ Create blocked for employees
   - ✅ Delete blocked for non-developers

3. **Validation Tests**

   - ✅ Reject missing required fields
   - ✅ Reject invalid contact info format
   - ✅ Reject duplicate names in company
   - ✅ Reject short names (< 3 chars)

4. **Business Logic Tests**
   - ✅ Prevent deletion with related records
   - ✅ Auto-set companyId for managers
   - ✅ Require companyId for developers
   - ✅ Enforce name uniqueness per company

### Frontend Testing

**Test Cases:**

1. **UI Permission Tests**

   - ✅ Show create button for manager/developer
   - ✅ Hide create button for employee
   - ✅ Show edit button for manager/developer
   - ✅ Show delete button for developer only

2. **Form Validation Tests**

   - ✅ Prevent submission with empty fields
   - ✅ Show error for invalid contact info
   - ✅ Show error for short names

3. **Integration Tests**
   - ✅ Create supplier successfully
   - ✅ Update supplier successfully
   - ✅ Delete supplier successfully
   - ✅ Handle API errors gracefully

### Manual Testing Checklist

**As Developer:**

- [ ] Create supplier for any company
- [ ] Update any supplier
- [ ] Delete supplier (without relations)
- [ ] View all suppliers across companies
- [ ] Search suppliers globally

**As Manager:**

- [ ] Create supplier for own company
- [ ] Update supplier in own company
- [ ] Cannot delete supplier
- [ ] View only own company suppliers
- [ ] Search within own company

**As Employee:**

- [ ] Cannot see create button
- [ ] Cannot see edit button
- [ ] Cannot see delete button
- [ ] View only own company suppliers
- [ ] Can search within own company

---

## 🔄 Integration with Other Modules

### Products Module

- Suppliers provide products
- Cannot delete supplier with existing products
- Products show supplier information

### Accessories Module

- Suppliers provide accessories
- Cannot delete supplier with existing accessories
- Accessories show supplier information

### Companies Module

- Each supplier belongs to one company
- Cascade delete: Company deleted → Suppliers deleted
- Company isolation enforced

---

## 📊 Data Flow Diagram

```
Request
  ↓
Authentication Middleware (JWT validation)
  ↓
Authorization Middleware (Role check)
  ↓
Company Access Middleware (Data isolation)
  ↓
Validation (Schema validation)
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

## 🛡️ Security Considerations

1. **Data Isolation**: Each company's suppliers are strictly isolated
2. **Role Validation**: All operations check user role
3. **Access Control**: Users can only access authorized suppliers
4. **Safe Deletion**: Prevents deletion with dependencies
5. **Name Uniqueness**: Enforced per company
6. **Input Validation**: All inputs sanitized and validated

---

## 📝 Best Practices

1. **Always authenticate**: All endpoints require authentication
2. **Check permissions**: Service layer enforces role-based access
3. **Validate input**: Use schema validation for all requests
4. **Handle errors**: Proper error messages and status codes
5. **Audit trail**: Track creation and modifications
6. **Test thoroughly**: Test all role combinations

---

## 🔗 Related Files

### Backend

- `src/modules/suppliers/` - All supplier backend files
- `src/shared/middlewares/auth.middleware.js` - Authentication
- `src/shared/middlewares/authorize.middleware.js` - Authorization
- `src/shared/middlewares/companyAccess.middleware.js` - Company isolation

### Frontend

- `src/pages/Suppliers.jsx` - Main page
- `src/components/modals/SupplierModal.jsx` - Create/Edit modal
- `src/lib/api/suppliers.js` - API calls
- `src/contexts/AuthContext.jsx` - Authentication context

---

**Documentation Version**: 1.0  
**Last Updated**: November 8, 2025  
**Module Version**: 1.0.0
