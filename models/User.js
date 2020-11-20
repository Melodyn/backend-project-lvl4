import yup from 'yup';
import { Model } from 'objection';

export default class User extends Model {
  static get tableName() {
    return 'users';
  }
}

export const userValidator = yup.object({
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  password: yup.string().required(),
  email: yup.string().email().required(),
}).required();
