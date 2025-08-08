# Swagger Generator Guide - Go-Style Annotations

This guide explains how to use Go-style JSDoc annotations to generate Swagger/OpenAPI documentation for your controllers.

## Overview

The Swagger generator scans your controller files for JSDoc comments and automatically generates:
- OpenAPI 3.0 specification (`swagger/swagger.json`)
- Express route definitions (`routes/api.js`)

## Basic Structure

```javascript
/**
 * @Summary Brief description of the endpoint
 * @Description Detailed description (optional)
 * @Tags TagName
 * @Accept application/json
 * @Produce application/json
 * @Param paramName location type required "description"
 * @Body {object} SchemaName "description"
 * @Success code {object} SchemaName "description"
 * @Failure code {object} ErrorSchemaName "description"
 * @Router /custom/path [method]
 * @auth
 */
static MethodName = ErrorHandler.asyncHandler(async (req, res) => {
  // implementation
});
```

## Annotation Reference

### Core Annotations

#### @Summary
Brief one-line description of the endpoint.
```javascript
/**
 * @Summary Get all tags with pagination
 */
```

#### @Description
Detailed description of what the endpoint does.
```javascript
/**
 * @Description Retrieves all available tags with support for search, pagination, and optional song counts
 */
```

#### @Tags
Groups endpoints in Swagger UI. Usually matches the resource name.
```javascript
/**
 * @Tags Tag
 */
```

### Content Type Annotations

#### @Accept
Specifies the request content type.
```javascript
/**
 * @Accept application/json
 */
```

#### @Produce
Specifies the response content type.
```javascript
/**
 * @Produce application/json
 */
```

### Parameter Annotations

#### @Param
Defines request parameters. Format: `name location type required "description"`

**Locations:**
- `path` - URL path parameter (e.g., `/users/:id`)
- `query` - Query string parameter (e.g., `?page=1`)
- `header` - HTTP header
- `body` - Request body (use @Body instead for objects)

**Types:**
- `string`, `integer`, `boolean`, `array`, `object`

**Examples:**
```javascript
/**
 * @Param id path string true "Tag ID"
 * @Param page query integer false "Page number for pagination" default(1)
 * @Param limit query integer false "Number of items per page" default(10)
 * @Param search query string false "Search term for tag names"
 * @Param withSongCount query boolean false "Include song count in response" default(false)
 * @Param Authorization header string true "Bearer token"
 */
```

**With Enums:**
```javascript
/**
 * @Param status query string false "Filter by status" enum:["active","inactive"]
 */
```

### Request Body

#### @Body
Defines the request body schema. Format: `{type} SchemaName "description"`

```javascript
/**
 * @Body {object} GetOrCreateTagRequest "Request body with tag name"
 */
```

The schema must exist in `/schemas/requests/SchemaName.js`

### Response Annotations

#### @Success
Defines successful responses. Format: `code {type} SchemaName "description"`

```javascript
/**
 * @Success 200 {object} TagsResponse "Successfully retrieved tags"
 * @Success 201 {object} TagResponse "Tag created successfully"
 */
```

#### @Failure
Defines error responses. Format: `code {type} ErrorSchemaName "description"`

```javascript
/**
 * @Failure 400 {object} BadRequestError "Invalid request parameters"
 * @Failure 404 {object} NotFoundError "Tag not found"
 * @Failure 500 {object} InternalServerError "Internal server error"
 */
```

### Routing and Authentication

#### @Router
Overrides the default route path and method. Format: `/path [method]`

```javascript
/**
 * @Router /tags/get-or-create [post]
 */
```

#### @auth
Marks the endpoint as requiring authentication.

```javascript
/**
 * @auth
 */
```

## Complete Examples

### Simple GET Endpoint

```javascript
/**
 * @Summary Get all tags
 * @Description Retrieve all available tags with pagination and search support
 * @Tags Tag
 * @Produce application/json
 * @Param page query integer false "Page number" default(1)
 * @Param limit query integer false "Items per page" default(10)
 * @Param search query string false "Search term"
 * @Param withSongCount query boolean false "Include song count" default(false)
 * @Success 200 {object} TagsResponse "Tags retrieved successfully"
 * @Failure 400 {object} BadRequestError "Bad request"
 * @Failure 500 {object} InternalServerError "Internal server error"
 * @Router /tags [get]
 */
static GetTags = ErrorHandler.asyncHandler(async (req, res) => {
  const result = await TagService.getAllTags(req.query);
  res.json({
    code: 200,
    message: "Tags retrieved successfully",
    data: result,
  });
});
```

