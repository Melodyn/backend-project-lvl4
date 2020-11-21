import users from './users.js';

export default [
  users,
  [{
    method: 'GET',
    url: '/',
    handler: (req, res) => {
      res.sendFile('index.html');
    },
  }],
];
