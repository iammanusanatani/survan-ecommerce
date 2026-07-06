// Shared validation + sanitization helpers used across all routes.
// Keeping these in one place means every endpoint checks input the same way.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s-]{6,18}$/; // digits, spaces, dashes, optional leading +
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function isValidEmail(str) {
  return typeof str === "string" && str.trim().length <= 254 && EMAIL_RE.test(str.trim());
}

function isValidPhone(str) {
  return typeof str === "string" && PHONE_RE.test(str.trim());
}

function isValidObjectId(str) {
  return typeof str === "string" && OBJECT_ID_RE.test(str);
}

function isNonEmptyString(val, { min = 1, max = 5000 } = {}) {
  return typeof val === "string" && val.trim().length >= min && val.trim().length <= max;
}

function isFiniteNumber(val, { min = -Infinity, max = Infinity } = {}) {
  return typeof val === "number" && Number.isFinite(val) && val >= min && val <= max;
}

// Strips any HTML/script tags from user-supplied free text before it is
// stored, so stored values can never execute as markup wherever they are
// later rendered (admin dashboard tables, review lists, etc.). Never apply
// this to passwords — those must be stored exactly as entered.
function sanitizeText(val) {
  if (typeof val !== "string") return val;
  return val.replace(/<[^>]*>/g, "").trim();
}

// Validates :id route params are a well-formed Mongo ObjectId before they
// ever reach a query — an malformed id would otherwise throw a raw
// CastError (500, with a stack trace) instead of a clean 400.
function requireValidId(paramName = "id") {
  return (req, res, next) => {
    if (!isValidObjectId(req.params[paramName])) {
      return res.status(400).json({ message: "Invalid id" });
    }
    next();
  };
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidObjectId,
  isNonEmptyString,
  isFiniteNumber,
  sanitizeText,
  requireValidId
};
