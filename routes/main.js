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
    method: 'POST',
    url: '/session',
    handler: async (req, res) => {
      const { email: emailValidator, password: passwordValidator } = userFields;
      const { data, errors = null } = await yup
        .object({
          data: yup
            .object({ email: emailValidator, password: passwordValidator })
            .required(),
        })
        .required()
        .validate(req.body, { abortEarly: false })
        .catch(({ inner }) => ({ errors: inner }));

      if (errors !== null) {
        req.auth.errors = errors
          .reduce((acc, { path, message }) => ({ ...acc, [path]: message }), {});
        return res.redirect('/session/new');
      }

      req.log.debug({ data, body: req.body });
      return res.redirect('/');
    },
  },
  {
    method: 'GET',
    url: '/session/new',
    handler: (req, res) => {
      res.view('signin', { path: 'signin', errors: req.auth.errors });
      req.auth.errors = {};
    },
  },
  {
    method: 'GET',
    url: '/users/new',
    handler: (req, res) => {
      res.view('signup', { path: 'signup', errors: req.auth.errors });
      req.auth.errors = {};
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
