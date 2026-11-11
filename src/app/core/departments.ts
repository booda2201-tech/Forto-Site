import { whatsappLink } from './site.config';

/** A photo shown on a department page (the place itself, or finished work). */
export interface DepartmentPhoto {
  title: string;
  /** Small label above the title. */
  category: string;
  /** Image under `public/` (served from the site root). */
  image: string;
  /** CSS `object-position` used to frame the crop. */
  focus: string;
}

/** One service of a department, with a line saying what it covers. */
export interface DepartmentService {
  title: string;
  detail: string;
}

/** An Instagram reel, self-hosted under `public/brand/reels`. */
export interface Reel {
  /** Instagram shortcode, from instagram.com/reel/<code>. */
  code: string;
  title: string;
  poster: string;
  video: string;
}

export type DepartmentSlug = 'car-care' | 'service' | 'protection';

/**
 * One department of the Forto station. Car Care, Service and Protection are three separate
 * shops side by side, so each one gets its own page (`/car-care`, `/service`, `/protection`).
 */
export interface Department {
  slug: DepartmentSlug;
  /** What the department does, in plain words: "الغسيل والتلميع". */
  title: string;
  /** Latin brand name: "Forto Car Care". */
  brand: string;
  /** Arabic brand name: "فورتو كار كير". */
  role: string;
  /** One line shown under the title on the department page. */
  tagline: string;
  /** Short description used on the home page card. */
  description: string;
  /** What is done in this department (short list for the home page card). */
  items: readonly string[];
  /** The same services with a line of detail each, for the department page. */
  services: readonly DepartmentService[];
  /** A few sentences about the department, for its page. */
  about: string;
  /** Cover photo (home card + page header). */
  image: string;
  focus: string;
  /** SVG path data (24x24 stroke icon). */
  paths: readonly string[];
  /** The department's own space in the station. */
  place: readonly DepartmentPhoto[];
  /** Finished work. */
  works: readonly DepartmentPhoto[];
  reels: readonly Reel[];
  /** Pre-filled WhatsApp text for this department. */
  bookingUrl: string;
  seoTitle: string;
  seoDescription: string;
}

const REEL = (code: string, title: string): Reel => ({
  code,
  title,
  poster: `brand/reels/${code}.jpg`,
  video: `brand/reels/${code}.mp4`,
});

