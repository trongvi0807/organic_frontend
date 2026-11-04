import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isAdminItemActive } from '@/constants/adminNavigation';
import { cn } from '@/lib/utils';
import { AdminAttentionBadge, useAdminAttention } from './AdminAttentionBadge';

function SectionTab({ item, target, active }) {
  const attention = useAdminAttention(item), Icon = item.icon;
  return <Link to={target} aria-current={active ? 'page' : undefined} title={attention.count ? attention.label : undefined}
    className={cn('admin-section-tab', active && 'is-active', attention.count > 0 && 'needs-attention', attention.unread > 0 && 'has-unread')}>
    <Icon size={17} aria-hidden="true" />{item.name}<AdminAttentionBadge attention={attention} />
  </Link>;
}

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
      return <SectionTab key={item.path} item={item} target={lastPaths?.[item.path] || `/admin/${item.path}`} active={isAdminItemActive(item, pathname)} />;
    })}
  </nav>;
}
