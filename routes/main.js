import fastifyPass from 'fastify-passport';
import i18next from 'i18next';

const fastifyPassport = fastifyPass.default;

/**
 * @type {import('fastify').RouteOptions[]}
 */
const routes = [
  {
    method: 'DELETE',
    url: '/session',
    handler: (req, res) => {
      req.logOut();
      req.flash('flash', [{ type: 'success', text: i18next.t('signout.success') }]);
      res.redirect('/');
    },
  },
  {
    method: 'POST',
    url: '/session/new',
    preValidation: fastifyPassport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/session/new',
    }),
    handler: () => {},
  },
  {
    method: 'GET',
    url: '/session/new',
    handler: (req, res) => {
      res.view('signin', { path: 'signin' });
    },
  },
  {
    method: 'GET',
    url: '/',
    handler: (req, res) => {
      res.view('main');
    },
  },
];

export default routes;
