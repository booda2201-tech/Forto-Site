/**
 * Central place for business details and shared navigation.
 * Values were taken from the brand's official Facebook / Instagram pages.
 */
export const SITE = {
  name: 'فورتو ',
  latinName: 'Forto',
  descriptor: 'Car Center',
  tagline: 'عناية تليق بـ سيارتك',
  description: 'أعلى معايير الجودة في الميكانيكا، السمكرة، والنانو سيراميك.',

  /** International format, digits only (+20 10 31555255). */
  whatsappNumber: '201031555255',
  phoneDisplay: '010 31555255',
  phoneHref: 'tel:+201031555255',
  email: 'fortocars@gmail.com',
  whatsappMessage: 'مرحباً فورتو، أرغب في حجز موعد.',

  address: 'محطة فيول أب (Fuel Up) على الطريق الدائري - الهرم، الجيزة',
  /** Google Maps location (29.9999656, 31.0997028). */
  mapsUrl: 'https://maps.app.goo.gl/DX4WnsP9wBNCGhq56',

  social: {
    instagram: 'https://www.instagram.com/forto.car.care/',
    facebook: 'https://www.facebook.com/profile.php?id=61586214549326',
  },
} as const;

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: 'الرئيسية', href: '#home' },
  { label: 'خدماتنا', href: '#services' },
  { label: 'المركز', href: '#center' },
  { label: 'الفيديوهات', href: '#reels' },
  { label: 'معرض الأعمال', href: '#gallery' },
  { label: 'تواصل معنا', href: '#contact' },
];

/** Builds a click-to-chat link using the WhatsApp (wa.me) API. */
export function whatsappLink(message: string = SITE.whatsappMessage): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
