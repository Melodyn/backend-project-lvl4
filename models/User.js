import crypto from 'crypto';
import yup from 'yup';
import { Model } from 'objection';

export class User extends Model {
  static get tableName() {
    return 'users';
  }

  static beforeInsert(queryContext) {
    queryContext.inputItems.forEach((item) => {
      item.password = crypto.createHash('sha256').update(item.password).digest('hex');
    });
  }
}

export const userValidator = yup.object({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  password: yup.string().required(),
  email: yup.string().email().required(),
}).required();
