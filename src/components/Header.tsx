'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ScanLine, Waves } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('civis-reduced-motion') === 'true';
    setReduced(saved);
    document.documentElement.dataset.reducedMotion = String(saved);
  }, []);
  function toggle() {
    const value = !reduced;
    setReduced(value);
    document.documentElement.dataset.reducedMotion = String(value);
    localStorage.setItem('civis-reduced-motion', String(value));
  }
  return <>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Civis, início"><span className="brand-icon"><ScanLine size={23} strokeWidth={1.7} /></span><span>CIVIS<span className="brand-period">.</span><small>ÍNDICE PÚBLICO</small></span></Link>
      <nav aria-label="Navegação principal">
        <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Explorar</Link>
        <Link href="/comparar" aria-current={pathname === '/comparar' ? 'page' : undefined}>Comparar</Link>
        <Link href="/metodologia" aria-current={pathname === '/metodologia' ? 'page' : undefined}>Metodologia<ArrowUpRight size={12} /></Link>
      </nav>
      <div className="header-actions"><button className="motion-toggle" onClick={toggle} aria-pressed={reduced} aria-label={reduced ? 'Ativar animações opcionais' : 'Reduzir animações opcionais'} title={reduced ? 'Movimento reduzido' : 'Reduzir movimento'}><Waves size={16} /><span>{reduced ? 'Sem movimento' : 'Reduzir movimento'}</span></button><Link className="admin-link" href="/admin">Revisão</Link></div>
    </header>
  </>;
}

export { Header };
