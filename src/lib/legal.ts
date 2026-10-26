export const LEGAL_STATUSES = [
  { key: "alegacao", label: "Alegação pública não comprovada", desc: "Afirmação divulgada sem procedimento formal aberto." },
  { key: "investigacao", label: "Investigação formal", desc: "Inquérito ou procedimento instaurado; não comprova culpa." },
  { key: "denuncia", label: "Denúncia / acusação formal", desc: "Peça acusatória apresentada; não equivale a condenação." },
  { key: "andamento", label: "Processo em andamento", desc: "Ação judicial em curso, sem decisão final." },
  { key: "condenacao_recorrivel", label: "Condenação sujeita a recurso", desc: "Decisão desfavorável ainda passível de reforma." },
  { key: "transitado", label: "Condenação transitada em julgado", desc: "Decisão definitiva, sem recursos possíveis." },
  { key: "absolvicao", label: "Absolvição", desc: "Decisão judicial favorável ao envolvido." },
  { key: "arquivamento", label: "Arquivamento", desc: "Procedimento encerrado sem acusação ou julgamento." },
  { key: "anulacao", label: "Anulação ou reforma", desc: "Decisão anterior desfeita ou modificada." },
  { key: "outro", label: "Outro desfecho relevante", desc: "Ex.: prescrição, acordo, extinção de punibilidade." },
] as const;
