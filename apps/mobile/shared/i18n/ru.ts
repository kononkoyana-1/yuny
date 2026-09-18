/**
 * Russian copy resource for i18next (TZ.md §1 — language is fixed to `ru`,
 * there is no locale switch anywhere in the product).
 *
 * Keys are nested so a call site can address them with i18next's default
 * dot-path (`t("upload.file.meta")`), matching the flat key column in
 * `docs/design/specs/upload.design.md` §Copy. Plural forms use i18next's
 * `_one` / `_few` / `_many` suffixes, which it resolves against
 * `Intl.PluralRules("ru")` — see `shared/i18n/index.ts` for the Hermes
 * fallback.
 */
export const ru = {
  upload: {
    title: "Новый материал",
    subtitle:
      "Сфотографируйте страницу учебника или выберите файлы. До трёх файлов станут одним модулем.",
    source: {
      camera: "Камера",
      gallery: "Галерея",
      files: "Файлы",
      cameraA11y: "Сфотографировать страницу",
      galleryA11y: "Выбрать фото из галереи",
      filesA11y: "Выбрать PDF, DOCX или фото из файлов",
    },
    limits: "Фото, PDF до 20 страниц или DOCX. До трёх файлов и 30 МБ за раз.",
    empty: "Выбранные файлы появятся здесь",
    selected: {
      count: "Выбрано: {{count}} из 3",
      total: "{{size}} из 30 МБ",
      full: "Выбрано три файла — это максимум за один раз",
    },
    file: {
      photoName: "Фото {{n}}",
      kind: {
        image: "Фото",
        pdf: "PDF",
        docx: "DOCX",
      },
      meta: "{{kind}} · {{size}}",
      preparing: "Готовим фото…",
      remove: 'Убрать «{{name}}»',
    },
    size: {
      kb: "{{value}} КБ",
      mb: "{{value}} МБ",
    },
    submit: "Создать модуль",
    error: {
      tooMany: "За раз можно добавить до трёх файлов — взяли первые по порядку.",
      unsupported: '«{{name}}» не подойдёт: нужны фото, PDF или DOCX.',
      imageTooLarge: "Фото слишком большое даже после сжатия. Попробуйте сделать снимок ещё раз.",
      pdfTooLarge: '«{{name}}» больше 20 МБ. Разделите PDF на части поменьше.',
      docxTooLarge: '«{{name}}» больше 5 МБ. Сохраните документ без картинок или разделите его.',
      totalTooLarge: "Вместе файлы больше 30 МБ. Уберите один или выберите файлы поменьше.",
      imageUnreadable: "Не получилось открыть это фото. Попробуйте другое.",
      unreadable: 'Не получилось прочитать файл «{{name}}». Выберите его ещё раз или другой файл.',
      cameraDenied: "Нет доступа к камере. Разрешите его в настройках телефона.",
      galleryDenied: "Нет доступа к фото. Разрешите его в настройках телефона.",
    },
    wait: {
      sending: {
        title: "Отправляем файлы",
        detail: "Файл {{current}} из {{total}}. Не закрывайте приложение, пока файлы загружаются.",
      },
      reading: {
        title: "Читаем материал",
        detail: "Выписываем слова из заданий и находим грамматику урока. Обычно это занимает до полуминуты.",
        slow: "Иногда разбор идёт до полутора минут. Можно перейти на другую вкладку — разбор продолжится.",
      },
    },
    done: {
      title: "Модуль готов",
      words_one: "{{count}} слово",
      words_few: "{{count}} слова",
      words_many: "{{count}} слов",
      grammar_one: "{{count}} тема грамматики",
      grammar_few: "{{count}} темы грамматики",
      grammar_many: "{{count}} тем грамматики",
      summary: "В материале {{words}} и {{grammar}}.",
      summaryWordsOnly: "В материале {{words}}.",
      next: "Модуль сохранён. Задания по нему появятся на Главной.",
      primary: "На главную",
      secondary: "Загрузить ещё",
    },
    fail: {
      rejected: {
        title: "Не нашли здесь материала по китайскому",
        detail:
          "Возможно, снимок размыт или на нём нет заданий. Подойдёт страница учебника, распечатка или конспект с заданиями.",
        action: "Выбрать другой файл",
      },
      pdfTooLong: {
        title: "В PDF больше 20 страниц",
        detail: "Оставьте в файле нужные страницы или разделите его на части — каждая станет своим модулем.",
        action: "Выбрать другой файл",
      },
      parse: {
        title: "Не получилось разобрать материал",
        detail: "Файлы сохранены, загружать их заново не нужно. Попробуйте ещё раз через минуту.",
        action: "Попробовать ещё раз",
      },
      slow: {
        title: "Разбор идёт дольше обычного",
        detail: "Материал ещё читается. Проверим, готов ли он?",
        action: "Проверить ещё раз",
      },
      send: {
        title: "Не получилось отправить файлы",
        detail: "Проверьте интернет. Выбранные файлы на месте — выбирать их заново не нужно.",
        action: "Попробовать ещё раз",
        change: "Изменить выбор",
      },
      lost: {
        title: "Не получилось закончить разбор",
        detail: "Отправьте файлы ещё раз — начнём сначала.",
        action: "Выбрать файлы заново",
      },
    },
  },
  permissions: {
    camera: "Чтобы сфотографировать страницу учебника или конспект.",
    photos: "Чтобы выбрать фото материала из галереи.",
  },
} as const;
