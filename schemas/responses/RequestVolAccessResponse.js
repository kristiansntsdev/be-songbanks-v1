module.exports = {
  202: {
    description: "Vol_user access request sent successfully. Awaiting admin approval.",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            code: {
              type: "integer",
              example: 202
            },
            message: {
              type: "string",
              example: "Vol_user access request sent successfully. Awaiting admin approval."
            },
            data: {
              type: "object",
              properties: {
                user_id: {
                  type: "string",
                  description: "The ID of the user requesting access",
                  example: "user123"
                },
                status: {
                  type: "string",
                  description: "The status of the request",
                  example: "request"
                }
              }
            }
          }
        }
      }
    }
  }
};