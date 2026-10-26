import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ShopProvider } from '@/contexts/ShopContext';
import { AppRoutes } from '@/routes/AppRoutes';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function App() { return <BrowserRouter><AuthProvider><NotificationProvider><ShopProvider><AppRoutes /><Toaster richColors position="bottom-right" closeButton /></ShopProvider></NotificationProvider></AuthProvider></BrowserRouter>; }
