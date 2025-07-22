export interface City {
  id: number;
  name: string;
}

export interface Governorate {
  id: number;
  name: string;
  cities: City[];
}

export const jordanGovernorates: Governorate[] = [
  {
    id: 1,
    name: 'عمان',
    cities: [
      { id: 1, name: 'عمان' },
      { id: 2, name: 'الجبيهة' },
      { id: 3, name: 'صويلح' },
      { id: 4, name: 'تلاع العلي' },
      { id: 5, name: 'خلدا' },
      { id: 6, name: 'مرج الحمام' },
      { id: 7, name: 'ناعور' },
      { id: 8, name: 'القويسمة' },
      { id: 9, name: 'أبو نصير' },
      { id: 10, name: 'شفا بدران' },
      { id: 11, name: 'طارق' },
      { id: 12, name: 'ماركا' },
      { id: 13, name: 'الهاشمي الشمالي' },
      { id: 14, name: 'جبل الحسين' },
      { id: 15, name: 'الجبل الأخضر' },
      { id: 16, name: 'المدينة الرياضية' },
      { id: 17, name: 'أم أذينة' },
      { id: 18, name: 'الدوار السابع' },
      { id: 19, name: 'الرابية' },
      { id: 20, name: 'الصويفية' },
    ],
  },
  {
    id: 2,
    name: 'إربد',
    cities: [
      { id: 21, name: 'إربد' },
      { id: 22, name: 'الرمثا' },
      { id: 23, name: 'الحصن' },
      { id: 24, name: 'بني كنانة' },
      { id: 25, name: 'الكورة' },
      { id: 26, name: 'الطيبة' },
      { id: 27, name: 'المزار الشمالي' },
      { id: 28, name: 'بني عبيد' },
      { id: 29, name: 'المشارع' },
      { id: 30, name: 'الشونة الشمالية' },
    ],
  },
  {
    id: 3,
    name: 'الزرقاء',
    cities: [
      { id: 31, name: 'الزرقاء' },
      { id: 32, name: 'الرصيفة' },
      { id: 33, name: 'السخنة' },
      { id: 34, name: 'الهاشمية' },
      { id: 35, name: 'الضليل' },
      { id: 36, name: 'الأزرق' },
    ],
  },
  {
    id: 4,
    name: 'المفرق',
    cities: [
      { id: 37, name: 'المفرق' },
      { id: 38, name: 'البادية الشمالية' },
      { id: 39, name: 'الرويشد' },
      { id: 40, name: 'صبحا' },
      { id: 41, name: 'الخالدية' },
      { id: 42, name: 'بلعما' },
    ],
  },
  {
    id: 5,
    name: 'البلقاء',
    cities: [
      { id: 43, name: 'السلط' },
      { id: 44, name: 'عين الباشا' },
      { id: 45, name: 'دير علا' },
      { id: 46, name: 'الشونة الجنوبية' },
      { id: 47, name: 'ماحص' },
      { id: 48, name: 'الفحيص' },
    ],
  },
  {
    id: 6,
    name: 'مادبا',
    cities: [
      { id: 49, name: 'مادبا' },
      { id: 50, name: 'ذيبان' },
      { id: 51, name: 'جرينة' },
      { id: 52, name: 'مليح' },
    ],
  },
  {
    id: 7,
    name: 'الكرك',
    cities: [
      { id: 53, name: 'الكرك' },
      { id: 54, name: 'المزار الجنوبي' },
      { id: 55, name: 'القصر' },
      { id: 56, name: 'غور الصافي' },
      { id: 57, name: 'المرج' },
      { id: 58, name: 'عي' },
    ],
  },
  {
    id: 8,
    name: 'جرش',
    cities: [
      { id: 59, name: 'جرش' },
      { id: 60, name: 'المصطبة' },
      { id: 61, name: 'برما' },
      { id: 62, name: 'ساكب' },
    ],
  },
  {
    id: 9,
    name: 'معان',
    cities: [
      { id: 63, name: 'معان' },
      { id: 64, name: 'البتراء' },
      { id: 65, name: 'الشوبك' },
      { id: 66, name: 'وادي موسى' },
    ],
  },
  {
    id: 10,
    name: 'عجلون',
    cities: [
      { id: 67, name: 'عجلون' },
      { id: 68, name: 'كفرنجة' },
      { id: 69, name: 'عنجرة' },
      { id: 70, name: 'صخرة' },
    ],
  },
  {
    id: 11,
    name: 'الطفيلة',
    cities: [
      { id: 71, name: 'الطفيلة' },
      { id: 72, name: 'بصيرا' },
      { id: 73, name: 'الحسا' },
      { id: 74, name: 'العيص' },
    ],
  },
  {
    id: 12,
    name: 'العقبة',
    cities: [
      { id: 75, name: 'العقبة' },
      { id: 76, name: 'القويرة' },
      { id: 77, name: 'الديسة' },
      { id: 78, name: 'الريشة' },
    ],
  },
];