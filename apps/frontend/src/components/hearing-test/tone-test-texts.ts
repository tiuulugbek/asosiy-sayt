import type { Conclusion } from '@/lib/hearing-test/interpret';

export interface ToneTestTexts {
  intro: {
    title: string;
    lead: string;
    points: string[];
    disclaimer: string;
    privacy: string;
    start: string;
  };
  setup: {
    title: string;
    steps: string[];
    note: string;
    next: string;
  };
  check: {
    title: string;
    question: string;
    play: string;
    replay: string;
    left: string;
    right: string;
    both: string;
    none: string;
    comfort: string;
    swapped: string;
    bothMessage: string;
    noneMessage: string;
    skipEar: string;
  };
  instructions: {
    title: string;
    points: string[];
    start: string;
  };
  test: {
    ear: Record<'left' | 'right', string>;
    tone: string;
    of: string;
    heard: string;
    hint: string;
    pause: string;
    paused: string;
    resume: string;
    nextEarTitle: Record<'left' | 'right', string>;
    nextEarText: string;
    continue: string;
  };
  results: {
    titles: Record<Conclusion, string>;
    bodies: Record<Conclusion, string>;
    earLabels: Record<Conclusion, string>;
    asymmetry: string;
    lowReliability: string;
    disclaimer: string;
    volumeReminder: string;
    call: string;
    or: string;
    branches: string;
    restart: string;
  };
  back: string;
}

