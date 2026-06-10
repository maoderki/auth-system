function success(res, code, data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    code,
    data,
  });
}

function fail(res, code, status = 400, errors = []) {
  return res.status(status).json({
    success: false,
    code,
    errors,
  });
}

module.exports = {
  success,
  fail,
};