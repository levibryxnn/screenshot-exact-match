import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type {Politician} from '../src/lib/types';
let politicians:Politician[]=[];
test.beforeAll(async({request})=>{const r=await request.get('/api/politicians?pageSize=100');expect(r.ok()).toBeTruthy();politicians=(await r.json()).items;expect(politicians.length).toBeGreaterThanOrEqual(2)});
async function home(page:Page){await page.goto('/');await expect(page.getByRole('heading',{level:1})).toBeVisible()}

test('busca normalizada, filtros, seleção e estado vazio',async({page})=>{
 await home(page);await expect(page).toHaveTitle('PLENÁRIO — Informação pública, escolha sua');await expect(page.getByRole('link',{name:'PLENÁRIO, início'})).toBeVisible();const logo=page.locator('.brand-logo');await expect(logo).toHaveAttribute('src','/plenario-logo.svg');await expect.poll(()=>logo.evaluate((image:HTMLImageElement)=>image.naturalWidth)).toBeGreaterThan(0);const officialPhotos=page.locator('img[alt^="Foto oficial de "]');expect(await officialPhotos.count()).toBeGreaterThan(0);await expect(officialPhotos.first()).toHaveAttribute('src',/^\/api\/photos\//);const target=politicians.find(p=>p.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'')!==p.name)??politicians[0];
 const search=page.getByRole('textbox',{name:'Buscar político por nome'});
 await search.fill(target.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase());
 await expect(page.getByRole('button',{name:`Selecionar ${target.name}`,exact:true})).toBeVisible();
 await page.getByRole('button',{name:`Selecionar ${target.name}`,exact:true}).click();
 await expect(page.getByRole('complementary',{name:'Perfil selecionado'}).getByRole('heading',{name:target.name})).toBeVisible();
 await search.fill('');await page.getByRole('combobox',{name:'Filtrar por partido'}).selectOption(target.party);
 await page.getByRole('combobox',{name:'Filtrar por estado'}).selectOption(target.uf);
 const cards=page.locator('.character-card');expect(await cards.count()).toBeGreaterThan(0);
 for(const card of await cards.all())await expect(card.locator('.card-party')).toContainText(target.party);
 await search.fill('nome inexistente 987654321');await expect(page.getByRole('heading',{name:'Nenhum perfil encontrado'})).toBeVisible();
 await page.getByRole('button',{name:'Limpar busca e filtros'}).click();await expect(page.locator('.character-card')).toHaveCount(Math.min(8,politicians.length));
 const roleTabs=page.getByRole('group',{name:'Filtrar políticos por cargo'});await roleTabs.getByRole('button',{name:'Senadores'}).click();
 await expect(page.locator('.character-card')).toHaveCount(Math.min(8,politicians.filter(p=>p.role==='Senador(a)').length));
 for(const card of await page.locator('.character-card').all())await expect(card.locator('.card-role')).toHaveText('Senador(a)');
 await roleTabs.getByRole('button',{name:'Todos'}).click();await expect(page.locator('.character-card')).toHaveCount(Math.min(8,politicians.length));
});

test('menu lateral mobile abre com animação, fecha e navega por teclado e toque',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const trigger=page.getByRole('button',{name:'Abrir menu'});await expect(trigger).toBeVisible();await trigger.click();
 const dialog=page.getByRole('dialog',{name:'Navegação PLENÁRIO'});await expect(dialog).toBeVisible();await expect(dialog.getByRole('link',{name:'Comparador'})).toBeVisible();
 expect(await dialog.evaluate(element=>getComputedStyle(element).animationName)).toContain('menu-sheet-in');expect(await page.locator('html').evaluate(element=>getComputedStyle(element).getPropertyValue('--ease-out-3').trim())).toContain('cubic-bezier');
 const accessibility=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();expect(accessibility.violations).toEqual([]);
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await trigger.click();await dialog.getByRole('link',{name:'Metodologia'}).click();
 await expect(page).toHaveURL(/\/metodologia$/);await expect(page).toHaveTitle('Fontes e metodologia · PLENÁRIO');
});

