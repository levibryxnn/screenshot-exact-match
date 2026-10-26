'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="conteudo" className="page"><h1>Não foi possível carregar os registros.</h1><p>Ocorreu uma falha ao consultar a base. Tente novamente em instantes.</p><button className="button" onClick={reset}>Tentar novamente</button></main>}
