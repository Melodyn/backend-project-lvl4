import Objection from 'objection';
import i18next from 'i18next';
import * as fastifyPass from 'fastify-passport';
import { Task, taskValidator } from '../models/Task.js';

const fastifyPassport = fastifyPass.default.default || fastifyPass.default;
const { UniqueViolationError } = Objection;

/**
 * @type {import('fastify').RouteOptions[]}
 */
const routes = [
  {
    method: 'GET',
    url: '/tasks/:id/edit',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
        res.redirect('/tasks');
      }
    }),
    handler: async (req, res) => {
      const task = await Task.query().findById(req.params.id);
      res.view('tasksForm', { path: 'tasks/edit', values: task });
    },
  },
  {
    method: 'GET',
    url: '/tasks/new',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
        res.redirect('/tasks');
      }
    }),
    handler: (req, res) => {
      res.view('tasksForm', { path: 'tasks/new' });
    },
  },
  {
    method: 'GET',
    url: '/tasks',
    handler: async (req, res) => {
      const tasks = await Task.query().where(req.query);
      res.view('tasks', { path: 'tasks', tasks });
    },
  },
  {
    method: 'DELETE',
    url: '/tasks/:id',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.delete.error') }]);
        res.redirect('/tasks');
      }
    }),
    handler: async (req, res) => {
      await Task.query().deleteById(req.params.id);
      req.flash('flash', [{ type: 'success', text: i18next.t('task.action.delete.success') }]);
      res.redirect('/tasks');
    },
  },
  {
    method: 'POST',
    url: '/tasks',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.create.error') }]);
        res.redirect('/tasks');
      }
    }),
    handler: async (req, res) => {
      const isValid = await taskValidator
        .isValid(req.body.data, { abortEarly: false });

      if (!isValid) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.create.error') }]);
        return res.redirect('/tasks');
      }

      return Task.query().insert(req.body.data)
        .then(() => {
          req.flash('flash', [{ type: 'success', text: i18next.t('task.action.create.success') }]);
          return res.redirect('/tasks');
        })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.create.error') }]);
            return res.redirect('/tasks');
          }
          req.flash('flash', [{ type: 'error', text: err.message }]);
          return res.redirect('/');
        });
    },
  },
  {
    method: 'PATCH',
    url: '/tasks/:id',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
        res.redirect('/tasks');
      }
    }),
    handler: async (req, res) => {
      const isValid = await taskValidator
        .isValid(req.body.data, { abortEarly: false });

      if (!isValid) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
        return res.redirect('/tasks');
      }

      await Task.query().update(req.body.data).where({ id: req.params.id })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
            return res.redirect('/tasks');
          }
          req.flash('flash', [{ type: 'error', text: err.message }]);
          return res.redirect('/');
        });
      req.flash('flash', [{ type: 'success', text: i18next.t('task.action.edit.success') }]);
      return res.redirect('/tasks');
    },
  },
];

export default routes;
