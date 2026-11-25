import type { AuthSession, StaffPosition } from '../types';

export const TURKMEN_REGIONS: string[] = [
  'Aşgabat şäheri',
  'Arkadag şäheri',
  'Ahal welaýaty',
  'Balkan welaýaty',
  'Daşoguz welaýaty',
  'Lebap welaýaty',
  'Mary welaýaty',
];

export const STAFF_POSITIONS: {
  value: StaffPosition;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: 'Baş Seýis / Seýis',
    shortLabel: 'Seýis',
    description: 'Bedewleriň türgenleşigi, gündelik iýmitlendirişi we şejere gözegçiligi',
  },
  {
    value: 'Weterinar lukman',
    shortLabel: 'Weterinar',
    description: 'IoT biometrika, saglyk barlaglary we öňüni alyş bejergisi',
  },
  {
    value: '«Ýaşyl Athana» Eko-Inžener',
    shortLabel: 'Eko-Inžener',
    description: 'Gün panelleri, ýagyş suwy süzgüji, howa we bio-kompost gözegçiligi',
  },
];

export const DEMO_USER_SESSION_TEMPLATE: Omit<AuthSession, 'loggedInAt'> = {
  userId: 'usr-demo-001',
  fullName: 'Aýlar Gurbanowa',
  emailOrPhone: 'aylar.gurbanowa@ahalteke.tm',
  role: 'user',
  region: 'Arkadag şäheri',
  isDemo: true,
};

export const DEMO_STAFF_SESSION_TEMPLATE: Omit<AuthSession, 'loggedInAt'> = {
  userId: 'stf-demo-001',
  fullName: 'Merdan Berdiýew',
  emailOrPhone: 'm.berdiyew@ahalteke.tm',
  role: 'staff',
  staffPosition: 'Baş Seýis / Seýis',
  complexId: 'cmp-ashgabat-01',
  complexName: 'Halkara Ahalteke Atçylyk Sport Toplumy',
  stableId: 'stb-01',
  stableName: 'Athana №1 — «Altyn Ganat»',
  isDemo: true,
};

export const DEMO_ADMIN_SESSION_TEMPLATE: Omit<AuthSession, 'loggedInAt'> = {
  userId: 'adm-demo-001',
  fullName: 'Döwlet Dolandyryjysy (Synag)',
  emailOrPhone: 'admin@ahalteke.tm',
  role: 'admin',
  region: 'Aşgabat şäheri',
  isDemo: true,
};
