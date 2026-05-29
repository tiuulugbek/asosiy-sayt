import type { ReactNode } from 'react';
import {
  Home,
  Wrench,
  Package,
  Tag,
  Stethoscope,
  Users,
  Baby,
  Building2,
  MapPin,
  Newspaper,
  Image,
  HelpCircle,
  Inbox,
  Star,
  Menu,
  BarChart3,
  ImageIcon,
  Settings,
  LayoutDashboard,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  badgeKey?: 'leads' | 'reviews';
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'Kontent boshqaruvi',
    items: [
      { key: '/', label: 'Bosh sahifa', icon: <Home size={18} /> },
      { key: '/homepage', label: 'Bosh sahifa kontenti', icon: <LayoutDashboard size={18} /> },
      { key: '/services', label: 'Xizmatlar', icon: <Wrench size={18} /> },
      { key: '/catalog', label: 'Katalog', icon: <Package size={18} /> },
      { key: '/brands', label: 'Brendlar', icon: <Tag size={18} /> },
    ],
  },
  {
    title: 'Xodimlar va bemorlar',
    items: [
      { key: '/doctors', label: 'Mutaxassislar', icon: <Stethoscope size={18} /> },
      { key: '/patients', label: 'Bemorlar', icon: <Users size={18} /> },
      { key: '/children-hearing', label: 'Bolalar', icon: <Baby size={18} /> },
    ],
  },
  {
    title: "Ma'lumotlar",
    items: [
      { key: '/about', label: 'Biz haqimizda', icon: <Building2 size={18} /> },
      { key: '/branches', label: 'Filiallar', icon: <MapPin size={18} /> },
      { key: '/posts', label: 'Yangiliklar', icon: <Newspaper size={18} /> },
      { key: '/banners', label: 'Slaydlar', icon: <Image size={18} /> },
    ],
  },
  {
    title: 'Muloqot',
    items: [
      { key: '/faq', label: 'Savol-Javob', icon: <HelpCircle size={18} /> },
      { key: '/leads', label: "So'rovlar", icon: <Inbox size={18} />, badgeKey: 'leads' },
      { key: '/reviews', label: 'Sharhlar', icon: <Star size={18} />, badgeKey: 'reviews' },
      { key: '/menus', label: 'Menyu', icon: <Menu size={18} /> },
    ],
  },
  {
    title: 'Tizim',
    items: [
      { key: '/traffic', label: 'Statistika', icon: <BarChart3 size={18} /> },
      { key: '/media', label: 'Media kutubxona', icon: <ImageIcon size={18} /> },
      { key: '/settings', label: 'Sozlamalar', icon: <Settings size={18} /> },
    ],
  },
];

export const breadcrumbLabels: Record<string, string> = {
  '/': 'Bosh sahifa',
  '/homepage': 'Bosh sahifa kontenti',
  '/services': 'Xizmatlar',
  '/catalog': 'Katalog',
  '/brands': 'Brendlar',
  '/doctors': 'Mutaxassislar',
  '/patients': 'Bemorlar',
  '/children-hearing': 'Bolalar',
  '/about': 'Biz haqimizda',
  '/branches': 'Filiallar',
  '/posts': 'Yangiliklar',
  '/banners': 'Slaydlar',
  '/faq': 'Savol-Javob',
  '/leads': "So'rovlar",
  '/reviews': 'Sharhlar',
  '/menus': 'Menyu',
  '/traffic': 'Statistika',
  '/media': 'Media kutubxona',
  '/settings': 'Sozlamalar',
  '/services/new': 'Yangi xizmat',
  '/catalog/new': 'Yangi katalog',
  '/brands/new': 'Yangi brend',
  '/doctors/new': 'Yangi mutaxassis',
  '/branches/new': 'Yangi filial',
  '/posts/new': 'Yangi yangilik',
  '/banners/new': 'Yangi slayd',
  '/faq/new': 'Yangi savol',
  '/patients/new': 'Yangi maqola',
  '/children-hearing/new': 'Yangi maqola',
};
