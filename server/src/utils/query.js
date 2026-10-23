const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Anchored, lowercase prefix regex: MongoDB can answer it from an index. */
const prefix = (s) => new RegExp('^' + escapeRegex(s.trim().toLowerCase()));

const dateRange = (from, to) => {
  if (!from && !to) return undefined;
  const range = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) range.$lte = new Date(`${to}T23:59:59.999Z`);
  return range;
};

/** Runs the page query and the count in parallel. Always lean(). */
async function paginate(Model, filter, { page, limit, sort, select, populate }) {
  const q = Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit);
  if (select) q.select(select);
  if (populate) q.populate(populate);
  const [items, total] = await Promise.all([q.lean(), Model.countDocuments(filter)]);
  return { items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } };
}

module.exports = { prefix, dateRange, paginate };
