// ========================================
// FILE: src/config/swagger.js
// DESC: Swagger/OpenAPI configuration
// ========================================

require("dotenv").config();

// Swagger configuration options
const SWAGGER_OPTIONS = {
  // OpenAPI version
  openapi: "3.0.0",

  // API Information
  info: {
    title: "Authentication System API",
    version: "1.0.0",
    description: `
# 🔐 Authentication System API

A complete, production-ready authentication system with JWT tokens, role-based access control, and comprehensive security features.

## 📋 Features
- ✅ User registration with email verification
- ✅ JWT-based authentication (access & refresh tokens)
- ✅ Role-based authorization (User, Admin, Moderator)
- ✅ Password reset functionality
- ✅ Account security (lockout, device tracking)
- ✅ Rate limiting on all endpoints
- ✅ Comprehensive validation
- ✅ Detailed error responses

## 🚀 Quick Start
1. Register a new user at \`POST /api/v1/auth/register\`
2. Login at \`POST /api/v1/auth/login\`
3. Use the access token in \`Authorization: Bearer <token>\` header
4. Refresh token when expired

## 🔐 Security
- All passwords are hashed using bcrypt
- JWT tokens with configurable expiration
- Automatic token blacklisting on logout
- Rate limiting to prevent brute force attacks
- Input validation on all endpoints

## 📚 API Versioning
This is version 1.0.0 of the API. All endpoints are prefixed with \`/api/v1/\`
    `,
    termsOfService: "https://example.com/terms",
    contact: {
      name: "API Support",
      email: "support@example.com",
      url: "https://example.com/support",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },

  // Server configurations
  servers: [
    {
      url: process.env.BASE_URL || "http://localhost:3000",
      description: "Development Server",
    },
    {
      url: "https://api.example.com",
      description: "Production Server",
    },
  ],

  // API components (schemas, responses, etc.)
  components: {
    // Security schemes
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: **Bearer {token}**",
        name: "Authorization",
        in: "header",
      },
      ApiKeyAuth: {
        type: "apiKey",
        name: "X-API-Key",
        in: "header",
        description: "API key for machine-to-machine communication",
      },
    },

    // Reusable schemas (models)
    schemas: {
      // User model
      User: {
        type: "object",
        required: ["name", "email"],
        properties: {
          _id: {
            type: "string",
            description: "Unique identifier for the user",
            example: "507f1f77bcf86cd799439011",
          },
          name: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            description: "Full name of the user",
            example: "John Doe",
          },
          email: {
            type: "string",
            format: "email",
            description: "User email address (must be unique)",
            example: "john@example.com",
          },
          role: {
            type: "string",
            enum: ["user", "admin", "moderator"],
            default: "user",
            description: "User role for authorization",
          },
          isVerified: {
            type: "boolean",
            default: false,
            description: "Whether the user has verified their email",
          },
          isActive: {
            type: "boolean",
            default: true,
            description: "Whether the user account is active",
          },
          profileImage: {
            type: "string",
            description: "URL to profile image",
            example: "https://example.com/images/profile.jpg",
          },
          phone: {
            type: "string",
            description: "Phone number with country code",
            example: "+251911223344",
          },
          dateOfBirth: {
            type: "string",
            format: "date",
            description: "Date of birth (YYYY-MM-DD)",
            example: "1990-01-01",
          },
          address: {
            type: "object",
            properties: {
              street: { type: "string", example: "Bole Road" },
              city: { type: "string", example: "Addis Ababa" },
              state: { type: "string", example: "Addis Ababa" },
              country: { type: "string", example: "Ethiopia" },
              zipCode: { type: "string", example: "1000" },
            },
            description: "User address information",
          },
          preferences: {
            type: "object",
            properties: {
              emailNotifications: { type: "boolean", default: true },
              smsNotifications: { type: "boolean", default: false },
              twoFactorAuth: { type: "boolean", default: false },
              theme: {
                type: "string",
                enum: ["light", "dark", "auto"],
                default: "light",
              },
              language: { type: "string", default: "en" },
            },
            description: "User preferences and settings",
          },
          lastLogin: {
            type: "string",
            format: "date-time",
            description: "Last login timestamp",
            example: "2024-01-15T10:30:00.000Z",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Account creation timestamp",
            example: "2024-01-15T10:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Last update timestamp",
            example: "2024-01-15T10:30:00.000Z",
          },
        },
        example: {
          _id: "507f1f77bcf86cd799439011",
          name: "John Doe",
          email: "john@example.com",
          role: "user",
          isVerified: true,
          isActive: true,
          profileImage: "default.jpg",
          phone: "+251911223344",
          dateOfBirth: "1990-01-01",
          address: {
            street: "Bole Road",
            city: "Addis Ababa",
            state: "Addis Ababa",
            country: "Ethiopia",
            zipCode: "1000",
          },
          preferences: {
            emailNotifications: true,
            smsNotifications: false,
            twoFactorAuth: false,
            theme: "light",
            language: "en",
          },
          lastLogin: "2024-01-15T10:30:00.000Z",
          createdAt: "2024-01-15T10:00:00.000Z",
          updatedAt: "2024-01-15T10:30:00.000Z",
        },
      },

      // Registration request
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            example: "John Doe",
          },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 6,
            example: "TestPass123!",
            description:
              "Must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          },
          phone: {
            type: "string",
            example: "+251911223344",
          },
          role: {
            type: "string",
            enum: ["user", "admin", "moderator"],
            default: "user",
          },
        },
        example: {
          name: "John Doe",
          email: "john@example.com",
          password: "TestPass123!",
          phone: "+251911223344",
          role: "user",
        },
      },

      // Login request
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "TestPass123!",
          },
        },
        example: {
          email: "john@example.com",
          password: "TestPass123!",
        },
      },

      // Token response
      TokenResponse: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            description: "JWT access token (short-lived, 15 minutes)",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          refreshToken: {
            type: "string",
            description: "JWT refresh token (long-lived, 7 days)",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
        example: {
          accessToken:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTk4YjQ1YjQ1NjY3ODkwMDAxMjM0NTYiLCJyb2xlIjoidXNlciIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MDgwMDAwMDAsImV4cCI6MTcwODAwMDkwMH0.abcdef123456",
          refreshToken:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTk4YjQ1YjQ1NjY3ODkwMDAxMjM0NTYiLCJyb2xlIjoidXNlciIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzA4MDAwMDAwLCJleHAiOjE3MDg2MDUwMDB9.ghijkl789012",
        },
      },

      // Success response
      SuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Operation successful",
          },
          data: {
            type: "object",
            description: "Response data (structure varies by endpoint)",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
        },
      },

      // Error response
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "An error occurred",
          },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "email" },
                message: { type: "string", example: "Email is required" },
                value: { type: "string", example: "" },
                location: { type: "string", example: "body" },
              },
            },
          },
          suggestion: {
            type: "string",
            example: "Check your input and try again",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
        },
      },

      // Validation error
      ValidationError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "password" },
                message: {
                  type: "string",
                  example: "Password must be at least 6 characters",
                },
              },
            },
          },
        },
      },
    },

    // Reusable responses
    responses: {
      // Success responses
      Success200: {
        description: "Success",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SuccessResponse",
            },
          },
        },
      },

      // Error responses
      BadRequest400: {
        description: "Bad Request - Validation error or invalid input",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      Unauthorized401: {
        description: "Unauthorized - Invalid or missing authentication",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      Forbidden403: {
        description: "Forbidden - Authenticated but insufficient permissions",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      NotFound404: {
        description: "Not Found - Resource not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      Conflict409: {
        description: "Conflict - Resource already exists",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      TooManyRequests429: {
        description: "Too Many Requests - Rate limit exceeded",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },

      InternalServerError500: {
        description: "Internal Server Error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },

    // Request bodies
    requestBodies: {
      RegisterRequest: {
        description: "User registration data",
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/RegisterRequest",
            },
          },
        },
      },
      LoginRequest: {
        description: "User login credentials",
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/LoginRequest",
            },
          },
        },
      },
    },
  },

  // Security requirements (applied globally)
  security: [
    {
      BearerAuth: [],
    },
  ],

  // Tags for grouping endpoints
  tags: [
    {
      name: "Authentication",
      description: "User authentication and authorization endpoints",
    },
    {
      name: "Users",
      description: "User profile management endpoints",
    },
    {
      name: "Admin",
      description: "Administrative endpoints (requires admin role)",
    },
    {
      name: "Health",
      description: "Health check and system status endpoints",
    },
  ],

  // External documentation
  externalDocs: {
    description: "Find more info and documentation",
    url: "https://docs.example.com",
  },
};

