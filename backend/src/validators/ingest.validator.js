const { z } = require('zod');

const uploadSchema = z.object({
  body: z.object({
    dataSource: z.string().optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

module.exports = {
  uploadSchema,
};
