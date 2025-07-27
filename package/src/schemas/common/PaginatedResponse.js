module.exports = {
  allOf: [
    {
      $ref: "#/components/schemas/BaseResponse"
    },
    {
      type: "object",
      properties: {
        data: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object"
              }
            },
            pagination: {
              type: "object",
              properties: {
                currentPage: {
                  type: "integer",
                  example: 1
                },
                totalPages: {
                  type: "integer",
                  example: 10
                },
                totalItems: {
                  type: "integer",
                  example: 100
                },
                itemsPerPage: {
                  type: "integer",
                  example: 10
                },
                hasNextPage: {
                  type: "boolean",
                  example: true
                },
                hasPrevPage: {
                  type: "boolean",
                  example: false
                }
              }
            }
          }
        }
      }
    }
  ]
};