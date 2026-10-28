import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isAdminItemActive } from '@/constants/adminNavigation';
import { cn } from '@/lib/utils';

// Page links preserve browser history and the existing route guards.
export default function AdminSectionTabs({ group, lastPaths }) {
  const { pathname } = useLocation();
  const nav = useRef(null);
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }, [pathname]);
  if (!group?.children) return null;
  return <nav ref={nav} aria-label={`Chức năng ${group.name}`} className="admin-section-tabs">
    {group.children.map((item) => {
      const active = isAdminItemActive(item, pathname), Icon = item.icon;
      return <Link key={item.path} to={lastPaths?.[item.path] || `/admin/${item.path}`} aria-current={active ? 'page' : undefined}
        className={cn('admin-section-tab', active && 'is-active')}><Icon size={17} aria-hidden="true" />{item.name}</Link>;
    })}
  </nav>;
}