test('guia de cargos explica os níveis de governo, fontes e adapta-se ao mobile',async({page})=>{
 await page.goto('/cargos');
 await expect(page).toHaveTitle('Quem faz o quê? Guia dos cargos públicos · PLENÁRIO');
 await expect(page.getByRole('heading',{level:1,name:/Quem faz o quê no poder público/})).toBeVisible();
 for(const role of ['Vereador(a)','Prefeito(a)','Deputado(a) estadual','Governador(a)','Deputado(a) federal','Senador(a)','Presidente da República'])
  await expect(page.getByRole('heading',{name:role,exact:true})).toBeVisible();
 const cards=page.locator('.office-card');await expect(cards).toHaveCount(13);
 await expect(page.locator('.office-source')).toHaveCount(13);
 for(const card of await cards.all()){
  await expect(card.getByRole('heading',{name:'O que faz'})).toBeVisible();
  await expect(card.getByText('Bom saber:',{exact:false})).toBeVisible();
  await expect(card.getByRole('link',{name:/Constituição Federal/})).toHaveAttribute('href',/^https:\/\/www\.planalto\.gov\.br\/ccivil_03\/constituicao\/constituicao\.htm/);
 }
 await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze().then(result=>expect(result.violations).toEqual([]));
 await page.screenshot({path:'test-results/cargos-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Abrir menu'}).click();
 const menu=page.getByRole('dialog',{name:'Navegação PLENÁRIO'});
 await expect(menu.getByRole('link',{name:'Guia de cargos'})).toBeVisible();
 await page.keyboard.press('Escape');await expect(menu).toBeHidden();
 const mobileAxe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(mobileAxe.violations).toEqual([]);
 await page.screenshot({path:'test-results/cargos-mobile.png',fullPage:true});
});

test('perfil real, proveniência, teclado e lacunas explícitas',async({page})=>{
 const p=politicians[0];await page.goto(`/politicos/${encodeURIComponent(p.id)}`);
 await expect(page.getByRole('heading',{name:p.name,exact:true})).toBeVisible();
 await expect(page.getByText('Nenhum registro jurídico revisado nesta base',{exact:true})).toBeVisible();
 const trigger=page.getByRole('button',{name:'Fonte da identificação',exact:true});await trigger.click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('link',{name:'Abrir documento original'})).toHaveAttribute('href',p.source.url);
 await expect(dialog).toContainText('Fonte primária');await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
 await page.keyboard.press('Tab');await expect(page.locator(':focus')).not.toHaveCount(0);
});

test('comparação entre dois perfis selecionados',async({page})=>{
 await home(page);const cards=page.locator('.character-card');
 await cards.nth(0).getByRole('button',{name:/Adicionar .* à comparação/}).click();
 await cards.nth(1).getByRole('button',{name:/Adicionar .* à comparação/}).click();
 await page.locator('.comparison-dock').getByRole('link',{name:'Comparar',exact:true}).click();
 await expect(page).toHaveURL(/\/comparar\?ids=/);await expect(page.getByRole('table')).toBeVisible();
 await expect(page.getByRole('table')).toContainText(politicians[0].name);await expect(page.getByRole('table')).toContainText(politicians[1].name);
 await expect(page.getByText(/Sem uma nota geral/).first()).toBeVisible();
});

