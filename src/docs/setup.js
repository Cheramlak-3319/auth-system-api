// ========================================
// FILE: src/docs/setup.js
// DESC: Swagger documentation setup and route annotations
// ========================================

const { SWAGGER_OPTIONS } = require("../config/swagger");

// Swagger JSDoc annotations for routes
const swaggerDocs = {
  // ========================================
  // HEALTH ENDPOINTS
  // ========================================
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check
   *     description: Check if the API is running and database is connected
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: API is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: API is healthy
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 uptime:
   *                   type: number
   *                   example: 123.45
   *                 version:
   *                   type: string
   *                   example: 1.0.0
   *                 database:
   *                   type: string
   *                   example: connected
   *                 databasePing:
   *                   type: string
   *                   example: success
   *                 memoryUsage:
   *                   type: object
   *                   properties:
   *                     rss:
   *                       type: string
   *                       example: 45 MB
   *                     heapTotal:
   *                       type: string
   *                       example: 18 MB
   *                     heapUsed:
   *                       type: string
   *                       example: 12 MB
   *       503:
   *         description: Service unavailable
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Database connection failed
   */
  /**
   * @swagger
   * /db-info:
   *   get:
   *     summary: Database information
   *     description: Get detailed database connection and statistics
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Database information retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     database:
   *                       type: object
   *                       properties:
   *                         name:
   *                           type: string
   *                           example: auth_system_db
   *                         collections:
   *                           type: number
   *                           example: 2
   *                         size:
   *                           type: string
   *                           example: 45 MB
   *                         storageSize:
   *                           type: string
   *                           example: 64 MB
   *                         objects:
   *                           type: number
   *                           example: 100
   *                         indexes:
   *                           type: number
   *                           example: 5
   *                         indexSize:
   *                           type: string
   *                           example: 8 MB
   *                     collections:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           name:
   *                             type: string
   *                           type:
   *                             type: string
   *                     connection:
   *                       type: object
   *                       properties:
   *                         host:
   *                           type: string
   *                           example: 127.0.0.1
   *                         port:
   *                           type: number
   *                           example: 27017
   *                         readyState:
   *                           type: number
   *                           example: 1
   *                         models:
   *                           type: array
   *                           items:
   *                             type: string
   *                           example: ["User", "Token"]
   *       503:
   *         description: Database not connected
   */
  // ========================================
  // AUTHENTICATION ENDPOINTS
  // ========================================
  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     summary: Register a new user
   *     description: Create a new user account with email and password
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Registration successful! Welcome to our platform.
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     tokens:
   *                       $ref: '#/components/schemas/TokenResponse'
   *                     tokenInfo:
   *                       type: object
   *                       properties:
   *                         accessTokenExpiresIn:
   *                           type: string
   *                           example: 15 minutes
   *                         refreshTokenExpiresIn:
   *                           type: string
   *                           example: 7 days
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       400:
   *         $ref: '#/components/responses/BadRequest400'
   *       409:
   *         description: Email already exists
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: User already exists with this email address
   *                 suggestion:
   *                   type: string
   *                   example: Try logging in instead or use a different email
   *       429:
   *         $ref: '#/components/responses/TooManyRequests429'
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   *     security: []
   */
  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Login user
   *     description: Authenticate user with email and password, returns JWT tokens
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Login successful! Welcome back.
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     tokens:
   *                       $ref: '#/components/schemas/TokenResponse'
   *                     tokenInfo:
   *                       type: object
   *                       properties:
   *                         accessTokenExpiresIn:
   *                           type: string
   *                           example: 15 minutes
   *                         refreshTokenExpiresIn:
   *                           type: string
   *                           example: 7 days
   *                         device:
   *                           type: string
   *                           example: desktop
   *                         location:
   *                           type: string
   *                           example: ET
   *       400:
   *         $ref: '#/components/responses/BadRequest400'
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Invalid email or password
   *                 details:
   *                   type: string
   *                   example: 4 attempt(s) remaining before account lock
   *       423:
   *         description: Account locked
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Account is temporarily locked
   *                 details:
   *                   type: string
   *                   example: Too many failed login attempts. Try again in 30 minutes.
   *       429:
   *         $ref: '#/components/responses/TooManyRequests429'
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   *     security: []
   */
  /**
   * @swagger
   * /api/v1/auth/logout:
   *   post:
   *     summary: Logout user
   *     description: Revoke refresh token to logout user from current device
   *     tags: [Authentication]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [refreshToken]
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Refresh token to revoke
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Logged out successfully
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Refresh token is required
   *       401:
   *         $ref: '#/components/responses/Unauthorized401'
   *       404:
   *         description: Token not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Token not found or already revoked
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   */
  /**
   * @swagger
   * /api/v1/auth/logout-all:
   *   post:
   *     summary: Logout from all devices
   *     description: Revoke all refresh tokens for the authenticated user
   *     tags: [Authentication]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful from all devices
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Logged out from all devices successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     tokensRevoked:
   *                       type: number
   *                       example: 3
   *       401:
   *         $ref: '#/components/responses/Unauthorized401'
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   */
  /**
   * @swagger
   * /api/v1/auth/refresh-token:
   *   post:
   *     summary: Refresh access token
   *     description: Get new access token using refresh token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [refreshToken]
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Valid refresh token
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Token refreshed successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     tokens:
   *                       $ref: '#/components/schemas/TokenResponse'
   *                     tokenInfo:
   *                       type: object
   *                       properties:
   *                         accessTokenExpiresIn:
   *                           type: string
   *                           example: 15 minutes
   *                         refreshTokenExpiresIn:
   *                           type: string
   *                           example: 7 days
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Refresh token is required
   *       401:
   *         description: Invalid refresh token
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Invalid or expired refresh token
   *                 suggestion:
   *                   type: string
   *                   example: Please login again
   *       429:
   *         $ref: '#/components/responses/TooManyRequests429'
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   *     security: []
   */
  /**
   * @swagger
   * /api/v1/auth/forgot-password:
   *   post:
   *     summary: Request password reset
   *     description: Send password reset email to user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *     responses:
   *       200:
   *         description: Password reset email sent (even if email doesn't exist for security)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: If an account exists with this email, you will receive a password reset link
   *                 data:
   *                   type: object
   *                   properties:
   *                     email:
   *                       type: string
   *                       example: john@example.com
   *                     expiresIn:
   *                       type: string
   *                       example: 10 minutes
   *       400:
   *         $ref: '#/components/responses/BadRequest400'
   *       403:
   *         description: Account deactivated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Account is deactivated
   *                 suggestion:
   *                   type: string
   *                   example: Contact support to reactivate your account
   *       429:
   *         $ref: '#/components/responses/TooManyRequests429'
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   *     security: []
   */
  /**
   * @swagger
   * /api/v1/auth/reset-password/{token}:
   *   post:
   *     summary: Reset password with token
   *     description: Reset user password using token from email
   *     tags: [Authentication]
   *     parameters:
   *       - name: token
   *         in: path
   *         required: true
   *         description: Password reset token from email
   *         schema:
   *           type: string
   *           example: abc123def456ghi789jkl012mno345
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [password]
   *             properties:
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 6
   *                 example: NewPass123!
   *                 description: New password
   *     responses:
   *       200:
   *         description: Password reset successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Password reset successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     email:
   *                       type: string
   *                       example: john@example.com
   *                     passwordChangedAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid or expired token
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Invalid or expired reset token
   *                 suggestion:
   *                   type: string
   *                   example: Request a new password reset link
   *       429:
   *         $ref: '#/components/responses/TooManyRequests429'
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   *     security: []
   */
  /**
   * @swagger
   * /api/v1/auth/me:
   *   get:
   *     summary: Get current user profile
   *     description: Get profile information of authenticated user
   *     tags: [Authentication, Users]
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: User profile retrieved successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *       401:
   *         $ref: '#/components/responses/Unauthorized401'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: User not found
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   */
  /**
   * @swagger
   * /api/v1/auth/update-profile:
   *   put:
   *     summary: Update user profile
   *     description: Update profile information of authenticated user
   *     tags: [Authentication, Users]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 100
   *                 example: Updated Name
   *               phone:
   *                 type: string
   *                 example: +251922334455
   *               profileImage:
   *                 type: string
   *                 example: https://example.com/profile.jpg
   *               address:
   *                 type: object
   *                 properties:
   *                   street:
   *                     type: string
   *                     example: New Street
   *                   city:
   *                     type: string
   *                     example: New City
   *                   state:
   *                     type: string
   *                     example: New State
   *                   country:
   *                     type: string
   *                     example: Ethiopia
   *                   zipCode:
   *                     type: string
   *                     example: 2000
   *               preferences:
   *                 type: object
   *                 properties:
   *                   emailNotifications:
   *                     type: boolean
   *                     example: true
   *                   theme:
   *                     type: string
   *                     enum: [light, dark, auto]
   *                     example: dark
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Profile updated successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         $ref: '#/components/responses/BadRequest400'
   *       401:
   *         $ref: '#/components/responses/Unauthorized401'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: User not found
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   */
  /**
   * @swagger
   * /api/v1/auth/change-password:
   *   patch:
   *     summary: Change password
   *     description: Change password while logged in
   *     tags: [Authentication, Users]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [currentPassword, newPassword]
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 format: password
   *                 example: OldPass123!
   *                 description: Current password
   *               newPassword:
   *                 type: string
   *                 format: password
   *                 minLength: 6
   *                 example: NewPass123!
   *                 description: New password
   *               confirmPassword:
   *                 type: string
   *                 format: password
   *                 example: NewPass123!
   *                 description: Confirm new password (must match newPassword)
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Password changed successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     passwordChangedAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         $ref: '#/components/responses/BadRequest400'
   *       401:
   *         description: Current password incorrect
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: Current password is incorrect
   *       404:
   *         description: User not found
   *       500:
   *         $ref: '#/components/responses/InternalServerError500'
   */
  // ========================================
  // API INFORMATION
  // ========================================
  /**
   * @swagger
   * /:
   *   get:
   *     summary: API root
   *     description: Welcome endpoint with API information
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: API is running
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Authentication System API is running!
   *                 version:
   *                   type: string
   *                   example: 1.0.0
   *                 documentation:
   *                   type: string
   *                   example: http://localhost:3000/api-docs
   *                 environment:
   *                   type: string
   *                   example: development
   *                 database:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: Connected
   *                     name:
   *                       type: string
   *                       example: auth_system_db
   *                     host:
   *                       type: string
   *                       example: 127.0.0.1
   *                     port:
   *                       type: number
   *                       example: 27017
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
};

module.exports = swaggerDocs;
