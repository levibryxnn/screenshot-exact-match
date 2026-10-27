import { z } from 'zod';

const httpsUrl = z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'É necessária uma URL HTTPS sem credenciais.');
const date = z.string().refine((value) => {
  if(!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const [year,month,day]=value.slice(0,10).split('-').map(Number);
  const normalized=new Date(Date.UTC(year,month-1,day));
  return normalized.getUTCFullYear()===year && normalized.getUTCMonth()===month-1 && normalized.getUTCDate()===day;
}, 'Data inválida.');
export const legalStatuses = ['allegation', 'investigation', 'formal-accusation', 'ongoing', 'appealable-conviction', 'final-conviction', 'acquittal', 'dismissed', 'annulled', 'other'] as const;

export function isOfficialSource(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    if (url.hostname === 'github.com') return /^\/camaradosdeputados\/dados-abertos\/blob\/[a-f0-9]{40}\//.test(url.pathname);
    return /(^|\.)(camara\.leg\.br|senado\.leg\.br|tse\.jus\.br|cnj\.jus\.br|stf\.jus\.br|stj\.jus\.br|tcu\.gov\.br)$/.test(url.hostname);
  } catch { return false; }
}

export function isOfficialCamaraPhotoUrl(value: string, officialId: number): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash
      && url.hostname === 'www.camara.leg.br'
      && url.pathname === `/internet/deputado/bandep/${officialId}.jpg`;
  } catch { return false; }
}

export const citationSchema = z.object({
  id: z.string().min(1).max(200), publisher: z.string().min(1).max(300), title: z.string().min(1).max(1000),
  url: httpsUrl, documentId: z.string().max(1000).nullable(), eventDate: date.nullable(), publishedAt: date.nullable(),
  collectedAt: date, verifiedAt: date.nullable(), excerpt: z.string().max(20000).nullable(),
  kind: z.enum(['primary', 'secondary']), verification: z.enum(['official-import', 'reviewed', 'unverified']),
}).superRefine((value, ctx) => {
  if (value.verification === 'official-import' && (value.kind !== 'primary' || !isOfficialSource(value.url))) {
    ctx.addIssue({ code: 'custom', message: 'Importação oficial exige fonte primária oficial autorizada.' });
  }
  if (value.verifiedAt && Date.parse(value.verifiedAt) > Date.parse(value.collectedAt) + 86400000) {
    ctx.addIssue({ code: 'custom', message: 'Verificação posterior à coleta precisa de nova coleta.' });
  }
});

