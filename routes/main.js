import yup from 'yup';
import { constants } from 'http2';
import { User, userFields } from '../models/User.js';

/**
 * @type {import('fastify').RouteOptions[]}
 */
const routes = [
  {
    method: 'POST',
    url: '/login',
    handler: async (req, res) => {
      const { email: emailValidator, password: passwordValidator } = userFields;
      const { email, password } = await yup
        .object({ email: emailValidator, password: passwordValidator })
        .required()
        .validate(req.body);
      const [user] = await User.query().where({ email });

      if (!user) {
        res.code(constants.HTTP_STATUS_UNAUTHORIZED)
          .send(`Not found user with email '${email}'`);
        return;
      }
      if (user.password !== User.hashPassword(password)) {
        res.code(constants.HTTP_STATUS_UNAUTHORIZED)
          .send('Incorrect password');
        return;
      }
      res
        .setCookie('token', user.password, {
          path: '/',
        })
        .setCookie('id', user.id, {
          path: '/',
        })
        .send(user.password);
    },
  },
  {
    method: 'GET',
    url: '/',
    handler: (req, res) => {
      res.view('main');
    },
  },
];

export default routes;
