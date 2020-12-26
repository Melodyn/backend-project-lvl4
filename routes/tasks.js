import Objection from 'objection';
import i18next from 'i18next';
import _ from 'lodash';
import * as yup from 'yup';
import * as fastifyPass from 'fastify-passport';
import { Task, taskValidator, taskFields } from '../models/Task.js';
import { Status } from '../models/Status.js';
import { User } from '../models/User.js';
import { Label } from '../models/Label.js';

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
      const task = await Task.query()
        .withGraphFetched('[status, creator, executor, labels]')
        .findById(req.params.id);

      const statuses = await Status.query();
      const executors = await User.query();
      const labels = await Label.query();

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
      const labels = await Label.query();
      res.view('tasksForm', {
        path: 'tasks/new', statuses, executors, labels,
      });
    },
  },
  {
    method: 'GET',
    url: '/tasks',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
        res.redirect('/tasks');
      }
    }),
    handler: async (req, res) => {
      const query = req.query || {};
      const tasksBase = Task.query()
        .modify('query.isCreatorUser', query.isCreatorUser ? req.user.id : null)
        .modify('query.status', query.status)
        .modify('query.executor', query.executor);
      const extra = query.label
        ? tasksBase.whereExists(
          Task.relatedQuery('labels').where('labelId', query.label),
        )
        : tasksBase;
      const tasks = await extra.withGraphFetched('[status, creator, executor, labels]');

      const statuses = await Status.query();
      const executors = await User.query();
      const labels = await Label.query();
      res.view('tasks', {
        path: 'tasks', tasks, statuses, executors, labels, query,
      });
    },
  },
  {
    method: 'GET',
    url: '/tasks/:id',
    preValidation: fastifyPassport.authenticate('local', {}, (req, res) => {
      if (!(req.isAuthenticated())) {
        req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
        res.redirect('/tasks');
      }
    }),
    handler: async (req, res) => {
      const task = await Task.query()
        .findById(req.params.id)
        .withGraphFetched('[status, creator, executor, labels]');

      res.view('task', { path: 'tasks', task });
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
      await Task.query().deleteById(req.params.id)
        .then(() => Task
          .relatedQuery('labels')
          .unrelate()
          .where('taskId', req.params.id));
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

      const { labels, ...filledFields } = Object.fromEntries(Object
        .entries(req.body.data)
        .filter(([, value]) => !!value));
      filledFields.creatorId = req.user.id;

      const task = await Task.query().insert(filledFields);
      const promises = [];

      if (_.isNumber(labels) || !_.isEmpty(labels)) {
        const withLabels = _.isArray(labels)
          ? labels.map((id) => Task
            .relatedQuery('labels')
            .for(task.id)
            .relate(id))
          : [Task
            .relatedQuery('labels')
            .for(task.id)
            .relate(labels)];
        promises.push(Promise.all(withLabels));
      }

      return Promise.all(promises)
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

      const { labels, ...filledFields } = req.body.data;
      const promises = [];

      if (_.isNumber(labels) || !_.isEmpty(labels)) {
        const updateRelations = Task.query().findById(req.params.id)
          .then((task) => task
            .$relatedQuery('labels')
            .unrelate()
            .where('taskId', req.params.id))
          .then(() => {
            if (_.isArray(labels)) {
              return Promise.all(labels.map((id) => Task
                .relatedQuery('labels')
                .for(req.params.id)
                .relate(id)));
            }
            return Task
              .relatedQuery('labels')
              .for(req.params.id)
              .relate(labels);
          });
        promises.push(updateRelations);
      }

      const update = Task.query().update(filledFields).where({ id: req.params.id })
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            req.flash('flash', [{ type: 'warning', text: i18next.t('task.action.edit.error') }]);
            return res.redirect('/tasks');
          }
          req.log.error(err);
          req.flash('flash', [{ type: 'error', text: err.message }]);
          return res.redirect('/');
        });
      promises.push(update);

      await Promise.all(promises)
        .catch((err) => {
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
