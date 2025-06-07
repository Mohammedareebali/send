import { ValidationService } from '@send/shared';
import { createStudentSchema, updateStudentSchema } from '../validators/student.validator';

const validator = ValidationService.getInstance();

export const validateCreateStudent = validator.validateRequest(createStudentSchema);
export const validateUpdateStudent = validator.validateRequest(updateStudentSchema);
