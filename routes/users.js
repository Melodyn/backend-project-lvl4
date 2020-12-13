import { constants } from 'http2';
import Objection from 'objection';
import _ from 'lodash';
import i18next from 'i18next';
import { User, userValidator } from '../models/User.js';

const { UniqueViolationError } = Objection;

/**
 * @type {import('fastify').RouteOptions[]}
 */
const routes = [
  {
    method: 'GET',
    url: '/users',
    handler: async (req, res) => {
      const users = await User.query().where(req.query);
      res.view('users', { users, path: 'users' });
    },
  },
  {
    method: 'GET',
    url: '/users/:id/edit',
    handler: async (req, res) => {
      const { firstName, lastName, email } = await User.query().findById(req.params.id);
      res.view('signup', {
        path: 'users',
        firstName,
        lastName,
        email,
        errors: {},
      });
    },
  },
  {
    method: 'POST',
    url: '/users',
    handler: async (req, res) => {
      const { userData, errors, values } = await userValidator
        .validate(req.body.data, { abortEarly: false })
        .then((user) => ({ userData: user, errors: null, values: {} }))
        .catch((err) => {
          const innerErrors = err.inner.map(({ path }) => ([path, i18next.t(`signup.${path}`)]));
          const innerValues = _.toPairs(err.value).map(([path, value]) => ([path, value]));
          return {
            userData: null,
            errors: _.fromPairs(innerErrors),
            values: _.fromPairs(innerValues),
          };
        });

      if (errors) {
        req.flash('error', errors);
        req.flash('values', values);
        return res.redirect('/users/new');
      }

      return User.query().insert(userData)
        .then(() => {
          req.flash('flash', [{ type: 'success', text: i18next.t('signup.signed') }]);
          return res.redirect('/session/new');
        });
      // .catch((err) => { // TODO: доделать обработку ошибок
      //   if (err instanceof UniqueViolationError) {
      //     res
      //       .code(constants.HTTP_STATUS_BAD_REQUEST)
      //       .send(`"email ${userData.email}" already exists`);
      //   } else {
      //     res
      //       .code(constants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
      //       .send(err.message);
      //   }
      // });
    },
  },
  {
    method: 'PATCH',
    url: '/users/:id',
    handler: async (req, res) => {
      if (!req.auth.isAuthorized) {
        res.code(constants.HTTP_STATUS_UNAUTHORIZED)
          .send('Access denied');
        return;
      }
      const updatedData = await userValidator.validate(req.body);
      await User.query().update(updatedData).where({ id: req.auth.user.id });
      res.code(constants.HTTP_STATUS_NO_CONTENT).send();
    },
  },
];

export default routes;
