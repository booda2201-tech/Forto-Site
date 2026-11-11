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
  /** Used by the scroll-spy to mark the link that matches the current page / section. */
  key: string;
  /** Page to open. Left out for in-page links, which stay on the page you are reading. */
  route?: string;
  /** Section of the page to scroll to. */
  fragment?: string;
}

/** Each department is its own page; "العنوان والتواصل" scrolls to the map and phone on any page. */
export const NAV_LINKS: readonly NavLink[] = [
  { label: 'الرئيسية', key: 'home', route: '/' },
  { label: 'الغسيل والتلميع', key: 'car-care', route: '/car-care' },
  { label: 'الميكانيكا والصيانة', key: 'service', route: '/service' },
  { label: 'السمكرة والحماية', key: 'protection', route: '/protection' },
  { label: 'العنوان والتواصل', key: 'contact', fragment: 'contact' },
];

/** Builds a click-to-chat link using the WhatsApp (wa.me) API. */
export function whatsappLink(message: string = SITE.whatsappMessage): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
