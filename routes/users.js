import { constants } from 'http2';
import Objection from 'objection';
import { User, userValidator } from '../models/User.js';

const { UniqueViolationError } = Objection;

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
    method: 'POST',
    url: '/users',
    handler: async (req, res) => {
      const userData = await userValidator.validate(req.body, { abortEarly: false });

      await User.query().insert(userData)
        .then(() => res.code(constants.HTTP_STATUS_CREATED).send())
        .catch((err) => {
          if (err instanceof UniqueViolationError) {
            res
              .code(constants.HTTP_STATUS_BAD_REQUEST)
              .send(`"email ${userData.email}" already exists`);
          } else {
            res
              .code(constants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
              .send(err.message);
          }
        });
    },
  },
  {
    method: 'PATCH',
    url: '/users/:id',
    handler: async (req, res) => {
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
