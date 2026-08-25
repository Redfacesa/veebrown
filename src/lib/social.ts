export const VEEBROWN_SOCIAL = {
  instagram: '',
  facebook: '',
  email: 'mailto:valenciakabasele@gmail.com',
} as const;

export const VEEBROWN_SOCIAL_LINKS = [
  { id: 'email' as const, label: 'Email', href: VEEBROWN_SOCIAL.email, handle: 'valenciakabasele@gmail.com' },
].filter((l) => l.href);
