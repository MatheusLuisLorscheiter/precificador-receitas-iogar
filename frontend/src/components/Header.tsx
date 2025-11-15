import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, Settings, Menu, X, Home, Package, BookOpen, ShoppingBag, ChefHat, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import ConfirmDialog from './ConfirmDialog';

export default function Header() {
    const { user, clearAuth } = useAuthStore();
    const { theme, toggleTheme } = useThemeStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';
    const userName = user?.name ?? 'Usuário';

    const handleLogout = () => {
        clearAuth();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/ingredients', label: 'Ingredientes', icon: Package },
        { path: '/recipes', label: 'Receitas', icon: BookOpen },
        { path: '/products', label: 'Produtos', icon: ShoppingBag },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-2xl">
                <div className="container">
                    <div className="flex h-20 items-center justify-between gap-4">
                        <Link to="/" className="group flex items-center gap-3 no-underline">
                            <div className="gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-soft">
                                <ChefHat size={24} strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-lg font-semibold leading-tight text-foreground">Precificador</p>
                                <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted">Receitas</p>
                            </div>
                        </Link>

                        <nav className="hidden items-center gap-2 md:flex">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium no-underline transition-all ${isActive(item.path)
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted hover:bg-border/40 hover:text-foreground'
                                        }`}
                                >
                                    <item.icon size={18} strokeWidth={2} />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="hidden items-center gap-3 md:flex">
                            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/80 px-3 py-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
                                    {userInitial}
                                </div>
                                <span className="text-sm font-semibold text-foreground">{userName}</span>
                            </div>

                            <button
                                onClick={toggleTheme}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted transition-all hover:-translate-y-0.5 hover:text-foreground"
                                title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
                            >
                                {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
                            </button>

                            <Link
                                to="/settings"
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted transition-all hover:-translate-y-0.5 hover:text-foreground no-underline"
                                title="Configurações"
                            >
                                <Settings size={18} strokeWidth={2} />
                            </Link>

                            <button
                                onClick={() => setShowLogoutDialog(true)}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted transition-all hover:-translate-y-0.5 hover:text-danger"
                                title="Sair"
                            >
                                <LogOut size={18} strokeWidth={2} />
                            </button>
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-foreground md:hidden"
                        >
                            {mobileMenuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <div className="md:hidden">
                            <div className="mt-4 flex flex-col gap-2 rounded-3xl border border-border bg-card/80 p-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium no-underline transition-all ${isActive(item.path)
                                            ? 'bg-primary text-primary-foreground shadow-soft'
                                            : 'text-foreground hover:bg-border/40'
                                            }`}
                                    >
                                        <item.icon size={20} strokeWidth={2} />
                                        {item.label}
                                    </Link>
                                ))}

                                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-surface/80 px-4 py-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                                        {userInitial}
                                    </div>
                                    <span className="text-base font-semibold text-foreground">{userName}</span>
                                </div>

                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-base font-medium text-foreground"
                                >
                                    {theme === 'light' ? <Moon size={20} strokeWidth={2} /> : <Sun size={20} strokeWidth={2} />}
                                    {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
                                </button>

                                <Link
                                    to="/settings"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-base font-medium text-foreground no-underline"
                                >
                                    <Settings size={20} strokeWidth={2} />
                                    Configurações
                                </Link>

                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        setShowLogoutDialog(true);
                                    }}
                                    className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-left text-base font-medium text-danger"
                                >
                                    <LogOut size={20} strokeWidth={2} />
                                    Sair
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <ConfirmDialog
                isOpen={showLogoutDialog}
                onClose={() => setShowLogoutDialog(false)}
                onConfirm={handleLogout}
                title="Confirmar Logout"
                message="Tem certeza que deseja sair do sistema?"
                confirmText="Sair"
                cancelText="Cancelar"
                variant="warning"
            />
        </>
    );
}