export const toneTestTexts: Record<'uz' | 'ru', ToneTestTexts> = {
  uz: {
    intro: {
      title: 'Onlayn eshitish testi',
      lead: 'Test har bir quloqqa alohida, turli balandlikdagi tovushlarni beradi. Siz tovushni eshitganingizda tugmani bosasiz.',
      points: [
        'Naushnik kerak boʻladi (karnayda test oʻtkazilmaydi).',
        'Tinch joy tanlang: televizor va musiqani oʻchiring.',
        'Test taxminan 5 daqiqa davom etadi.',
      ],
      disclaimer:
        'Onlayn test filialdagi audiometriya oʻrnini bosmaydi va tibbiy tashxis emas. U faqat eshitishni tekshirtirish kerak yoki kerak emasligi haqida yoʻnalish beradi.',
      privacy: 'Natija faqat shu sahifada koʻrsatiladi: u hech qayerga yuborilmaydi va saqlanmaydi.',
      start: 'Boshlash',
    },
    setup: {
      title: 'Tayyorgarlik',
      steps: [
        'Naushnikni taqing: oʻng naushnik oʻng quloqda, chap naushnik chap quloqda boʻlsin.',
        'Qurilma (telefon yoki kompyuter) ovozini eng yuqori darajaga qoʻying.',
        'iPhone ishlatayotgan boʻlsangiz, yon tomondagi ovozsiz rejim tugmasini oʻchiring.',
      ],
      note: 'Test tugagach, qurilma ovozini yana pasaytirishni unutmang.',
      next: 'Davom etish',
    },
    check: {
      title: 'Naushnikni tekshiramiz',
      question: 'Tovush qaysi quloqda eshitildi?',
      play: 'Tovushni eshitish',
      replay: 'Qayta eshitish',
      left: 'Chap quloqda',
      right: 'Oʻng quloqda',
      both: 'Ikkalasida',
      none: 'Eshitilmadi',
      comfort:
        'Bu tovush oddiy suhbat ovozidek eshitilishi kerak. Juda baland tuyulsa, qurilma ovozini biroz pasaytiring.',
      swapped: 'Naushniklar teskari taqilgan koʻrinadi. Oʻng va chap naushnikni almashtirib, tovushni qayta eshiting.',
      bothMessage:
        'Tovush ikkala quloqda eshitilyapti. Test har bir quloqni alohida tekshiradi, shuning uchun ikki quloqli naushnik kerak. Telefon sozlamalarida "mono ovoz" yoqilgan boʻlsa, uni oʻchiring va qayta urinib koʻring.',
      noneMessage:
        'Qurilma ovozi yoqilganini va naushnik ulanganini tekshiring, keyin tovushni qayta eshiting.',
      skipEar: 'Bu qulogʻim bilan eshitmayman, davom etish',
    },
    instructions: {
      title: 'Test qanday oʻtadi',
      points: [
        'Tovushlar uzuq-uzuq "bip-bip" boʻlib eshitiladi. Ular borgan sari pasayadi.',
        'Tovushni eshitishingiz bilan "Eshitdim" tugmasini bosing, juda past boʻlsa ham.',
        'Tovush yoʻq paytda bosmang. Tovushlar orasidagi tanaffus har xil boʻladi.',
        'Avval oʻng quloq, keyin chap quloq tekshiriladi.',
      ],
      start: 'Testni boshlash',
    },
    test: {
      ear: { left: 'Chap quloq', right: 'Oʻng quloq' },
      tone: 'Tovush',
      of: '/',
      heard: 'Eshitdim',
      hint: 'Tovushni eshitishingiz bilan bosing. Klaviaturada boʻsh joy (probel) tugmasi ham ishlaydi.',
      pause: 'Toʻxtatib turish',
      paused: 'Test toʻxtatib turilibdi',
      resume: 'Davom etish',
      nextEarTitle: { left: 'Endi chap quloq', right: 'Endi oʻng quloq' },
      nextEarText: 'Qoida oʻsha: tovushni eshitishingiz bilan tugmani bosing.',
      continue: 'Davom etish',
    },
    results: {
      titles: {
        'no-signs': 'Eshitish pasayishi belgilari topilmadi',
        'check-recommended': 'Eshitishni tekshirtirish tavsiya etiladi',
        'check-needed': 'Eshitishni albatta tekshirtiring',
      },
      bodies: {
        'no-signs':
          'Bu testdagi tovushlarni ikkala quloq bilan ham past darajada eshitdingiz. Test yengil pasayishni koʻrsatmasligi mumkin. Kundalik hayotda gaplarni tushunish qiyinlashayotgan boʻlsa, eshitishni filialda tekshirtiring.',
        'check-recommended':
          'Ayrim tovushlarni eshitish uchun sizga odatdagidan balandroq daraja kerak boʻldi. Bu eshitish pasayganini anglatishi ham, naushnik yoki atrofdagi shovqin taʼsiri boʻlishi ham mumkin. Aniq javobni filialdagi tekshiruv beradi.',
        'check-needed':
          'Bir nechta tovushni faqat baland darajada eshitdingiz yoki umuman eshitmadingiz. Sababini aniqlash uchun eshitishni mutaxassis huzurida tekshirtirish kerak.',
      },
      earLabels: {
        'no-signs': 'belgi topilmadi',
        'check-recommended': 'tekshirtirish tavsiya etiladi',
        'check-needed': 'tekshirtirish kerak',
      },
      asymmetry:
        'Ikki quloq natijasi orasida sezilarli farq bor. Bunday holatda tekshiruvni kechiktirmaslik tavsiya etiladi.',
      lowReliability:
        'Javoblar barqaror chiqmadi, shuning uchun natija aniq boʻlmasligi mumkin. Testni tinch joyda, shoshilmasdan qayta oʻtib koʻring.',
      disclaimer:
        'Onlayn test tibbiy tashxis emas. Aniq natijani filialdagi audiometriya beradi: u Acousticʼning barcha filiallarida oʻtkaziladi.',
      volumeReminder: 'Qurilma ovozini pasaytirishni unutmang.',
      call: '1385 ga qoʻngʻiroq qilish',
      or: 'yoki',
      branches: 'Filiallar manzili',
      restart: 'Testni qayta oʻtish',
    },
    back: 'Orqaga',
  },
  ru: {
    intro: {
      title: 'Онлайн-тест слуха',
      lead: 'Тест подаёт звуки разной высоты в каждое ухо по отдельности. Когда вы слышите звук, вы нажимаете кнопку.',
      points: [
        'Понадобятся наушники (через динамик тест не проводится).',
        'Выберите тихое место: выключите телевизор и музыку.',
        'Тест занимает около 5 минут.',
      ],
      disclaimer:
        'Онлайн-тест не заменяет аудиометрию в филиале и не является медицинским диагнозом. Он только подсказывает, стоит ли проверить слух.',
      privacy: 'Результат показывается только на этой странице: он никуда не отправляется и не сохраняется.',
      start: 'Начать',
    },
    setup: {
      title: 'Подготовка',
      steps: [
        'Наденьте наушники: правый наушник на правое ухо, левый на левое.',
        'Установите громкость устройства (телефона или компьютера) на максимум.',
        'Если у вас iPhone, выключите беззвучный режим переключателем сбоку.',
      ],
      note: 'После теста не забудьте снова убавить громкость устройства.',
      next: 'Продолжить',
    },
    check: {
      title: 'Проверим наушники',
      question: 'В каком ухе вы услышали звук?',
      play: 'Прослушать звук',
      replay: 'Прослушать ещё раз',
      left: 'В левом',
      right: 'В правом',
      both: 'В обоих',
      none: 'Не услышал(а)',
      comfort:
        'Этот звук должен быть слышен примерно как обычный разговор. Если он кажется слишком громким, немного убавьте громкость устройства.',
      swapped: 'Похоже, наушники надеты наоборот. Поменяйте правый и левый наушник местами и прослушайте звук ещё раз.',
      bothMessage:
        'Звук слышен в обоих ушах. Тест проверяет каждое ухо отдельно, поэтому нужны наушники на оба уха. Если в настройках телефона включён «моно-звук», выключите его и попробуйте снова.',
      noneMessage: 'Проверьте, что звук на устройстве включён и наушники подключены, затем прослушайте звук ещё раз.',
      skipEar: 'Этим ухом я не слышу, продолжить',
    },
    instructions: {
      title: 'Как проходит тест',
      points: [
        'Звуки слышны как прерывистое «бип-бип». Они становятся всё тише.',
        'Как только услышите звук, нажмите «Слышу», даже если он очень тихий.',
        'Не нажимайте, когда звука нет. Паузы между звуками разные.',
        'Сначала проверяется правое ухо, затем левое.',
      ],
      start: 'Начать тест',
    },
    test: {
      ear: { left: 'Левое ухо', right: 'Правое ухо' },
      tone: 'Звук',
      of: '/',
      heard: 'Слышу',
      hint: 'Нажимайте, как только услышите звук. На клавиатуре можно нажимать пробел.',
      pause: 'Приостановить',
      paused: 'Тест приостановлен',
      resume: 'Продолжить',
      nextEarTitle: { left: 'Теперь левое ухо', right: 'Теперь правое ухо' },
      nextEarText: 'Правило то же: как только услышите звук, нажмите кнопку.',
      continue: 'Продолжить',
    },
    results: {
      titles: {
        'no-signs': 'Признаков снижения слуха не найдено',
        'check-recommended': 'Рекомендуется проверить слух',
        'check-needed': 'Обязательно проверьте слух',
      },
      bodies: {
        'no-signs':
          'Звуки этого теста вы услышали на тихом уровне обоими ушами. Тест может не показать лёгкое снижение. Если в повседневной жизни становится труднее разбирать речь, проверьте слух в филиале.',
        'check-recommended':
          'Чтобы услышать некоторые звуки, вам понадобился уровень громче обычного. Это может говорить о снижении слуха, а может быть связано с наушниками или шумом вокруг. Точный ответ даст проверка в филиале.',
        'check-needed':
          'Несколько звуков вы услышали только на громком уровне или не услышали совсем. Чтобы выяснить причину, нужно проверить слух у специалиста.',
      },
      earLabels: {
        'no-signs': 'признаков не найдено',
        'check-recommended': 'рекомендуется проверка',
        'check-needed': 'нужна проверка',
      },
      asymmetry: 'Между результатами двух ушей есть заметная разница. В такой ситуации проверку лучше не откладывать.',
      lowReliability:
        'Ответы получились нестабильными, поэтому результат может быть неточным. Попробуйте пройти тест ещё раз в тихом месте и не торопясь.',
      disclaimer:
        'Онлайн-тест не является медицинским диагнозом. Точный результат даёт аудиометрия в филиале: её проводят во всех филиалах Acoustic.',
      volumeReminder: 'Не забудьте убавить громкость устройства.',
      call: 'Позвонить по номеру 1385',
      or: 'или',
      branches: 'Адреса филиалов',
      restart: 'Пройти тест ещё раз',
    },
    back: 'Назад',
  },
};
