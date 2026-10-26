import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import './globals.css';
export const metadata: Metadata = { title: { default: 'CIVIS — Informação pública, escolha sua', template: '%s · CIVIS' }, description: 'Explore trajetórias políticas a partir de fontes oficiais. Sem rankings de honestidade, com proveniência e limites visíveis.' };
export const dynamic = 'force-dynamic';
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt-BR"><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><Header/>{children}<footer className="site-footer"><span>CIVIS <span className="muted">/ Informação pública, escolha sua.</span></span><nav aria-label="Links institucionais"><a href="/metodologia">Fontes e metodologia</a><a href="/correcoes">Solicitar correção</a><a href="/admin">Área editorial</a></nav><p className="muted">Cobertura inicial limitada. Ausência de registros não significa ausência de fatos ou processos.</p></footer></body></html>}
