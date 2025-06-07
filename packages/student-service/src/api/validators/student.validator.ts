import Joi from 'joi';

export const createStudentSchema = Joi.object({
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  dateOfBirth: Joi.date().iso().required(),
  grade: Joi.string().required(),
  school: Joi.string().required(),
  parentId: Joi.string().required()
});

export const updateStudentSchema = Joi.object({
  firstName: Joi.string().min(2),
  lastName: Joi.string().min(2),
  dateOfBirth: Joi.date().iso(),
  grade: Joi.string(),
  school: Joi.string(),
  parentId: Joi.string()
});