export const legalRecordSchema = z.object({
  id: z.string().min(1), title: z.string().min(3).max(500), nature: z.enum(['criminal', 'civil', 'electoral', 'administrative']),
  status: z.enum(legalStatuses), summary: z.string().min(20).max(10000), body: z.string().min(2),
  caseNumber: z.string().min(1), individualInvolvement: z.string().min(10), defense: z.string().nullable(),
  verifiedAt: date, reviewer: z.string().min(3), reviewReason: z.string().min(10), source: citationSchema,
  history: z.array(z.object({ date, status: z.enum(legalStatuses), description: z.string().min(5), source: citationSchema })),
}).superRefine((value, ctx) => {
  const text = `${value.title} ${value.summary}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sourceUrl=new URL(value.source.url);
  if (!value.source.documentId || /\/(?:perfil|deputados?)\/(?:-|\d+)(?:\/|$)/.test(sourceUrl.pathname)) {
    ctx.addIssue({code:'custom', message:'O registro exige documento do caso, não uma página genérica de perfil.'});
  }
  if(Date.parse(value.verifiedAt)>Date.now()+60000 || value.history.some(event=>Date.parse(event.date)>Date.parse(value.verifiedAt))) {
    ctx.addIssue({code:'custom', message:'Verificação não pode estar no futuro ou anteceder os desfechos registrados.'});
  }
  if (value.source.kind !== 'primary' || !isOfficialSource(value.source.url) || value.source.verification !== 'reviewed') {
    ctx.addIssue({ code: 'custom', message: 'Publicação sensível exige documento oficial primário e revisão humana.' });
  }
  if (/crime comprovado|culpado|criminos[oa]|corrupt[oa]/.test(text)) {
    ctx.addIssue({ code: 'custom', message: 'A classificação processual deve ser factual, sem rótulos de culpabilidade.' });
  }
  if (!['appealable-conviction', 'final-conviction'].includes(value.status) && /condenad[oa]|condenacao vigente|condenacao definitiva/.test(text)) {
    ctx.addIssue({ code: 'custom', message: 'O texto não pode apresentar investigação ou outro estado como condenação.' });
  }
  if (value.status === 'appealable-conviction' && /transitad[oa] em julgado|condenacao definitiva/.test(text)) {
    ctx.addIssue({ code: 'custom', message: 'Condenação recorrível não é decisão definitiva.' });
  }
  if (value.nature !== 'criminal' && /condenacao criminal|crime comprovado/.test(text)) {
    ctx.addIssue({ code: 'custom', message: 'Não aplicar categoria criminal a procedimento de outra natureza.' });
  }
  const latest = [...value.history].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  if (!latest || latest.status !== value.status) {
    ctx.addIssue({ code: 'custom', message: 'Situação vigente deve corresponder ao último desfecho documentado.' });
  }
  if (Date.now() - Date.parse(value.verifiedAt) > 90 * 86400000) {
    ctx.addIssue({ code: 'custom', message: 'Verificação processual superior a 90 dias exige nova revisão antes da publicação.' });
  }
});

export function validateEditorialLegalRecord(record: unknown) { return legalRecordSchema.parse(record); }

const timelineSchema = z.object({id:z.string().min(1), date, title:z.string().min(1), description:z.string().min(1), source:citationSchema});
const proposalSchema = z.object({id:z.string().min(1), code:z.string().min(1), title:z.string().min(1), date:date.nullable(), status:z.string().min(1), source:citationSchema});
export const politicianSchema = z.object({
  id: z.string().regex(/^(?:camara|senado):\d+$/), officialId: z.number().int().positive(), name: z.string().min(1).max(200),
  fullName:z.string().max(300).nullable(), party:z.string().min(1).max(50), uf:z.string().regex(/^[A-Z]{2}$/),
  role:z.string().min(1).max(100), municipality:z.string().nullable(), status:z.string().min(1), legislature:z.number().int().positive().nullable(),
  photoUrl:httpsUrl.nullable(), referenceDate:date.nullable(), collectedAt:date, coverage:z.enum(['historical','live']),
  education:z.string().nullable(), source:citationSchema, timeline:z.array(timelineSchema), proposals:z.array(proposalSchema), legalRecords:z.array(legalRecordSchema),
}).superRefine((value, ctx) => {
  if (value.id !== `${value.id.split(':')[0]}:${value.officialId}`) ctx.addIssue({code:'custom', message:'Identificador interno deve corresponder ao identificador oficial.'});
  if (value.photoUrl && !isOfficialCamaraPhotoUrl(value.photoUrl, value.officialId)) ctx.addIssue({code:'custom', message:'Foto deve ser o retrato oficial HTTPS correspondente ao ID da Câmara.'});
  if (value.photoUrl && value.coverage === 'historical') ctx.addIssue({code:'custom', message:'Retrato atual não pode ser associado automaticamente a registro histórico.'});
});

export const correctionSchema = z.object({
  politicianId:z.string().regex(/^(?:camara|senado):\d+$/), subject:z.string().trim().min(15).max(2000), evidenceUrl:httpsUrl,
});

export function validatePoliticians(input: unknown) {
  const records = z.array(politicianSchema).min(1).max(10000).parse(input);
  if (new Set(records.map((record) => record.id)).size !== records.length) throw new Error('IDs oficiais duplicados na importação.');
  return records;
}
