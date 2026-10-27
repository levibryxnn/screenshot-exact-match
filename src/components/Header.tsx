'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Menu, Waves, X } from 'lucide-react';

const mobileLinks = [
  { href: '/', label: 'Início' },
  { href: '/#explorar', label: 'Políticos' },
  { href: '/cargos', label: 'Guia de cargos' },
  { href: '/comparar', label: 'Comparador' },
  { href: '/metodologia', label: 'Metodologia' },
];

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
      <Link href="/" className="brand" aria-label="PLENÁRIO, início"><img className="brand-logo" src="/plenario-logo.svg" alt="" width="178" height="48" /><span className="brand-subtitle">ÍNDICE PÚBLICO</span></Link>
      <nav aria-label="Navegação principal">
        <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Início</Link>
        <Link href="/#explorar">Políticos</Link>
        <Link href="/cargos" aria-current={pathname === '/cargos' ? 'page' : undefined}>Cargos</Link>
        <Link href="/comparar" aria-current={pathname === '/comparar' ? 'page' : undefined}>Comparador</Link>
        <Link href="/metodologia" aria-current={pathname === '/metodologia' ? 'page' : undefined}>Metodologia<ArrowUpRight size={12} /></Link>
      </nav>
      <Dialog.Root>
        <Dialog.Trigger className="mobile-menu-trigger" aria-label="Abrir menu" title="Abrir menu"><Menu size={17} aria-hidden="true" /><span>Menu</span></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="mobile-menu-overlay" />
          <Dialog.Content className="mobile-menu-sheet">
            <div className="mobile-menu-heading">
              <div><img className="mobile-menu-logo" src="/plenario-logo.svg" alt="PLENÁRIO" width="150" height="40" /><Dialog.Title className="sr-only">Navegação PLENÁRIO</Dialog.Title><Dialog.Description className="mobile-menu-description">Navegue pela plataforma</Dialog.Description></div>
              <Dialog.Close className="mobile-menu-close" aria-label="Fechar menu"><X size={19} aria-hidden="true" /></Dialog.Close>
            </div>
            <nav aria-label="Navegação móvel" className="mobile-menu-links">
              {mobileLinks.map((item, index) => <Dialog.Close asChild key={item.href}>
                <Link href={item.href} aria-current={pathname === item.href ? 'page' : undefined}>
                  <span className="mobile-menu-index">0{index + 1}</span><span>{item.label}</span><ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </Dialog.Close>)}
            </nav>
            <div className="mobile-menu-footer">
              <span>INFORMAÇÃO PÚBLICA.<br />ESCOLHA CONSCIENTE.</span>
              <Dialog.Close asChild><Link href="/admin">Área editorial<ArrowUpRight size={14} aria-hidden="true" /></Link></Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="header-actions"><button className="motion-toggle" onClick={toggle} aria-pressed={reduced} aria-label={reduced ? 'Ativar animações opcionais' : 'Reduzir animações opcionais'} title={reduced ? 'Movimento reduzido' : 'Reduzir movimento'}><Waves size={16} /><span>{reduced ? 'Sem movimento' : 'Reduzir movimento'}</span></button><Link className="admin-link" href="/admin">Revisão</Link></div>
    </header>
  </>;
}

export { Header };
