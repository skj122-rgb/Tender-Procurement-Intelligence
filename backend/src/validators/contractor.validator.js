const { z } = require('zod');

const contractorQuerySchema = z.object({
  body: z.object({}),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('10'),
    search: z.string().optional(),
  }),
  params: z.object({}),
});

module.exports = {
  contractorQuerySchema,
};
