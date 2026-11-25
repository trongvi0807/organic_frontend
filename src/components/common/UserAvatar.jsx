import { useState } from 'react';
import { UserRound } from 'lucide-react';

export function UserAvatar({ user, className = '', iconSize = 21, initials }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const url = user?.avatarUrl;
  const name = user?.fullName || user?.username || 'bạn';
  return <span className={`user-avatar ${className}`}>
    {url && url !== failedUrl
      ? <img src={url} alt={`Ảnh đại diện của ${name}`} onError={() => setFailedUrl(url)} />
      : initials ? <span aria-hidden="true">{initials}</span> : <UserRound size={iconSize} aria-hidden="true" />}
  </span>;
}
