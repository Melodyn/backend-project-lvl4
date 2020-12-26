import Objection from 'objection';
import i18next from 'i18next';
import * as fastifyPass from 'fastify-passport';
import { Label, labelValidator } from '../models/Label.js';

const fastifyPassport = fastifyPass.default.default || fastifyPass.default;
const { UniqueViolationError } = Objection;

/**
 * @type {import('fastify').RouteOptions[]}
 */
const routes = [
  {
    method: 'GET',
    url: '/labels/:id/edit',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('label.action.edit.error') }]);
        res.redirect('/labels');
      }
    }),
    handler: async (req, res) => {
      const label = await Label.query().findById(req.params.id);
      res.view('labelsForm', { path: 'labels/edit', values: label });
    },
  },
  {
    method: 'GET',
    url: '/labels/new',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('label.action.edit.error') }]);
        res.redirect('/labels');
      }
    }),
    handler: (req, res) => {
      res.view('labelsForm', { path: 'labels/new' });
    },
  },
  {
    method: 'GET',
    url: '/labels',
    handler: async (req, res) => {
      const labels = await Label.query().where(req.query);
      res.view('labels', { path: 'labels', labels });
    },
  },
  {
    method: 'DELETE',
    url: '/labels/:id',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('label.action.delete.error') }]);
        res.redirect('/labels');
      }
    }),
    handler: async (req, res) => {
      await Label.query().deleteById(req.params.id);
      req.flash('flash', [{ type: 'success', text: i18next.t('label.action.delete.success') }]);
      res.redirect('/labels');
    },
  },
  {
    method: 'POST',
    url: '/labels',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('label.action.create.error') }]);
        res.redirect('/labels');
      }
    }),
    handler: async (req, res) => {
      const isValid = await labelValidator
        .isValid(req.body.data, { abortEarly: false });

      if (!isValid) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('label.action.create.error') }]);
        return res.redirect('/labels');
      }

      return Label.query().insert(req.body.data)
        .then(() => {
          req.flash('flash', [{ type: 'success', text: i18next.t('label.action.create.success') }]);
          return res.redirect('/labels');
        })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('flash', [{ type: 'warning', text: i18next.t('label.action.create.error') }]);
            return res.redirect('/labels');
          }
          req.flash('flash', [{ type: 'error', text: err.message }]);
          return res.redirect('/');
        });
    },
  },
  {
    method: 'PATCH',
    url: '/labels/:id',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('label.action.edit.error') }]);
        res.redirect('/labels');
      }
    }),
    handler: async (req, res) => {
      const isValid = await labelValidator
        .isValid(req.body.data, { abortEarly: false });

      if (!isValid) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('label.action.edit.error') }]);
        return res.redirect('/labels');
      }

      await Label.query().update(req.body.data).where({ id: req.params.id })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('flash', [{ type: 'warning', text: i18next.t('label.action.edit.error') }]);
            return res.redirect('/labels');
          }
          req.flash('flash', [{ type: 'error', text: err.message }]);
          return res.redirect('/');
        });
      req.flash('flash', [{ type: 'success', text: i18next.t('label.action.edit.success') }]);
      return res.redirect('/labels');
    },
  },
];

export default routes;
