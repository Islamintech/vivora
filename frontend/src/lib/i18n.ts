// Lightweight customer-facing translations. No i18n library: the customer app
// has a small, fixed string set, and shipping one keeps the QR-scan bundle
// small. Menu item names/descriptions are NOT translated — they render exactly
// as the restaurant owner entered them.

export type Lang = 'ko' | 'en' | 'ru' | 'uz';

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uz', label: "O‘zbekcha", flag: '🇺🇿' },
];

const en = {
  // Onboarding steps
  chooseLanguage: 'Choose your language',
  chooseServing: 'How would you like to eat?',
  dineIn: 'Dine in',
  dineInHint: 'Eat here at your table',
  takeOut: 'Take out',
  takeOutHint: 'Pack it to go',
  back: 'Back',

  // Menu
  addToCart: 'Add',
  cart: 'Your Order',
  placeOrder: 'Place Order',
  total: 'Total',
  note: 'Special instructions',
  noteHint: 'Any allergies or special requests?',
  empty: 'Your cart is empty',
  unavailable: 'Unavailable',
  soldOut: 'Sold out',
  left: 'left',
  onlyLeft: 'Only {n} left in stock',
  table: 'Table',
  all: 'All',
  menuUnavailable: 'Menu is not available',
  menuUnavailableHint: 'This restaurant isn’t accepting orders right now. Please check back later.',

  // Tab / orders
  myOrders: 'My orders',
  tabTotal: 'Total so far',
  payNote: 'Show this to the staff when you are ready to pay.',
  orderN: 'Order',
  showItems: 'Show items',
  hideItems: 'Hide',
  orderPlaced: 'Order placed!',

  // Order statuses
  statusPending: 'Received',
  statusPreparing: 'Preparing',
  statusReady: 'Ready',
  statusServed: 'Served',
  statusCancelled: 'Cancelled',

  // Feedback
  feedbackTitle: 'How was your experience?',
  comment: 'Comment (optional)',
  cancel: 'Cancel',
  submit: 'Submit',
  thanks: 'Thank you for your feedback!',
  close: 'Close',
};

export type UIStrings = typeof en;

const ko: UIStrings = {
  chooseLanguage: '언어를 선택하세요',
  chooseServing: '어떻게 드시겠어요?',
  dineIn: '매장 식사',
  dineInHint: '테이블에서 드세요',
  takeOut: '포장',
  takeOutHint: '가져가실 수 있게 포장',
  back: '뒤로',

  addToCart: '담기',
  cart: '주문 내역',
  placeOrder: '주문하기',
  total: '합계',
  note: '요청사항',
  noteHint: '알레르기나 요청사항이 있으신가요?',
  empty: '장바구니가 비어 있습니다',
  unavailable: '품절',
  soldOut: '품절',
  left: '개 남음',
  onlyLeft: '재고가 {n}개 남았습니다',
  table: '테이블',
  all: '전체',
  menuUnavailable: '메뉴를 이용할 수 없습니다',
  menuUnavailableHint: '지금은 주문을 받지 않습니다. 나중에 다시 시도해 주세요.',

  myOrders: '내 주문',
  tabTotal: '현재 합계',
  payNote: '결제하실 때 직원에게 보여주세요.',
  orderN: '주문',
  showItems: '내역 보기',
  hideItems: '접기',
  orderPlaced: '주문이 완료되었습니다!',

  statusPending: '접수됨',
  statusPreparing: '조리 중',
  statusReady: '준비 완료',
  statusServed: '제공됨',
  statusCancelled: '취소됨',

  feedbackTitle: '오늘 어떠셨나요?',
  comment: '의견 (선택)',
  cancel: '취소',
  submit: '보내기',
  thanks: '소중한 의견 감사합니다!',
  close: '닫기',
};

const ru: UIStrings = {
  chooseLanguage: 'Выберите язык',
  chooseServing: 'Как вы будете есть?',
  dineIn: 'В зале',
  dineInHint: 'Поесть здесь, за столиком',
  takeOut: 'С собой',
  takeOutHint: 'Упаковать навынос',
  back: 'Назад',

  addToCart: 'Добавить',
  cart: 'Ваш заказ',
  placeOrder: 'Заказать',
  total: 'Итого',
  note: 'Особые пожелания',
  noteHint: 'Аллергия или особые пожелания?',
  empty: 'Корзина пуста',
  unavailable: 'Недоступно',
  soldOut: 'Распродано',
  left: 'осталось',
  onlyLeft: 'Осталось всего {n}',
  table: 'Стол',
  all: 'Все',
  menuUnavailable: 'Меню недоступно',
  menuUnavailableHint: 'Ресторан сейчас не принимает заказы. Пожалуйста, зайдите позже.',

  myOrders: 'Мои заказы',
  tabTotal: 'Итого на данный момент',
  payNote: 'Покажите это официанту при оплате.',
  orderN: 'Заказ',
  showItems: 'Показать состав',
  hideItems: 'Скрыть',
  orderPlaced: 'Заказ принят!',

  statusPending: 'Принят',
  statusPreparing: 'Готовится',
  statusReady: 'Готов',
  statusServed: 'Подан',
  statusCancelled: 'Отменён',

  feedbackTitle: 'Как вам у нас?',
  comment: 'Комментарий (необязательно)',
  cancel: 'Отмена',
  submit: 'Отправить',
  thanks: 'Спасибо за ваш отзыв!',
  close: 'Закрыть',
};

const uz: UIStrings = {
  chooseLanguage: 'Tilni tanlang',
  chooseServing: 'Qanday tanovul qilasiz?',
  dineIn: 'Shu yerda',
  dineInHint: 'Stolda tanovul qilish',
  takeOut: 'Olib ketish',
  takeOutHint: 'O‘rab berishadi',
  back: 'Orqaga',

  addToCart: 'Qo‘shish',
  cart: 'Buyurtmangiz',
  placeOrder: 'Buyurtma berish',
  total: 'Jami',
  note: 'Maxsus izoh',
  noteHint: 'Allergiya yoki maxsus so‘rovingiz bormi?',
  empty: 'Savatingiz bo‘sh',
  unavailable: 'Mavjud emas',
  soldOut: 'Tugadi',
  left: 'ta qoldi',
  onlyLeft: 'Atigi {n} ta qoldi',
  table: 'Stol',
  all: 'Hammasi',
  menuUnavailable: 'Menyu mavjud emas',
  menuUnavailableHint: 'Hozircha buyurtma qabul qilinmayapti. Keyinroq urinib ko‘ring.',

  myOrders: 'Buyurtmalarim',
  tabTotal: 'Hozirgi jami',
  payNote: 'To‘lov vaqtida buni xodimga ko‘rsating.',
  orderN: 'Buyurtma',
  showItems: 'Tarkibini ko‘rish',
  hideItems: 'Yashirish',
  orderPlaced: 'Buyurtma qabul qilindi!',

  statusPending: 'Qabul qilindi',
  statusPreparing: 'Tayyorlanmoqda',
  statusReady: 'Tayyor',
  statusServed: 'Berildi',
  statusCancelled: 'Bekor qilindi',

  feedbackTitle: 'Sizga qanday yoqdi?',
  comment: 'Izoh (ixtiyoriy)',
  cancel: 'Bekor qilish',
  submit: 'Yuborish',
  thanks: 'Fikringiz uchun rahmat!',
  close: 'Yopish',
};

const dictionaries: Record<Lang, UIStrings> = { en, ko, ru, uz };

export function getStrings(lang: Lang): UIStrings {
  return dictionaries[lang] ?? en;
}
