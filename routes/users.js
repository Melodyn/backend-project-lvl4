import yup from 'yup';
import { constants } from 'http2';
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
    handler: async (req, res) => {
      const { headers: { authorization }, params: { id } } = await yup.object({
        headers: yup.object({
          authorization: yup.string().required(),
        }).required(),
        params: yup.object({
          id: yup.number().required(),
        }).required(),
      }).required().validate(req);
      const updatedData = userValidator.validateSync(req.body);
      const user = await User.query().findById(id);
      if (!user || user.password !== authorization) {
        res.code(constants.HTTP_STATUS_NOT_ACCEPTABLE)
          .send('Access denied');
        return;
      }
      const result = await User.query().update(updatedData).where({ id });
      res.send(result);
    },
  },
  {
    method: 'POST',
    url: '/users',
    handler: (req) => User.query().insert(userValidator.validateSync(req.body)),
  },
];

export default routes;
