import crypto from 'crypto';
import yup from 'yup';
import objection from 'objection';

const { Model } = objection;

export class User extends Model {
  static get tableName() {
    return 'users';
  }

  static beforeInsert(queryContext) {
    queryContext.inputItems.forEach((item) => {
      item.password = this.hashPassword(item.password);
    });
  }

  static beforeUpdate(queryContext) {
    queryContext.inputItems.forEach((item) => {
      item.password = this.hashPassword(item.password);
    });
  }

  static hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

export const userFields = {
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  password: yup.string().required(),
  email: yup.string().email().required(),
};

export const userValidator = yup.object(userFields).required();
