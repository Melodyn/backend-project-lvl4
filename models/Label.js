import * as yup from 'yup';
import objection from 'objection';

const { Model } = objection;

export class Label extends Model {
  static get tableName() {
    return 'labels';
  }
}

export const labelFields = {
  name: yup.string().min(1).required(),
};

export const labelValidator = yup.object(labelFields).unknown(false).required();
