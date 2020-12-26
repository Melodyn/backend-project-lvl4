export default {
  translation: {
    app: {
      name: 'Менеджер задач',
      shortName: 'Мендач',
      description: 'Система управления задачами, подобная redmine.org. Она позволяет ставить задачи, назначать исполнителей и менять их статусы. Для работы с системой требуется регистрация и аутентификация.',
      button: {
        send: 'Отправить',
        signin: 'Войти',
        save: 'Сохранить',
      },
    },
    nav: {
      signin: 'Вход',
      signout: 'Выход',
      signup: 'Регистрация',
      users: 'Пользователи',
      tasks: 'Задачи',
      statuses: 'Статусы',
      labels: 'Метки',
    },
    signin: {
      error: {
        not_found: 'пользователь с почтой "{{ email }}" отсутствует',
        password: 'неправильный пароль',
      },
      success: 'Вы залогинены',
    },
    signout: {
      success: 'Вы разлогинены',
    },
    signup: {
      error: {
        firstName: 'должно быть строкой; обязательное',
        lastName: 'должно быть строкой; обязательное',
        email: 'должно соответствовать виду "a@b.c"; обязательное',
        email_exists: 'почта {{ email }} уже существует, попробуйте войти',
        password: 'должен содержать минимум одну цифру, заглавную букву, символ, иероглиф, коловрат, число зверя и кровь девственницы; обязательное',
      },
      success: 'Пользователь успешно зарегистрирован',
    },
    user: {
      field: {
        id: 'id',
        firstName: 'Имя',
        lastName: 'Фамилия',
        fullName: 'Полное имя',
        email: 'Email',
        password: 'Пароль',
      },
      button: {
        edit: 'Изменить',
        delete: 'Удалить',
      },
      action: {
        delete: {
          error: 'можно удалить только своего пользователя',
          success: 'Пользователь успешно удалён',
        },
        edit: {
          error: 'можно редактировать только своего пользователя',
          success: 'Пользователь успешно изменён',
        },
      },
    },
    task: {
      field: {
        id: 'id',
        name: 'Наименование',
        description: 'Описание',
        status: 'Статус',
        creator: 'Автор',
        executor: 'Исполнитель',
        label: 'Метка',
        labels: 'Метки',
        isCreatorUser: 'Только мои задачи',
      },
      button: {
        create: 'Создать задачу',
        edit: 'Изменить',
        save: 'Создать',
        delete: 'Удалить',
        show: 'Показать',
      },
      action: {
        delete: {
          error: 'Невозможно удалить задачу',
          success: 'Задача успешно удалена',
        },
        edit: {
          error: 'Невозможно редактировать задачу',
          success: 'Задача успешно изменена',
        },
        create: {
          error: 'Невозможно создать задачу',
          success: 'Задача успешно создана',
        },
      },
    },
    status: {
      field: {
        id: 'id',
        name: 'Наименование',
        createdAt: 'Дата создания',
      },
      button: {
        create: 'Создать статус',
        edit: 'Изменить',
        save: 'Создать',
        delete: 'Удалить',
      },
      action: {
        delete: {
          error: 'Невозможно удалить статус',
          success: 'Статус успешно удалён',
        },
        edit: {
          error: 'Невозможно редактировать статус',
          success: 'Статус успешно изменён',
        },
        create: {
          error: 'Невозможно создать статус',
          success: 'Статус успешно создан',
        },
      },
    },
    label: {
      field: {
        id: 'id',
        name: 'Наименование',
        createdAt: 'Дата создания',
      },
      button: {
        create: 'Создать метку',
        edit: 'Изменить',
        save: 'Создать',
        delete: 'Удалить',
      },
      action: {
        delete: {
          error: 'Невозможно удалить метка',
          success: 'Метка успешно удалена',
        },
        edit: {
          error: 'Невозможно редактировать метку',
          success: 'Метка успешно изменена',
        },
        create: {
          error: 'Невозможно создать метку',
          success: 'Метка успешно создана',
        },
      },
    },
  },
};
