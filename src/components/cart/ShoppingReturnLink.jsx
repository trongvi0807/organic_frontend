import { Link, useLocation } from 'react-router-dom';
import { shoppingReturn, validShoppingReturn } from '@/lib/shoppingReturn';
export function ShoppingReturnLink({children,...props}) {
  const {state}=useLocation();
  const destination=state?.shoppingReturn ? validShoppingReturn(state.shoppingReturn) : shoppingReturn();
  return <Link {...props} to={destination.to} state={{restoreScroll:destination.y}}>{children}</Link>;
}
