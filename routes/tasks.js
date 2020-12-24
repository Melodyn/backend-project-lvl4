import Objection, { val } from 'objection';
import i18next from 'i18next';
import yup from 'yup';
import * as fastifyPass from 'fastify-passport';
import { Task, taskValidator, taskFields } from '../models/Task.js';
import { Status } from '../models/Status.js';
import { User } from '../models/User.js';

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
      const task = await Task.query().withGraphFetched('[status, creator, executor]')
        .findById(req.params.id);

      const statuses = await Status.query();
      const executors = await User.query();
      const labels = [];

      return res.view('tasksForm', {
        path: 'tasks/edit', values: task, statuses, executors, labels,
      });
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
    handler: async (req, res) => {
      const statuses = await Status.query();
      const executors = await User.query();
      const labels = [];
      res.view('tasksForm', {
        path: 'tasks/new', statuses, executors, labels,
      });
    },
  },
  {
    method: 'GET',
    url: '/tasks',
    handler: async (req, res) => {
      const tasks = await Task.query().withGraphFetched('[status, creator, executor]');
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

      const filledFields = Object.fromEntries(Object
        .entries(req.body.data)
        .filter(([, value]) => !!value));
      filledFields.creatorId = req.user.id;

      return Task.query().insert(filledFields)
        .then(() => {
          req.flash('flash', [{ type: 'success', text: i18next.t('task.action.create.success') }]);
          return res.redirect('/tasks');
        })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.create.error') }]);
            return res.redirect('/tasks');
          }
          req.log.error(err);
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
      const isValid = await yup.object({
        ...taskFields,
        name: taskFields.name.optional(),
        statusId: taskFields.statusId.optional(),
      }).required()
        .unknown(false)
        .isValid(req.body.data);

      if (!isValid) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
        return res.redirect('/tasks');
      }

      const filledFields = Object.fromEntries(Object
        .entries(req.body.data)
        .filter(([, value]) => !!value));

      await Task.query().update(filledFields).where({ id: req.params.id })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
            return res.redirect('/tasks');
          }
          req.log.error(err);
          req.flash('flash', [{ type: 'error', text: err.message }]);
          return res.redirect('/');
        });
      req.flash('flash', [{ type: 'success', text: i18next.t('task.action.edit.success') }]);
      return res.redirect('/tasks');
    },
  },
];

export default routes;
