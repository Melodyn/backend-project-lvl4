import * as yup from 'yup';
import _ from 'lodash';
import objection from 'objection';
import { User } from './User.js';
import { Status } from './Status.js';
import { Label } from './Label.js';

const { Model } = objection;

export class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  static get modifiers() {
    return {
      'query.isCreatorUser': (query, creatorId) => {
        if (creatorId) query.andWhere({ creatorId });
      },
      'query.status': (query, statusId) => {
        if (statusId) query.andWhere({ statusId });
      },
      'query.executor': (query, executorId) => {
        if (executorId) query.andWhere({ executorId });
      },
    };
  }

  static get relationMappings() {
    return {
      status: {
        relation: Model.BelongsToOneRelation,
        modelClass: Status,
        join: {
          from: 'tasks.statusId',
          to: 'statuses.id',
        },
      },
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.creatorId',
          to: 'users.id',
        },
      },
      executor: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'tasks.executorId',
          to: 'users.id',
        },
      },
      labels: {
        relation: Model.ManyToManyRelation,
        modelClass: Label,
        join: {
          from: 'tasks.id',
          through: {
            from: 'tasks_labels.taskId',
            to: 'tasks_labels.labelId',
          },
          to: 'labels.id',
        },
      },
    };
  }
}

export const taskFields = {
  name: yup.string().min(1).required(),
  description: yup.string().default('').optional(),
  statusId: yup.string().matches(/\d+/).required(),
  executorId: yup.string().matches(/\d*/).optional(),
  labels: yup.lazy((value) => {
    if (_.isArray(value)) {
      return yup.array(yup.string()).optional();
    }
    if (_.isString(value)) {
      return yup.string().matches(/\d*/).optional();
    }
    return yup.string().default('');
  }),
};

export const taskValidator = yup.object(taskFields).unknown(false).required();