test('admin requer autenticação; CSRF é bloqueado; correção é persistida e restrita',async({page,request,baseURL})=>{
 const noAuth=await request.post('/api/admin/review',{headers:{Origin:baseURL!},data:{}});expect(noAuth.status()).toBe(401);
 const csrf=await request.post('/api/admin/login',{headers:{Origin:'https://externo.example'},data:{password:'teste'}});expect(csrf.status()).toBe(403);
 const p=politicians[0];await page.goto(`/correcoes?politico=${encodeURIComponent(p.id)}`);
 await page.getByLabel('O que precisa ser corrigido?').fill('Solicitação de teste E2E — conferir a data documental do registro.');
 await page.getByLabel('Link HTTPS do documento que fundamenta o pedido').fill(p.source.url);
 await page.getByRole('button',{name:'Registrar solicitação'}).click();await expect(page.getByRole('status')).toContainText('Pedido registrado. Protocolo:');
 await page.goto('/admin');await expect(page.getByText('Solicitação de teste E2E',{exact:false})).not.toBeVisible();
 await page.getByLabel('Senha administrativa').fill(process.env.CIVIS_E2E_ADMIN_PASSWORD!);await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Solicitações de correção'})).toBeVisible();await expect(page.getByText('Solicitação de teste E2E — conferir a data documental do registro.',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByText('Solicitação de teste E2E — conferir a data documental do registro.',{exact:true})).toBeVisible();
 // Fixture editorial intencionalmente inválida, armazenada só em banco de teste e nunca publicada.
 const draft=await page.request.post('/api/admin/draft',{headers:{Origin:baseURL!},data:{politicianId:p.id,title:'Fixture fictício de teste — não publicar',reason:'Teste de controle editorial, não constitui relato sobre pessoa real.',payload:{status:'investigation',summary:'Condenado em processo fictício usado somente neste teste.'}}});
 expect(draft.status()).toBe(201);const draftId=(await draft.json()).id;
 const forbiddenPublication=await page.request.post('/api/admin/review',{headers:{Origin:baseURL!},data:{id:draftId,decision:'approved',reason:'Teste exige que registro incompleto nunca seja aprovado.'}});expect(forbiddenPublication.status()).toBe(400);
 const reject=await page.request.post('/api/admin/review',{headers:{Origin:baseURL!},data:{id:draftId,decision:'rejected',reason:'Fixture fictício de teste sem evidência, rejeitado definitivamente.'}});expect(reject.status()).toBe(200);
 const publicProfile=await page.request.get(`/api/politicians/${encodeURIComponent(p.id)}`);expect((await publicProfile.json()).legalRecords).toEqual([]);
 await page.getByRole('button',{name:'Encerrar sessão'}).click();await expect(page.getByRole('heading',{name:'Entrar como editor'})).toBeVisible();
});

test('acessibilidade desktop, móvel e preferência de movimento reduzido',async({page})=>{
 await home(page);let result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);
 await page.screenshot({path:'test-results/home-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
 expect(await page.evaluate(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBeTruthy();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Abrir menu'}).click();const menu=page.getByRole('dialog',{name:'Navegação PLENÁRIO'});await expect(menu).toBeVisible();expect(await menu.evaluate(element=>getComputedStyle(element).animationName)).toBe('none');await page.keyboard.press('Escape');await expect(menu).toBeHidden();
 result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);
 await page.screenshot({path:'test-results/home-mobile.png',fullPage:true});
 await page.goto(`/politicos/${encodeURIComponent(politicians[0].id)}`);await expect(page.getByRole('heading',{name:politicians[0].name,exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);
});

test('registrar métricas locais de carregamento em produção',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await home(page);await page.waitForLoadState('networkidle');
 await page.getByRole('textbox',{name:'Buscar político por nome'}).fill(politicians[0].name);await expect(page.locator('.character-card')).toHaveCount(1);
 const metrics=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;const resources=performance.getEntriesByType('resource') as PerformanceResourceTiming[];const js=resources.filter(r=>r.name.includes('/_next/')&&r.name.includes('.js'));return {measuredAt:new Date().toISOString(),viewport:{width:innerWidth,height:innerHeight},ttfbMs:Math.round(n.responseStart-n.requestStart),domContentLoadedMs:Math.round(n.domContentLoadedEventEnd-n.startTime),loadMs:Math.round(n.loadEventEnd-n.startTime),jsRequests:js.length,jsTransferBytes:js.reduce((s,r)=>s+r.transferSize,0),note:'Medição local Chromium em produção, sem limitação de rede/CPU; não é Lighthouse nem previsão de desempenho de usuário real.'}});
 expect(errors).toEqual([]);await testInfo.attach('performance-local.json',{body:JSON.stringify(metrics,null,2),contentType:'application/json'});console.log('METRICAS_LOCAIS',JSON.stringify(metrics));
});
