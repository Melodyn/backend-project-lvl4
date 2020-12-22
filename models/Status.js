import * as yup from 'yup';
import objection from 'objection';

const { Model } = objection;

export class Status extends Model {
  static get tableName() {
    return 'statuses';
  }
}

export const statusFields = {
  name: yup.string().min(1).required(),
};

export const statusValidator = yup.object(statusFields).unknown(false).required();
