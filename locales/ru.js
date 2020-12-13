export default {
  translation: {
    app: {
      name: 'Менеджер задач',
      shortName: 'Мендач',
      description: 'Система управления задачами, подобная redmine.org. Она позволяет ставить задачи, назначать исполнителей и менять их статусы. Для работы с системой требуется регистрация и аутентификация.',
      button: {
        send: 'Отправить',
      },
    },
    nav: {
      users: 'Пользователи',
      signin: 'Вход',
      signup: 'Регистрация',
    },
    user: {
      field: {
        id: 'id',
        firstName: 'имя',
        lastName: 'фамилия',
        fullName: 'полное имя',
        email: 'email',
        password: 'пароль',
      },
      button: {
        edit: 'изменить',
        delete: 'удалить',
      },
      info: {
        signin: 'добро пожаловать, иди работать',
      },
      error: {
        not_found: 'пользователь с почтой "{{ email }}" отсутствует',
        password: 'неправильный пароль',
      },
    },
  },
};