### POST Endpoint with Request Body

```javascript
/**
 * @Summary Get or create tag
 * @Description Gets existing tag by name or creates a new one if it doesn't exist
 * @Tags Tag
 * @Accept application/json
 * @Produce application/json
 * @Body {object} GetOrCreateTagRequest "Request body with tag name"
 * @Success 200 {object} BaseResponseWithData "Tag retrieved or created successfully"
 * @Failure 400 {object} BadRequestError "Invalid request body"
 * @Failure 500 {object} InternalServerError "Internal server error"
 * @Router /tags/get-or-create [post]
 */
static GetOrCreateTag = ErrorHandler.asyncHandler(async (req, res) => {
  ErrorHandler.validateRequired(["name"], req.body);
  const result = await TagService.getOrCreateTag(req.body.name);
  res.json({
    code: 200,
    message: result.created ? "Tag created successfully" : "Tag retrieved successfully",
    data: result,
  });
});
```

### Authenticated Endpoint with Path Parameter

```javascript
/**
 * @Summary Update tag
 * @Description Update an existing tag by ID (Admin only)
 * @Tags Tag
 * @Accept application/json
 * @Produce application/json
 * @Param id path string true "Tag ID"
 * @Param Authorization header string true "Bearer token"
 * @Body {object} UpdateTagRequest "Updated tag data"
 * @Success 200 {object} TagResponse "Tag updated successfully"
 * @Failure 400 {object} BadRequestError "Invalid request"
 * @Failure 401 {object} UnauthorizedError "Authentication required"
 * @Failure 403 {object} ForbiddenError "Admin access required"
 * @Failure 404 {object} NotFoundError "Tag not found"
 * @Failure 500 {object} InternalServerError "Internal server error"
 * @Router /admin/tags/{id} [put]
 * @auth
 */
static UpdateTag = ErrorHandler.asyncHandler(async (req, res) => {
  const tag = await TagService.updateTag(req.params.id, req.body);
  res.json({
    code: 200,
    message: "Tag updated successfully",
    data: tag,
  });
});
```

## Schema Files

Create corresponding schema files in the appropriate directories:

### Request Schemas (`/schemas/requests/`)

**GetOrCreateTagRequest.js:**
```javascript
export default {
  type: "object",
  required: ["name"],
  properties: {
    name: {
      type: "string",
      example: "rock",
      description: "Name of the tag to get or create",
    },
  },
};
```

### Response Schemas (`/schemas/responses/`)

**TagsResponse.js:**
```javascript
export default {
  type: "object",
  properties: {
    code: {
      type: "integer",
      example: 200,
    },
    message: {
      type: "string",
      example: "Tags retrieved successfully",
    },
    data: {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: {
            $ref: "#/components/schemas/Tag",
          },
        },
        pagination: {
          $ref: "#/components/schemas/PaginationInfo",
        },
      },
    },
  },
};
```

## Commands

### Generate Documentation

```bash
# Generate for specific controller
npm run swagpress:generate-api-single generate TagController

# Generate for all controllers
npm run swagpress:generate-api generate all
```

### List Available Controllers

```bash
npm run swagpress:generate-api-single list
```

## Best Practices

1. **Consistent Tagging**: Use the same tag name for related endpoints (e.g., all tag operations use `@Tags Tag`)

2. **Complete Parameter Documentation**: Always include descriptions for parameters

3. **Proper Error Handling**: Document all possible error responses

4. **Schema Naming**: Use descriptive schema names that match the operation
   - `GetTagsRequest` for GET requests with parameters
   - `CreateTagRequest` for POST requests
   - `TagResponse` for single tag responses
   - `TagsResponse` for multiple tags responses

5. **Authentication**: Always add `@auth` for protected endpoints

6. **Custom Routes**: Use `@Router` when the default route generation doesn't match your needs

7. **Validation**: Keep JSDoc in sync with actual parameter validation in your controllers

## Troubleshooting

- **Schema not found**: Ensure schema files exist in the correct `/schemas/` subdirectories
- **Routes not generated**: Check that your method follows the `static MethodName = ErrorHandler.asyncHandler(...)` pattern
- **Missing request body**: Add `@Body` annotation to POST/PUT endpoints
- **Authentication not applied**: Ensure `@auth` annotation is present and authentication middleware is configured

## Generated Files

The generator updates two files:
- `swagger/swagger.json` - OpenAPI 3.0 specification
- `routes/api.js` - Express route definitions

Both files are completely regenerated each time, so don't manually edit them.