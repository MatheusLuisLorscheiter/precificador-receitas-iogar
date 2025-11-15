import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="fixed inset-0 -z-10 bg-gradient-to-b from-background via-background to-surface" />

            <div className="flex min-h-screen flex-col">
                <Header />

                <main className="flex-1 py-10">
                    <div className="container">
                        <Outlet />
                    </div>
                </main>

                <footer className="border-t border-border bg-card/70 py-6 text-center text-sm text-muted">
                    © {new Date().getFullYear()} Precificador de Receitas. Todos os direitos reservados.
                </footer>
            </div>
        </div>
    );
}
