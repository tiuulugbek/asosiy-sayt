import type { Conclusion } from '@/lib/hearing-test/interpret';

type Ear = 'left' | 'right';

/** Sarlavha uch qismdan iborat: oddiy matn, ajratib koʻrsatilgan matn, oddiy matn. */
export type Headline = [string, string, string];

export interface ToneTestTexts {
  stages: { intro: string; left: string; right: string; results: string };
  back: string;
  next: string;
  close: string;
  intro: { title: Headline; disclaimer: string; privacy: string };
  setup: {
    title: Headline;
    items: { title: string; text: string }[];
    iphone: string;
    check: string;
    checking: Record<Ear, string>;
    checkHint: string;
    note: string;
  };
  ready: Record<Ear, { kicker: string; title: Headline }>;
  tone: {
    title: Headline;
    subtitle: string;
    ear: Record<Ear, string>;
    hz: string;
    hint: string;
    replay: string;
    quieter: string;
    louder: string;
    slider: string;
    needMove: string;
    notHeard: string;
  };
  results: {
    titles: Record<Conclusion, Headline>;
    bodies: Record<Conclusion, string>;
    earLabels: Record<Conclusion, string>;
    asymmetry: string;
    cardTitle: string;
    cardText: string;
    call: string;
    or: string;
    branches: string;
    disclaimer: string;
    volumeReminder: string;
    restart: string;
  };
}

