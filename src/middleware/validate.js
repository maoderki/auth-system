const Codes = require("../constants/responseCodes");
const { fail } = require("../utils/response");

function validate(schema) {
  return function (req, res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return fail(
        res,
        Codes.AUTH_VALIDATION_ERROR,
        400,
        result.error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message,
        }))
      );
    }

    req.body = result.data;
    next();
  };
}

module.exports = validate;