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
    url: '/users/:id/edit',
    handler: async (req, res) => {
      if (req.isAuthenticated() && (parseFloat(req.params.id) === req.user.id)) {
        const user = await User.query().findById(req.params.id);
        res.view('signup', { path: 'users', ...user });
      } else {
        req.flash('flash', [{ type: 'warning', text: i18next.t('user.action.edit.error') }]);
        res.redirect('/users');
      }
    },
  },
  {
    method: 'GET',
    url: '/users/new',
    handler: (req, res) => {
      res.view('signup', { path: 'signup' });
    },
  },
  {
    method: 'GET',
    url: '/users',
    handler: async (req, res) => {
      const users = await User.query().where(req.query);
      res.view('users', { path: 'users', users });
    },
  },
  {
    method: 'DELETE',
    url: '/users/:id',
    handler: async (req, res) => {
      if (req.isAuthenticated() && (parseFloat(req.params.id) === req.user.id)) {
        await User.query().deleteById(req.user.id);
        req.logOut();
        req.flash('flash', [{ type: 'success', text: i18next.t('user.action.delete.success') }]);
        res.redirect('/');
      } else {
        req.flash('flash', [{ type: 'warning', text: i18next.t('user.action.delete.error') }]);
        res.redirect('/users');
      }
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
          const innerErrors = err.inner.map(({ path }) => ([path, i18next.t(`signup.error.${path}`)]));
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
          req.flash('flash', [{ type: 'success', text: i18next.t('signup.success') }]);
          return res.redirect('/session/new');
        })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('error', { email: i18next.t('signup.error.email_exists', { email: userData.email }) });
            return res.redirect('/session/new');
          }
          req.flash('flash', [{ type: 'error', text: err.message }]);
          return res.redirect('/');
        });
    },
  },
  {
    method: 'PATCH',
    url: '/users/:id',
    handler: async (req, res) => {
      // TODO: переделать редактирование
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
