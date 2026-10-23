/** validate(schema, 'body' | 'query' | 'params') -> parsed data on req.valid[source]. ZodErrors go to the error handler. */
module.exports = (schema, source = 'body') => (req, _res, next) => {
  req.valid = req.valid || {};
  req.valid[source] = schema.parse(req[source]);
  next();
};
