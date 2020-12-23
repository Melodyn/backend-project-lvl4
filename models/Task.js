import * as yup from 'yup';
import objection from 'objection';

const { Model, snakeCaseMappers } = objection;

export class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }
}

export const taskFields = {
  name: yup.string().min(1).required(),
  description: yup.string().default('').optional(),
  statusId: yup.number().min(1).required(),
  executorId: yup.number().min(1).optional(),
};

export const taskValidator = yup.object(taskFields).unknown(false).required();
