import crypto from 'crypto';
import * as yup from 'yup';
import objection from 'objection';

const { Model } = objection;

export class User extends Model {
  static get tableName() {
    return 'users';
  }

  static hashHook(queryContext) {
    queryContext.inputItems.forEach((item) => {
      if (item.password) {
        item.password = this.hashPassword(item.password);
      }
    });
  }

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  static beforeInsert(queryContext) {
    this.hashHook(queryContext);
  }

  static beforeUpdate(queryContext) {
    this.hashHook(queryContext);
  }

  static hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}

export const userFields = {
  firstName: yup.string().min(1).required(),
  lastName: yup.string().min(1).required(),
  password: yup.string().min(1).required(),
  email: yup.string().email().required(),
};

export const userValidator = yup.object(userFields).unknown(false).required();
