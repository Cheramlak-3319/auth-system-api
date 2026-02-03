// ========================================
// FILE: src/utils/swaggerGenerator.js
// DESC: Generate Swagger/OpenAPI specification from JSDoc comments
// ========================================

const swaggerJsdoc = require("swagger-jsdoc");
const { SWAGGER_OPTIONS } = require("../config/swagger");
const swaggerDocs = require("../docs/setup.js");

/**
 * Generate OpenAPI specification from JSDoc comments
 * @returns {Object} OpenAPI specification
 */
const generateSwaggerSpec = () => {
  try {
    console.log("📚 Generating Swagger/OpenAPI specification...");

    // Files to scan for JSDoc comments
    const jsdocOptions = {
      definition: SWAGGER_OPTIONS,
      apis: [
        "./src/routes/*.js",
        "./src/controllers/*.js",
        "./src/models/*.js",
        "./src/docs/**/*.js",
      ],
    };

    // Generate specification
    const swaggerSpec = swaggerJsdoc(jsdocOptions);

    // Add custom paths from our documentation
    if (swaggerDocs) {
      // You could merge custom documentation here if needed
      // Currently, we rely on JSDoc comments in source files
    }

    // Validate the generated spec
    validateSwaggerSpec(swaggerSpec);

    console.log("✅ Swagger specification generated successfully");
    console.log(`📊 Paths: ${Object.keys(swaggerSpec.paths || {}).length}`);
    console.log(`📋 Tags: ${swaggerSpec.tags?.length || 0}`);
    console.log(
      `📄 Schemas: ${Object.keys(swaggerSpec.components?.schemas || {}).length}`,
    );

    return swaggerSpec;
  } catch (error) {
    console.error("❌ Error generating Swagger specification:", error);
    throw error;
  }
};

/**
 * Validate Swagger specification
 * @param {Object} spec - OpenAPI specification
 */
const validateSwaggerSpec = (spec) => {
  // Basic validation
  if (!spec.openapi || !spec.info || !spec.paths) {
    throw new Error("Invalid Swagger specification: missing required fields");
  }

  // Check OpenAPI version
  if (!spec.openapi.startsWith("3.")) {
    console.warn(
      `⚠️  OpenAPI version ${spec.openapi} may not be fully supported`,
    );
  }

  // Log summary
  console.log("\n📋 Swagger Specification Summary:");
  console.log("─────────────────────────────");
  console.log(`OpenAPI Version: ${spec.openapi}`);
  console.log(`Title: ${spec.info.title}`);
  console.log(`Version: ${spec.info.version}`);
  console.log(
    `Description length: ${spec.info.description?.length || 0} chars`,
  );
  console.log(`Servers: ${spec.servers?.length || 0}`);
  console.log(`Paths: ${Object.keys(spec.paths).length}`);
  console.log(`Tags: ${spec.tags?.map((t) => t.name).join(", ") || "None"}`);
  console.log(
    `Security Schemes: ${Object.keys(spec.components?.securitySchemes || {}).length}`,
  );
  console.log(`Schemas: ${Object.keys(spec.components?.schemas || {}).length}`);
  console.log(
    `Responses: ${Object.keys(spec.components?.responses || {}).length}`,
  );
  console.log("─────────────────────────────\n");
};

/**
 * Export OpenAPI specification as JSON file
 * @param {string} outputPath - Path to save the specification
 */
const exportSwaggerSpec = (outputPath = "./swagger.json") => {
  try {
    const fs = require("fs");
    const path = require("path");

    const spec = generateSwaggerSpec();
    const jsonSpec = JSON.stringify(spec, null, 2);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(outputPath, jsonSpec);

    console.log(`✅ Swagger specification exported to: ${outputPath}`);
    console.log(
      `📄 File size: ${(Buffer.byteLength(jsonSpec, "utf8") / 1024).toFixed(2)} KB`,
    );

    return outputPath;
  } catch (error) {
    console.error("❌ Error exporting Swagger specification:", error);
    throw error;
  }
};

/**
 * Generate Swagger UI HTML
 * @returns {string} HTML for Swagger UI
 */
const generateSwaggerUIHTML = () => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${SWAGGER_OPTIONS.info.title} - API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css">
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@4.5.0/favicon-32x32.png">
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    
    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }
    
    body {
      margin: 0;
      background: #fafafa;
    }
    
    .swagger-ui .topbar {
      display: none;
    }
    
    .info-container {
      max-width: 1460px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .api-info {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .api-info h1 {
      margin-top: 0;
      color: #3b4151;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    
    .badge-primary {
      background: #49cc90;
      color: white;
    }
    
    .badge-secondary {
      background: #61affe;
      color: white;
    }
    
    .badge-warning {
      background: #fca130;
      color: white;
    }
    
    .badge-danger {
      background: #f93e3e;
      color: white;
    }
  </style>
</head>
<body>
  <div class="info-container">
    <div class="api-info">
      <h1>${SWAGGER_OPTIONS.info.title} <span style="font-size: 16px; color: #666;">v${SWAGGER_OPTIONS.info.version}</span></h1>
      <p>${SWAGGER_OPTIONS.info.description?.split("\n")[0] || "API Documentation"}</p>
      
      <div style="margin: 20px 0;">
        <span class="badge badge-primary">OpenAPI ${SWAGGER_OPTIONS.openapi}</span>
        <span class="badge badge-secondary">JWT Authentication</span>
        <span class="badge badge-warning">Rate Limiting</span>
        <span class="badge badge-danger">Production Ready</span>
      </div>
      
      <div style="font-size: 14px; color: #666;">
        <p><strong>Base URL:</strong> ${SWAGGER_OPTIONS.servers[0].url}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || "development"}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
  
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        validatorUrl: null,
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true
      });
      
      window.ui = ui;
    };
  </script>
</body>
</html>
  `;
};

module.exports = {
  generateSwaggerSpec,
  exportSwaggerSpec,
  generateSwaggerUIHTML,
  validateSwaggerSpec,
};