export const toneTestTexts: Record<'uz' | 'ru', ToneTestTexts> = {
  uz: {
    stages: { intro: 'Kirish', left: 'Chap quloq', right: 'Oʻng quloq', results: 'Natija' },
    back: 'Orqaga',
    next: 'Davom etish',
    close: 'Testni yopish',
    intro: {
      title: ['Keling, ', 'eshitishingizni', ' tekshiramiz'],
      disclaimer:
        'Acoustic onlayn eshitish testi mutaxassis koʻrigi oʻrnini bosmaydi va tibbiy tashxis emas. U eshitishni tekshirtirish kerak yoki kerak emasligi haqida yoʻnalish beradi.',
      privacy: 'Natija faqat shu sahifada koʻrsatiladi: u hech qayerga yuborilmaydi va saqlanmaydi.',
    },
    setup: {
      title: ['Tinch joy toping va ', 'naushnikni taqing', ''],
      items: [
        { title: 'Tinch joy toping', text: 'atrofda shovqin imkon qadar kam boʻlsin' },
        { title: 'Qurilma ovozini eng yuqoriga qoʻying', text: 'telefon yoki kompyuter ovozi maksimal boʻlsin' },
        { title: 'Naushnikni tekshiring: avval chap, keyin oʻng', text: 'tovush avval chap, keyin oʻng quloqda eshitilishi kerak' },
      ],
      iphone: 'iPhone ishlatayotgan boʻlsangiz, yon tomondagi ovozsiz rejim tugmasini oʻchiring.',
      check: 'Tovushni tekshirish',
      checking: { left: 'Chap quloq…', right: 'Oʻng quloq…' },
      checkHint: 'Aksincha eshitilsa, naushniklarni almashtirib taqing. Ikkala quloqda birdek eshitilsa, test toʻgʻri ishlamaydi.',
      note: 'Test tugagach, qurilma ovozini yana pasaytirishni unutmang.',
    },
    ready: {
      left: { kicker: 'Testga tayyorsiz!', title: ['', 'Chap quloqdan', ' boshlaymiz'] },
      right: { kicker: 'Yaxshi! Davom etamiz', title: ['Endi ', 'oʻng quloqni', ' tekshiramiz'] },
    },
    tone: {
      title: ['Tovushni ', 'zoʻrgʻa eshitadigan', ' darajaga keltiring'],
      subtitle: 'Surgichni suring yoki + va − tugmalarini bosing. Naushnik va qurilma ovozi maksimal tursin.',
      ear: { left: 'Chap quloq', right: 'Oʻng quloq' },
      hz: 'Gs',
      hint: 'Tovush endi eshitila boshlagan joyda toʻxtang va "Davom etish"ni bosing.',
      replay: 'Qayta eshitish',
      quieter: 'Pasaytirish',
      louder: 'Balandlatish',
      slider: 'Tovush darajasi',
      needMove: 'Avval + tugmasini bosib, tovushni eshitiladigan darajaga keltiring.',
      notHeard: 'Eng baland darajada ham eshitmayapman',
    },
    results: {
      titles: {
        'no-signs': ['Eshitish pasayishi belgilari ', 'topilmadi', ''],
        'check-recommended': ['Eshitishni ', 'tekshirtirish', ' tavsiya etiladi'],
        'check-needed': ['Eshitishni ', 'albatta tekshirtiring', ''],
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
        'no-signs': 'Belgi topilmadi',
        'check-recommended': 'Tekshirtirish tavsiya etiladi',
        'check-needed': 'Tekshirtirish kerak',
      },
      asymmetry:
        'Ikki quloq natijasi orasida sezilarli farq bor. Bunday holatda tekshiruvni kechiktirmaslik tavsiya etiladi.',
      cardTitle: 'Toʻliq eshitish tekshiruvi',
      cardText:
        'Test natijasi qanday boʻlishidan qatʼi nazar, eshitishda qiyinchilik sezayotgan boʻlsangiz, kechiktirmang. Acoustic filialida eshitishingiz tekshiriladi va natijani mutaxassis shu yerning oʻzida tushuntiradi.',
      call: '1385 ga qoʻngʻiroq qilish',
      or: 'yoki',
      branches: 'Filiallar manzili',
      disclaimer: 'Onlayn test tibbiy tashxis emas. Aniq natijani filialdagi audiometriya beradi.',
      volumeReminder: 'Qurilma ovozini pasaytirishni unutmang.',
      restart: 'Testni qayta oʻtish',
    },
  },
  ru: {
    stages: { intro: 'Введение', left: 'Левое ухо', right: 'Правое ухо', results: 'Результат' },
    back: 'Назад',
    next: 'Продолжить',
    close: 'Закрыть тест',
    intro: {
      title: ['Давайте проверим ', 'ваш слух', ''],
      disclaimer:
        'Онлайн-тест слуха Acoustic не заменяет осмотр специалиста и не является медицинским диагнозом. Он подсказывает, стоит ли проверить слух.',
      privacy: 'Результат показывается только на этой странице: он никуда не отправляется и не сохраняется.',
    },
    setup: {
      title: ['Найдите тихое место и ', 'наденьте наушники', ''],
      items: [
        { title: 'Найдите тихое место', text: 'вокруг должно быть как можно меньше шума' },
        { title: 'Установите громкость на максимум', text: 'громкость телефона или компьютера должна быть максимальной' },
        { title: 'Проверьте наушники: сначала левый, затем правый', text: 'звук должен прозвучать сначала в левом, затем в правом ухе' },
      ],
      iphone: 'Если у вас iPhone, выключите беззвучный режим переключателем сбоку.',
      check: 'Проверить звук',
      checking: { left: 'Левое ухо…', right: 'Правое ухо…' },
      checkHint: 'Если звук слышен наоборот, поменяйте наушники местами. Если он одинаково слышен в обоих ушах, тест не будет работать правильно.',
      note: 'После теста не забудьте снова убавить громкость устройства.',
    },
    ready: {
      left: { kicker: 'Вы готовы к тесту!', title: ['Начнём с ', 'левого уха', ''] },
      right: { kicker: 'Отлично! Продолжаем', title: ['Теперь проверим ', 'правое ухо', ''] },
    },
    tone: {
      title: ['Установите громкость, при которой звук ', 'едва слышен', ''],
      subtitle: 'Двигайте ползунок или нажимайте + и −. Громкость наушников и устройства должна оставаться максимальной.',
      ear: { left: 'Левое ухо', right: 'Правое ухо' },
      hz: 'Гц',
      hint: 'Остановитесь там, где звук только начал быть слышен, и нажмите «Продолжить».',
      replay: 'Прослушать ещё раз',
      quieter: 'Тише',
      louder: 'Громче',
      slider: 'Уровень звука',
      needMove: 'Сначала нажимайте +, пока звук не станет слышен.',
      notHeard: 'Не слышу даже на самом громком уровне',
    },
    results: {
      titles: {
        'no-signs': ['Признаков снижения слуха ', 'не найдено', ''],
        'check-recommended': ['Рекомендуется ', 'проверить слух', ''],
        'check-needed': ['', 'Обязательно проверьте', ' слух'],
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
        'no-signs': 'Признаков не найдено',
        'check-recommended': 'Рекомендуется проверка',
        'check-needed': 'Нужна проверка',
      },
      asymmetry: 'Между результатами двух ушей есть заметная разница. В такой ситуации проверку лучше не откладывать.',
      cardTitle: 'Полная проверка слуха',
      cardText:
        'Каким бы ни был результат теста, если вы замечаете трудности со слухом, не откладывайте. В филиале Acoustic вам проверят слух, а специалист объяснит результат сразу на месте.',
      call: 'Позвонить по номеру 1385',
      or: 'или',
      branches: 'Адреса филиалов',
      disclaimer: 'Онлайн-тест не является медицинским диагнозом. Точный результат даёт аудиометрия в филиале.',
      volumeReminder: 'Не забудьте убавить громкость устройства.',
      restart: 'Пройти тест ещё раз',
    },
  },
};
