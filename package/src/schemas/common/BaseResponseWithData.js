export default {
  allOf: [
    {
      $ref: "#/components/schemas/BaseResponse",
    },
    {
      type: "object",
      properties: {
        data: {
          type: "object",
          description: "Response data payload",
        },
      },
    },
  ],
};
