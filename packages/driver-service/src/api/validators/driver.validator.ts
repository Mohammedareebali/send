import Joi from 'joi';

const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const createDriverSchema = Joi.object({
  callNumber: Joi.string().required(),
  pdaPassword: Joi.string().optional(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  gender: Joi.string().required(),
  dateOfBirth: Joi.date().less('now').required(),
  addressLine1: Joi.string().required(),
  addressLine2: Joi.string().allow('', null),
  postcode: Joi.string().pattern(postcodeRegex).required(),
  phoneNumber: Joi.string().pattern(phoneRegex).required(),
  email: Joi.string().email().required(),
  licenseNumber: Joi.string().required(),
  licenseExpiryDate: Joi.date().min('now').required(),
  dbsNumber: Joi.string().required(),
  dbsExpiryDate: Joi.date().min('now').required(),
  medicalExpiryDate: Joi.date().min('now').optional(),
  rentalExpiryDate: Joi.date().min('now').optional(),
  currentRunId: Joi.string().optional()
});

export const updateDriverSchema = createDriverSchema.fork(
  [
    'callNumber',
    'firstName',
    'lastName',
    'gender',
    'dateOfBirth',
    'addressLine1',
    'postcode',
    'phoneNumber',
    'email',
    'licenseNumber',
    'licenseExpiryDate',
    'dbsNumber',
    'dbsExpiryDate'
  ], schema => schema.optional()
);
