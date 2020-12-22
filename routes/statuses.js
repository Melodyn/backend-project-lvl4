import Objection from 'objection';
import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import * as fastifyPass from 'fastify-passport';
import { Status, statusValidator, statusFields } from '../models/Status.js';

const fastifyPassport = fastifyPass.default.default || fastifyPass.default;
const { UniqueViolationError } = Objection;

/**
 * @type {import('fastify').RouteOptions[]}
 */
const routes = [
  {
    method: 'GET',
    url: '/statuses/:id/edit',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.edit.error') }]);
        res.redirect('/statuses');
      }
    }),
    handler: async (req, res) => {
      res.view('statuses', { path: 'statuses', statuses: [] });
    },
  },
  {
    method: 'GET',
    url: '/statuses/new',
    handler: (req, res) => {
      res.view('statuses', { path: 'statuses', statuses: [] });
    },
  },
  {
    method: 'GET',
    url: '/statuses',
    handler: async (req, res) => {
      const statuses = await Status.query().where(req.query);
      res.view('statuses', { path: 'statuses', statuses });
    },
  },
  {
    method: 'DELETE',
    url: '/statuses/:id',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.delete.error') }]);
        res.redirect('/statuses');
      }
    }),
    handler: async (req, res) => {
      await Status.query().deleteById(req.params.id);
      req.flash('flash', [{ type: 'success', text: i18next.t('status.action.delete.success') }]);
      res.redirect('/statuses');
    },
  },
  {
    method: 'POST',
    url: '/statuses',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.edit.error') }]);
        res.redirect('/statuses');
      }
    }),
    handler: async (req, res) => {
      const { statusData, errors, values } = await statusValidator
        .validate(req.body.data, { abortEarly: false })
        .then((status) => ({ statusData: status, errors: null, values: {} }))
        .catch((err) => {
          const innerErrors = err.inner.map(({ path }) => ([path, i18next.t(`signup.error.${path}`)]));
          const innerValues = _.toPairs(err.value).map(([path, value]) => ([path, value]));
          return {
            statusData: null,
            errors: _.fromPairs(innerErrors),
            values: _.fromPairs(innerValues),
          };
        });

      if (errors) {
        req.flash('error', errors);
        req.flash('value', values);
        return res.redirect('/statuses/new');
      }

      return Status.query().insert(statusData)
        .then(() => {
          req.flash('flash', [{ type: 'success', text: i18next.t('signup.success') }]);
          return res.redirect('/');
        })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('error', { email: i18next.t('signup.error.email_exists', { email: statusData.email }) });
            return res.redirect('/statuses/new');
          }
          req.flash('flash', [{ type: 'error', text: err.message }]);
          return res.redirect('/');
        });
    },
  },
  {
    method: 'PATCH',
    url: '/statuses/:id',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.edit.error') }]);
        res.redirect('/statuses');
      }
    }),
    handler: async (req, res) => {
      const { updatedData, errors, values } = await statusValidator
        .validate(req.body.data, { abortEarly: false })
        .then((status) => ({ updatedData: status, errors: null, values: {} }))
        .catch((err) => {
          const innerErrors = err.inner.map(({ path }) => ([path, i18next.t(`signup.error.${path}`)]));
          const innerValues = _.toPairs(err.value).map(([path, value]) => ([path, value]));
          return {
            updatedData: null,
            errors: _.fromPairs(innerErrors),
            values: _.fromPairs(innerValues),
          };
        });

      if (errors) {
        req.flash('error', errors);
        req.flash('value', values);
        return res.redirect(`/statuses/${req.params.id}/edit`);
      }

      await Status.query().update(updatedData).where({ id: req.params.id });
      req.flash('flash', [{ type: 'success', text: i18next.t('status.action.edit.success') }]);
      return res.redirect('/statuses');
    },
  },
];

export default routes;
