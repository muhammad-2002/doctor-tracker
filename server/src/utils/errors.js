class AppError extends Error {
  constructor(message, status = 500, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
module.exports = { AppError, asyncHandler };
