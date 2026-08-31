const { z } = require('zod');

const tenderQuerySchema = z.object({
  state: z.string().optional(),
  department: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(20),
});

module.exports = {
  tenderQuerySchema,
};
