import { User, userValidator } from '../models/User.js';

/**
 * @type {import('fastify').RouteOptions[]}
 */
const routes = [
  {
    method: 'GET',
    url: '/users',
    handler: (req) => User.query().where(req.query),
  },
  {
    method: 'PATCH',
    url: '/users/:id',
    handler: (req) => {
      const { id } = req.params;
      const updatedData = userValidator.validateSync(req.body);
      const user = User.query().where({ id });
      return user.update(updatedData);
    },
  },
  {
    method: 'POST',
    url: '/users',
    handler: (req) => User.query().insert(userValidator.validateSync(req.body)),
  },
];

export default routes;
