import * as yup from 'yup';
import objection from 'objection';

const { Model } = objection;

export class Task extends Model {
  static get tableName() {
    return 'tasks';
  }
}

export const taskFields = {
  name: yup.string().min(1).required(),
  description: yup.string().default('').optional(),
  status_id: yup.number().min(1).required(),
  creator_id: yup.number().min(1).required(),
  executor_id: yup.number().min(1).optional(),
};

export const taskValidator = yup.object(taskFields).unknown(false).required();
