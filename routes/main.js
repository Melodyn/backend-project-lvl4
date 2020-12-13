import yup from 'yup';
import { constants } from 'http2';
import _ from 'lodash';
import fastifyPass from 'fastify-passport';
import { User, userFields } from '../models/User.js';

const fastifyPassport = fastifyPass.default;

/**
 * @type {import('fastify').RouteOptions[]}
 */
const routes = [
  {
    method: 'POST',
    url: '/login',
    handler: async (req, res) => {
      const { email: emailValidator, password: passwordValidator } = userFields;
      const { email, password } = await yup
        .object({ email: emailValidator, password: passwordValidator })
        .required()
        .validate(req.body);
      const [user] = await User.query().where({ email });

      if (!user) {
        res.code(constants.HTTP_STATUS_UNAUTHORIZED)
          .send(`Not found user with email '${email}'`);
        return;
      }
      if (user.password !== User.hashPassword(password)) {
        res.code(constants.HTTP_STATUS_UNAUTHORIZED)
          .send('Incorrect password');
        return;
      }
      res
        .setCookie('token', user.password, {
          path: '/',
        })
        .setCookie('id', user.id, {
          path: '/',
        })
        .send(user.password);
    },
  },
  {
    method: 'POST',
    url: '/session',
    preValidation: fastifyPassport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/session/new',
      failureFlash: true,
      successFlash: true,
    }),
    handler: () => {},
  },
  {
    method: 'GET',
    url: '/session/new',
    handler: (req, res) => {
      const flashErrors = res.flash('error') || [];
      const flash = res.flash('flash') || [];
      const errors = _.fromPairs(flashErrors.flatMap(_.toPairs));
      res.view('signin', { path: 'signin', errors, flash });
    },
  },
  {
    method: 'GET',
    url: '/users/new',
    handler: (req, res) => {
      const flashErrors = res.flash('error') || [];
      const errors = _.fromPairs(flashErrors.flatMap(_.toPairs));
      res.view('signup', { path: 'signup', errors });
    },
  },
  {
    method: 'GET',
    url: '/',
    handler: (req, res) => {
      const resFlash = res.flash() ?? {};
      const flash = Object.values(resFlash).flat();
      res.view('main', { flash });
    },
  },
];

export default routes;
