# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-user-authentication-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Authentication Endpoints

#### POST /api/auth/register/
**Description:** User registration with email and password

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "password_confirm": "securePassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
- **Success (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "date_joined": "2025-08-21T10:00:00Z"
}
```

- **Error (400 Bad Request):**
```json
{
  "email": ["This field is required."],
  "password": ["Password must be at least 8 characters long."],
  "non_field_errors": ["Passwords do not match."]
}
```

#### POST /api/auth/login/
**Description:** User authentication and JWT token generation

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
- **Success (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

- **Error (401 Unauthorized):**
```json
{
  "detail": "Invalid email or password."
}
```

#### POST /api/auth/logout/
**Description:** Token invalidation and user logout

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Authentication:** Bearer token required

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
- **Success (205 Reset Content):**
```json
{
  "detail": "Successfully logged out."
}
```

- **Error (400 Bad Request):**
```json
{
  "detail": "Invalid or expired refresh token."
}
```

#### POST /api/auth/refresh/
**Description:** Token refresh for extended sessions

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Authentication:** None required

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
- **Success (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

- **Error (401 Unauthorized):**
```json
{
  "detail": "Token is invalid or expired"
}
```

#### POST /api/auth/password-reset/
**Description:** Request password reset via email

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
- **Success (200 OK):**
```json
{
  "detail": "Password reset e-mail has been sent."
}
```

- **Error (400 Bad Request):**
```json
{
  "email": ["Enter a valid email address."]
}
```

#### POST /api/auth/password-reset-confirm/
**Description:** Confirm password reset with token

**Request:**
- **Method:** POST
- **Content-Type:** application/json
- **Authentication:** None required

**Request Body:**
```json
{
  "new_password1": "newSecurePassword123",
  "new_password2": "newSecurePassword123",
  "uid": "Mw",
  "token": "5ab-a4c2c9c6e5e8f9a7b2d1"
}
```

**Response:**
- **Success (200 OK):**
```json
{
  "detail": "Password has been reset with the new password."
}
```

- **Error (400 Bad Request):**
```json
{
  "token": ["Invalid value"],
  "new_password2": ["The two password fields didn't match."]
}
```

### User Profile Endpoints

#### GET /api/auth/user/
**Description:** Get current user profile

**Request:**
- **Method:** GET
- **Authentication:** Bearer token required

**Response:**
- **Success (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "date_joined": "2025-08-21T10:00:00Z",
  "last_login": "2025-08-21T14:30:00Z"
}
```

- **Error (401 Unauthorized):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

#### PUT /api/auth/user/
**Description:** Update user profile information

**Request:**
- **Method:** PUT
- **Content-Type:** application/json
- **Authentication:** Bearer token required

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@example.com"
}
```

**Response:**
- **Success (200 OK):**
```json
{
  "id": 1,
  "email": "john.smith@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "is_active": true,
  "date_joined": "2025-08-21T10:00:00Z",
  "last_login": "2025-08-21T14:30:00Z"
}
```

- **Error (400 Bad Request):**
```json
{
  "email": ["Enter a valid email address."],
  "first_name": ["This field may not be blank."]
}
```

## Controllers

### UserViewSet
**Purpose:** Handle user profile management operations

**Methods:**
- `retrieve()` - Get current user profile (GET /api/auth/user/)
- `update()` - Update user profile (PUT /api/auth/user/)
- `partial_update()` - Partial update user profile (PATCH /api/auth/user/)

**Permissions:** IsAuthenticated

**Serializer:** UserSerializer

**Business Logic:**
- Validates user input data
- Ensures users can only access/modify their own profile
- Handles email uniqueness validation
- Updates user timestamps appropriately

### AuthViewSet
**Purpose:** Handle authentication operations

**Custom Actions:**
- `register()` - User registration (POST /api/auth/register/)
- `login()` - User authentication (POST /api/auth/login/)
- `logout()` - User logout (POST /api/auth/logout/)
- `refresh_token()` - Token refresh (POST /api/auth/refresh/)
- `password_reset()` - Request password reset (POST /api/auth/password-reset/)
- `password_reset_confirm()` - Confirm password reset (POST /api/auth/password-reset-confirm/)

**Permissions:** AllowAny for most actions, IsAuthenticated for logout

**Serializers:**
- UserRegistrationSerializer
- LoginSerializer
- TokenRefreshSerializer
- PasswordResetSerializer
- PasswordResetConfirmSerializer

**Business Logic:**
- User registration with email verification
- JWT token generation and validation
- Password strength validation
- Rate limiting for sensitive operations
- Secure token blacklisting on logout

### Password Reset Flow Logic

**Process:**
1. User requests password reset via email
2. System generates unique reset token with expiration
3. Reset link sent to user's email
4. User clicks link and provides new password
5. System validates token and updates password
6. All existing tokens invalidated for security

**Security Measures:**
- Tokens expire after 24 hours
- Tokens are single-use only
- Rate limiting on reset requests
- Secure token generation using cryptographic methods

### Token Management and Validation

**JWT Configuration:**
- Access token lifetime: 15 minutes
- Refresh token lifetime: 7 days
- Token blacklisting on logout
- Automatic token rotation on refresh

**Validation Logic:**
- Token signature verification
- Expiration time checking
- User active status validation
- Token blacklist checking

### Input Validation and Sanitization

**Email Validation:**
- Valid email format checking
- Domain validation
- Duplicate email prevention
- Case-insensitive email storage

**Password Validation:**
- Minimum 8 characters
- Must contain uppercase and lowercase letters
- Must contain at least one number
- Must contain at least one special character
- Common password prevention

**General Input Sanitization:**
- HTML tag stripping
- SQL injection prevention
- XSS attack prevention
- Input length limitations
- Special character handling