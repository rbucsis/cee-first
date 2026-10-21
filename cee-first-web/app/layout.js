import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/layout/Navbar';

export const metadata = {
  title: 'CEE-First Director Portal',
  description: 'Early Childhood Education Management Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-app text-main w-screen h-screen overflow-hidden flex flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="grow w-full mx-auto px-6 py-8 overflow-y-auto">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}