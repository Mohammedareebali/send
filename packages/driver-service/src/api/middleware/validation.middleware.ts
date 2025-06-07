import { ValidationService } from '@send/shared';
import { createDriverSchema, updateDriverSchema } from '../validators/driver.validator';

const validator = ValidationService.getInstance();

export const validateCreateDriver = validator.validateRequest(createDriverSchema);
export const validateUpdateDriver = validator.validateRequest(updateDriverSchema);