export const DEPARTMENTS: readonly Department[] = [
  {
    slug: 'car-care',
    title: 'الغسيل والتلميع',
    brand: 'Forto Car Care',
    role: 'فورتو كار كير',
    tagline: 'عربيتك تطلع من عندنا نضيفة ولمّاعة، من المحرك للجنوط للداخلية.',
    description: 'عربيتك تطلع من عندنا نضيفة ولمّاعة، من المحرك للجنوط للداخلية.',
    items: [
      'غسيل كيميائي كامل: محرك وداخلية وجنوط',
      'تلميع وإزالة الخدوش',
      'إزالة الأسمنت والقطران من الدهان',
    ],
    services: [
      { title: 'غسيل كيميائي كامل', detail: 'المحرك والداخلية والجنوط، داخل مساحات مجهّزة للغسيل.' },
      { title: 'تلميع وإزالة الخدوش', detail: 'تلميع احترافي وعناية دقيقة بكل تفصيلة في طلاء سيارتك.' },
      { title: 'إزالة الأسمنت والقطران', detail: 'بنشيلهم من الدهان ونرجّعله لمعته.' },
    ],
    about:
      'فورتو كار كير هو محل الغسيل والتلميع في محطة فيول أب على الطريق الدائري. بتيجي بعربيتك وتطلع بيها نضيفة من جوه ومن برّه، ودهانها لامع من غير خدوش. القسم له منطقتين في المحطة: منطقة غسيل ومنطقة تلميع.',
    image: 'brand/detailing-coupe.jpg',
    focus: '40% 30%',
    paths: [
      'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
      'M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z',
    ],
    place: [
      { title: 'منطقة التلميع', category: 'Detailing Zone', image: 'brand/place-angle.jpg', focus: '50% 38%' },
      { title: 'منطقة الغسيل', category: 'Wash Zone', image: 'brand/place-front.jpg', focus: '50% 40%' },
    ],
    works: [
      { title: 'تلميع وإزالة الخدوش', category: 'قبل وبعد', image: 'brand/detailing-coupe.jpg', focus: '50% 80%' },
    ],
    reels: [REEL('DUkvIOhjvh1', 'أمام المركز'), REEL('DU5-gQ2Dnz4', 'المحطة بالليل')],
    bookingUrl: whatsappLink('مرحباً فورتو، أرغب في حجز موعد في قسم الغسيل والتلميع.'),
    seoTitle: 'الغسيل والتلميع - فورتو كار كير | الهرم، الجيزة',
    seoDescription:
      'فورتو كار كير: غسيل كيميائي كامل للمحرك والداخلية والجنوط، وتلميع وإزالة الخدوش، في محطة فيول أب على الطريق الدائري - الهرم.',
  },
  {
    slug: 'service',
    title: 'الميكانيكا والصيانة',
    brand: 'Forto Service',
    role: 'فورتو سيرفيس',
    tagline: 'بنكشف على عربيتك ونصلّحها على إيد فنيين متخصصين.',
    description: 'بنكشف على عربيتك ونصلّحها على إيد فنيين متخصصين.',
    items: ['فحص وصيانة المحرك', 'العفشة ونظام التعليق'],
    services: [
      { title: 'فحص وصيانة المحرك', detail: 'بنكشف على العربية ونحدد المطلوب قبل ما نبدأ.' },
      { title: 'العفشة ونظام التعليق', detail: 'فحص وإصلاح على إيد فنيين متخصصين.' },
    ],
    about:
      'فورتو سيرفيس هو محل الميكانيكا والصيانة في محطة فيول أب على الطريق الدائري. ورشة مجهّزة بالكامل وفنيين متخصصين، بنكشف على عربيتك ونصلّحها، من المحرك للعفشة ونظام التعليق.',
    image: 'brand/workshop.jpg',
    focus: '50% 38%',
    paths: [
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    ],
    place: [{ title: 'ورشة مجهّزة بالكامل', category: 'الورشة', image: 'brand/workshop.jpg', focus: '50% 40%' }],
    works: [],
    reels: [
      REEL('DfNFLvHCG3s', 'ورشة فورتو من الداخل'),
      REEL('DffKc34O8KR', 'جولة في المركز'),
      REEL('De4TRS7j1Tj', 'نصيحة من فريق فورتو'),
      REEL('Dew3IJYij8h', 'كلمة من فريق الورشة'),
    ],
    bookingUrl: whatsappLink('مرحباً فورتو، أرغب في حجز موعد في قسم الميكانيكا والصيانة.'),
    seoTitle: 'الميكانيكا والصيانة - فورتو سيرفيس | الهرم، الجيزة',
    seoDescription:
      'فورتو سيرفيس: فحص وصيانة المحرك والعفشة ونظام التعليق على إيد فنيين متخصصين، في محطة فيول أب على الطريق الدائري - الهرم.',
  },
  {
    slug: 'protection',
    title: 'السمكرة والحماية',
    brand: 'Forto Protection',
    role: 'فورتو بروتكشن',
    tagline: 'نرجّع دهان عربيتك زي الجديد، وبعدها نحميه بطبقة نانو سيراميك.',
    description: 'نرجّع دهان عربيتك زي الجديد، وبعدها نحميه بطبقة نانو سيراميك.',
    items: [
      'سمكرة ودهان (دوكو)',
      'من الحادث لحد التسليم',
      'نانو سيراميك: لمعان عميق وحماية كل يوم',
    ],
    services: [
      { title: 'سمكرة ودهان (دوكو)', detail: 'غرفة دهان مجهّزة، ونرجّع دهان عربيتك زي الجديد.' },
      { title: 'من الحادث لحد التسليم', detail: 'بنصلّح العربية بعد الحادث ونسلّمها جاهزة.' },
      { title: 'نانو سيراميك', detail: 'لمعان عميق وحماية للدهان كل يوم.' },
    ],
    about:
      'فورتو بروتكشن هو محل السمكرة والدهان والحماية في محطة فيول أب على الطريق الدائري. بنصلّح العربية بعد الحادث ونرجّع دهانها زي الجديد في غرفة دهان مجهّزة، وبعدها نحميه بطبقة نانو سيراميك.',
    image: 'brand/paint-booth.jpg',
    focus: '50% 62%',
    paths: [
      'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
      'm9 12 2 2 4-4',
    ],
    place: [{ title: 'غرفة الدهان', category: 'الورشة', image: 'brand/paint-booth.jpg', focus: '50% 55%' }],
    works: [
      { title: 'من الحادث للتسليم', category: 'سمكرة ودهان', image: 'brand/accident-to-done.jpg', focus: '50% 40%' },
    ],
    reels: [
      REEL('DfU20ZosxTV', 'داخل غرفة الدهان'),
      REEL('DfXR7lvxPVW', 'عربيتك بلونك'),
      REEL('De608BuC6Wh', 'سمكرة بالإيد'),
      REEL('DfR_hHsBrsU', 'عربيتك اتخبطت'),
      REEL('DfCnDFDhOuh', 'من الحادث للتسليم'),
    ],
    bookingUrl: whatsappLink('مرحباً فورتو، أرغب في حجز موعد في قسم السمكرة والحماية.'),
    seoTitle: 'السمكرة والحماية - فورتو بروتكشن | الهرم، الجيزة',
    seoDescription:
      'فورتو بروتكشن: سمكرة ودهان (دوكو) ونانو سيراميك، من الحادث لحد التسليم، في محطة فيول أب على الطريق الدائري - الهرم.',
  },
];

/** The station itself, shown on every department page: all three shops share it. */
export const STATION_PHOTO: DepartmentPhoto = {
  title: 'المحطة من فوق',
  category: 'محطة فيول أب - الطريق الدائري',
  image: 'brand/place-aerial.jpg',
  focus: '50% 45%',
};

export function departmentBySlug(slug: string | null | undefined): Department | undefined {
  return DEPARTMENTS.find((d) => d.slug === slug);
}
