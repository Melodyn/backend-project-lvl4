import Objection from 'objection';
import _ from 'lodash';
import i18next from 'i18next';
import * as fastifyPass from 'fastify-passport';
import { Status, statusValidator } from '../models/Status.js';

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
      const status = await Status.query().findById(req.params.id);
      res.view('statusesForm', { path: 'statuses/edit', values: status });
    },
  },
  {
    method: 'GET',
    url: '/statuses/new',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.edit.error') }]);
        res.redirect('/statuses');
      }
    }),
    handler: (req, res) => {
      res.view('statusesForm', { path: 'statuses/new' });
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
        req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.create.error') }]);
        res.redirect('/statuses');
      }
    }),
    handler: async (req, res) => {
      const isValid = await statusValidator
        .isValid(req.body.data, { abortEarly: false });

      if (!isValid) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.create.error') }]);
        return res.redirect('/statuses');
      }

      return Status.query().insert(req.body.data)
        .then(() => {
          req.flash('flash', [{ type: 'success', text: i18next.t('status.action.create.success') }]);
          return res.redirect('/statuses');
        })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.create.error') }]);
            return res.redirect('/statuses');
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
      const isValid = await statusValidator
        .isValid(req.body.data, { abortEarly: false });

      if (!isValid) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.edit.error') }]);
        return res.redirect('/statuses');
      }

      await Status.query().update(req.body.data).where({ id: req.params.id })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('flash', [{ type: 'warning', text: i18next.t('status.action.edit.error') }]);
            return res.redirect('/statuses');
          }
          req.flash('flash', [{ type: 'error', text: err.message }]);
          return res.redirect('/');
        });
      req.flash('flash', [{ type: 'success', text: i18next.t('status.action.edit.success') }]);
      return res.redirect('/statuses');
    },
  },
];

export default routes;
