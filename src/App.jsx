import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ShopProvider } from '@/contexts/ShopContext';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() { return <BrowserRouter><AuthProvider><ShopProvider><AppRoutes /><Toaster richColors position="bottom-right" closeButton /></ShopProvider></AuthProvider></BrowserRouter>; }
