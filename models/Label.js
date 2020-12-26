import * as yup from 'yup';
import objection from 'objection';

const { Model } = objection;

export class Label extends Model {
  static get tableName() {
    return 'labels';
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: Model.ManyToManyRelation,
        modelClass: 'Task',
        join: {
          from: 'label.id',
          through: {
            from: 'tasks_labels.labelId',
            to: 'tasks_labels.taskId',
          },
          to: 'task.id',
        },
      },
    };
  }
}

export const labelFields = {
  name: yup.string().min(1).required(),
};

export const labelValidator = yup.object(labelFields).unknown(false).required();
