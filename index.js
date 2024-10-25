const Chalk = require('chalk'); // Импорт библиотеки для работы с цветами в консоли
const Readline = require('readline'); // Импорт библиотеки для работы с вводом/выводом в консоли
const rl = Readline.createInterface({
  input: process.stdin, // Входной поток - стандартный ввод
  output: process.stdout, // Выходной поток - стандартный вывод
  terminal: true // Указываем, что это терминал
});
const Fs = require('fs'); // Импорт библиотеки для работы с файловой системой

class Console {
  constructor() {
    this.commands = new Map(); // Словарь для хранения команд
    this.colors = {
      success: '#00ff00',
      // Цвет для успешных сообщений
      warning: '#ffff00',
      // Цвет для предупреждений
      danger: '#ff0000',
      // Цвет для ошибок
      info: '#00ffff',
      // Цвет для информации
      primary: '#0077ff',
      // Основной цвет
      secondary: '#666666',
      // Вторичный цвет
      magenta: '#ff66ee' // Цвет магента
    }
    this.opt = {
      ident: 2.8,
      // Отступ для идентификации
      space: 10 // Пробелы для выравнивания
    }
  }

  // Метод для логирования сообщений в консоль
  async log(...args) {
    const wrapAnsi = await import('wrap-ansi').then(m => m.default); // Импорт модуля для обрезки текста
    const color = this.#getColor(args); // Получение цвета для сообщений
    const exclude = this.#getColorName(args); // Получение имени цвета, если он указан
    const filter = args.filter(arg => arg !== exclude); // Фильтрация аргументов
    const time = new Date().toTimeString().split(' ')[0]; // Получение текущего времени
    const timestamp = `${Chalk.underline.gray(`[${time}]`)}`; // Форматирование временной метки
    const arr = [];

    // Обработка аргументов для логирования
    filter.forEach((arg) => {

      arr.push(this.dataTypeConvert(arg));
    });

    const message = arr.join(' '); // Объединение сообщений
    const coloredMessage = color ? color(message): message; // Применение цвета к сообщению
    const consoleWidth = process.stdout.columns || 80; // Получение ширины консоли
    const wrappedMessage = wrapAnsi(coloredMessage,
      consoleWidth - (timestamp.length / this.opt.ident),
      {
        hard: true // Разбивать строки на жесткие границы
      })
    .split('\n')
    .map((line, index) => index === 0 ? `${timestamp} ${line}`: `${' '.repeat(this.opt.space)} ${line}`)
    .join('\n'); // Форматирование сообщения с временной меткой
    console.log(wrappedMessage); // Вывод сообщения в консоль
  }


  dataTypeConvert(value) {
    const anonymouse = 'anonymouse';
    const type = typeof value;
    if (value === null) {
      return Chalk.magenta('null');
    }
    if (value === undefined) {
      return Chalk.gray('undefined');
    }
    if (type === 'object') {
      if (Array.isArray(value)) {
        return Chalk.yellow(JSON.stringify(value));
      }
      if (value instanceof Date) {
        return Chalk.magenta(value.toString());
      }
      if (value instanceof RegExp) {
        return Chalk.magenta(value.toString());
      }
      // Проверка на экземпляр класса
      if (value.constructor && value.constructor !== Object) {
        const className = value.constructor.name || anonymouse;
        return Chalk.cyan(`[class ${className}]`);
      }
      // Сериализация обычного объекта
      return Chalk.yellow(JSON.stringify(value));
    }
    if (type === 'function') {
      const functionName = value.name || anonymouse;
      return Chalk.cyan(`[function ${functionName}]`)
    }
    if (type === 'number' || type === 'bigint') {
      return Chalk.yellow(value.toString())
    }
    if (type === 'boolean') {
      return Chalk.magenta(value.toString())
    }
    if (type === 'symbol') {
      return Chalk.cyan(value.toString())
    }
    return value.toString();
  }


