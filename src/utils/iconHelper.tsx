import {
  Church,
  BookOpen,
  Bell,
  Car,
  Utensils,
  Store,
  Sprout,
  Hammer,
  Shield,
  HeartHandshake,
  Coffee,
  Sparkles,
  Flame,
  Music,
  Compass,
  FileText,
  type LucideProps
} from 'lucide-react';

export const AVAILABLE_ICONS = [
  { name: 'Church', label: 'Biserică / Altar', component: Church },
  { name: 'BookOpen', label: 'Evanghelie / Strană', component: BookOpen },
  { name: 'Bell', label: 'Clopot / Paracliserie', component: Bell },
  { name: 'Car', label: 'Mașină / Șoferie', component: Car },
  { name: 'Utensils', label: 'Trapeză / Bucătărie', component: Utensils },
  { name: 'Store', label: 'Pangar / Magazin', component: Store },
  { name: 'Sprout', label: 'Grădină / Gospodărie', component: Sprout },
  { name: 'Hammer', label: 'Atelier / Meșteșug', component: Hammer },
  { name: 'Flame', label: 'Lumânare / Candele', component: Flame },
  { name: 'Music', label: 'Muzică psaltică', component: Music },
  { name: 'HeartHandshake', label: 'Ospitalitate / Arhondaric', component: HeartHandshake },
  { name: 'Coffee', label: 'Ceainărie / Pelerini', component: Coffee },
  { name: 'Compass', label: 'Pelerinaje / Ghidaj', component: Compass },
  { name: 'Shield', label: 'Pază / Poartă', component: Shield },
  { name: 'Sparkles', label: 'Curățenie / Îngrijire', component: Sparkles },
  { name: 'FileText', label: 'Secretariat / Arhivă', component: FileText },
];

export function renderModuleIcon(iconName: string, props: LucideProps = {}) {
  const iconItem = AVAILABLE_ICONS.find(i => i.name.toLowerCase() === iconName.toLowerCase());
  const IconComponent = iconItem ? iconItem.component : Church;
  return <IconComponent {...props} />;
}
