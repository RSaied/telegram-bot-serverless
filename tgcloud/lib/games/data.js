// Static content for the quiz and word games. Plain data — no imports.

export const QUIZ = [
  { q: { ar: 'ما هي عاصمة فرنسا؟', en: 'What is the capital of France?' }, a: { ar: 'باريس', en: 'Paris' }, wrong: { ar: ['لندن', 'روما', 'مدريد'], en: ['London', 'Rome', 'Madrid'] } },
  { q: { ar: 'كم عدد قارات العالم؟', en: 'How many continents are there?' }, a: { ar: '7', en: '7' }, wrong: { ar: ['5', '6', '8'], en: ['5', '6', '8'] } },
  { q: { ar: 'ما أكبر كوكب في المجموعة الشمسية؟', en: 'Largest planet in the Solar System?' }, a: { ar: 'المشتري', en: 'Jupiter' }, wrong: { ar: ['زحل', 'الأرض', 'المريخ'], en: ['Saturn', 'Earth', 'Mars'] } },
  { q: { ar: 'كم لونًا في قوس قزح؟', en: 'How many colors in a rainbow?' }, a: { ar: '7', en: '7' }, wrong: { ar: ['5', '6', '8'], en: ['5', '6', '8'] } },
  { q: { ar: 'ما أطول نهر في العالم؟', en: 'Longest river in the world?' }, a: { ar: 'النيل', en: 'Nile' }, wrong: { ar: ['الأمازون', 'الفرات', 'الدجلة'], en: ['Amazon', 'Euphrates', 'Tigris'] } },
  { q: { ar: 'ماذا يسمى صغير القط؟', en: 'What is a baby cat called?' }, a: { ar: 'هريرة', en: 'Kitten' }, wrong: { ar: ['جرو', 'حمل', 'مبروك'], en: ['Puppy', 'Lamb', 'Calf'] } },
  { q: { ar: 'كم ساعة في اليوم؟', en: 'How many hours in a day?' }, a: { ar: '24', en: '24' }, wrong: { ar: ['12', '48', '23'], en: ['12', '48', '23'] } },
  { q: { ar: 'ما الغاز الذي نتنفسه؟', en: 'Which gas do we breathe in?' }, a: { ar: 'الأكسجين', en: 'Oxygen' }, wrong: { ar: ['النيتروجين', 'الهيدروجين', 'ثاني أكسيد الكربون'], en: ['Nitrogen', 'Hydrogen', 'CO2'] } },
  { q: { ar: 'في أي قارة تقع مصر؟', en: 'Which continent is Egypt in?' }, a: { ar: 'أفريقيا', en: 'Africa' }, wrong: { ar: ['آسيا', 'أوروبا', 'أستراليا'], en: ['Asia', 'Europe', 'Australia'] } },
  { q: { ar: 'كم ضلعًا للمثلث؟', en: 'How many sides does a triangle have?' }, a: { ar: '3', en: '3' }, wrong: { ar: ['4', '5', '6'], en: ['4', '5', '6'] } },
];

export const WORDS_AR = ['مدرسة', 'مكتبة', 'حاسوب', 'برتقال', 'سماء', 'كتاب', 'شمس', 'قمر', 'بحر', 'جبل', 'نهر', 'طائرة'];
export const WORDS_EN = ['school', 'library', 'computer', 'orange', 'sky', 'book', 'sun', 'moon', 'sea', 'mountain', 'river', 'plane'];