  // Метод для получения цвета
  #getColor(args) {
    const array = args;
    const matchedKeys = Object.keys(this.colors).filter(key => array.includes(key)); // Поиск совпадающих ключей
    if (matchedKeys.length > 0) {
      const colorHex = this.colors[matchedKeys[0]]; // Получение цвета в шестнадцатеричном формате
      return Chalk.hex(colorHex); // Возвращаем цвет
    }
    return null; // Если цвет не найден
  }

  // Метод для получения имени цвета
  #getColorName(args) {
    const array = args;
    const matchedKeys = Object.keys(this.colors).filter(key => array.includes(key)); // Поиск совпадающих ключей
    if (matchedKeys.length > 0) {
      return matchedKeys.join(); // Возвращаем имена цветов
    }
    return null; // Если цвет не найден
  }

  // Метод для проверки, является ли объектом
  #isObject(obj) {
    return typeof obj === 'object' && obj !== null; // Проверка на объект и не null
  }

  // Метод для парсинга аргументов из строки
  parseArgsFromString(input) {
    const parsed = {
      flags: {},
      // Флаги команд
      values: {},
      // Значения команд
      unknown: [] // Неизвестные аргументы
    };
    const args = input.split(' ') || input; // Разделение строки на аргументы
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        // Если аргумент начинается с --
        const [key,
          value] = arg.slice(2).split('='); // Разделение ключа и значения
        if (value !== undefined) {
          parsed.values[key] = value; // Добавление в значения
        } else {
          parsed.flags[key] = true; // Добавление в флаги
        }
      } else if (arg.startsWith('-')) {
        // Если аргумент начинается с -
        const key = arg.slice(1);
        parsed.flags[key] = true; // Добавление в флаги
      } else {
        parsed.unknown.push(arg); // Добавление в неизвестные аргументы
      }
    }
    return parsed; // Возвращаем распарсенные аргументы
  }

  // Метод для очистки консоли
  clear(bool = true) {
    Readline.cursorTo(process.stdout, 0, 0); // Перемещение курсора в начало
    Readline.clearScreenDown(process.stdout); // Очистка экрана
    if (bool) {
      this.log('Консоль очищена'); // Логирование сообщения об очистке
    }
  }

  // Метод для регистрации команд
  cmd(...args) {
    let name; // Имя команды
    let description; // Описание команды
    let value; // Функция команды
    let unknown = []; // Неизвестные аргументы
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (typeof arg === 'string') {
        if (arg.split(' ').length === 1) {
          name = arg; // Запоминаем имя команды
        } else {
          description = arg; // Запоминаем описание
        }
      } else if (typeof arg === 'object') {
        if (arg.description) {
          description = arg.description; // Запоминаем описание из объекта
        }
      } else if (typeof arg === 'function') {
        value = arg; // Запоминаем функцию
      } else {
        unknown.push(arg); // Добавляем неизвестные аргументы
      }
      // Если имя и функция определены, добавляем команду в словарь
      if (name && value) {
        this.commands.set(name, {
          name,
          description,
          value,
          unknown
        });
        name = undefined; // Сбрасываем имя
        description = undefined; // Сбрасываем описание
        value = undefined; // Сбрасываем функцию
        unknown = []; // Сбрасываем неизвестные аргументы
      }
    }
  }

  // Метод для замены плейсхолдеров в строке
  placeholder(str, obj) {
    const replace = str.replace(/{(.*?)}/g, (match, key) => {
      const keys = key.split('.'); // Разделение ключей
      let value = obj;
      for (const k of keys) {
        value = value[k]; // Получение значения по ключу
        if (value === undefined) {
          return match; // Если значение не найдено, возвращаем оригинал
        }
      }
      return value || match; // Возвращаем значение или оригинал
    });
    return replace.toString(); // Возвращаем строку с заменами
  }

  // Метод для отображения справки по командам
  help() {
    const obj = Object.fromEntries(this.commands); // Преобразование команд в объект
    const dir = __dirname; // Получение директории текущего файла
    const file = Fs.readFileSync(`${dir}/help.txt`,
      'utf8'); // Чтение файла с помощью
    Object.entries(obj).forEach(([key, value]) => {
      const description = (value.description === undefined) ? Chalk.red('Отсутствует'): value.description; // Проверка наличия описания
      const unknown = () => {
        if (Array.isArray(value.unknown) && value.unknown.length > 0) {
          return `debug: ${Chalk.red(value.unknown.join(', '))}`; // Если есть неизвестные аргументы
        } else {
          return `debug: ${Chalk.green('ok')}`; // Если нет
        }
      };
      this.log(this.placeholder(file, {
        info: {
          name: Chalk.green('Название:'),
          description: Chalk.green('Описание:'),
          unknown: unknown()
        },
        cmd: {
          name: value.name,
          description: description
        }
      }));
    });
  }

  // Метод для обработки ввода пользователя
  handler() {
    rl.question('',
      (input) => {
        const cmd = input.split(' ')[0]; // Получение команды
        const args = this.parseArgsFromString(input); // Парсинг аргументов
        if (this.commands.has(cmd)) {
          this.commands.get(cmd).value(args); // Выполнение команды
        } else {
          this.log(`Неизвестная команда: ${cmd}`, 'danger'); // Сообщение об ошибке
        }
        this.handler(); // Запрос следующего ввода
      });
  }
}

const new_console = new Console(); // Создание экземпляра консоли

new_console.handler(); // Запуск обработчика ввода
new_console.clear(false); // Очистка консоли при запуске

// Регистрация команд
new_console.cmd('clear', {
  description: 'Очистить консоль'
}, () => new_console.clear());
new_console.cmd('stop', {
  description: 'Остановить приложение'
}, (cmd) => {
  new_console.log('Закрытие приложения...'); // Сообщение о закрытии
  setInterval(() => process.exit(0), 100); // Завершение процесса
});
new_console.cmd('help', {
  description: 'Получить помощь по командам'
}, () => {
  new_console.log('Помощь по командам:', 'magenta'); // Сообщение о помощи
  new_console.help(); // Вызов справки
});

module.exports = new_console; // Экспорт экземпляра консоли
module.exports.chalk = Chalk; // Экспорт библиотеки Chalk