// Swagger UI options
const SWAGGER_UI_OPTIONS = {
  explorer: true, // Enable search and filter
  customSiteTitle: "Authentication System API",
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b4151 }
    .swagger-ui .scheme-container { background: #fafafa }
    .swagger-ui .btn.authorize { background-color: #49cc90; border-color: #49cc90 }
    .swagger-ui .btn.authorize svg { fill: #ffffff }
    .model-box { background: #f7f7f7; padding: 10px; border-radius: 4px }
  `,
  customJs: `
    // Custom JavaScript for Swagger UI
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Swagger UI loaded with custom configuration');
      
      // Add API version info
      const infoContainer = document.querySelector('.info');
      if (infoContainer) {
        const versionInfo = document.createElement('div');
        versionInfo.innerHTML = \`
          <div style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
            <strong>API Version:</strong> v1.0.0<br>
            <strong>Environment:</strong> \${window.location.hostname.includes('localhost') ? 'Development' : 'Production'}<br>
            <strong>Base URL:</strong> \${window.location.origin}
          </div>
        \`;
        infoContainer.appendChild(versionInfo);
      }
    });
  `,
  swaggerOptions: {
    persistAuthorization: true, // Remember auth tokens
    docExpansion: "list", // 'none', 'list', or 'full'
    filter: true, // Enable search filter
    showRequestDuration: true, // Show request duration
    tryItOutEnabled: true, // Enable "Try it out" by default
    displayOperationId: false, // Hide operation IDs
    defaultModelsExpandDepth: 3, // Show model details
    defaultModelExpandDepth: 3, // Show model properties
    deepLinking: true, // Enable deep linking to operations
    syntaxHighlight: {
      activate: true,
      theme: "monokai",
    },
  },
};

module.exports = {
  SWAGGER_OPTIONS,
  SWAGGER_UI_OPTIONS,
};
