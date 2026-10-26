#!/usr/bin/env python3
"""Extract a small historical sample from an immutable official Câmara checkout.

No identity is matched by this script using names. It retains idDeputado supplied
by the Câmara, whose own upstream mapping limitations are documented separately.
Requires Python 3 standard library only. Usage:
  python3 scripts/build-snapshot.py --checkout /path/to/dados-abertos
"""
import argparse
import csv
import hashlib
import io
import json
import subprocess
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

COMMIT = '66a902e32b02b1ef43e273dac73384998e9c1c9f'
RELATIVE_PATH = 'dados-extras/votacoes/fontes/PlenVotos-L55.csv'
DOCUMENTATION_PATH = 'dados-extras/votacoes/fontes/README.md'
VOTING_ID = '6063'
LIMIT = 24


def normalized(value):
    return ''.join(c for c in unicodedata.normalize('NFD', value) if not unicodedata.combining(c)).casefold()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkout', required=True)
    parser.add_argument('--output', default='data/historical-snapshot.json')
    args = parser.parse_args()
    root = Path(args.checkout).resolve()
    commit = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
    if commit != COMMIT:
        raise SystemExit(f'Unexpected upstream commit: {commit}; expected {COMMIT}.')
    # Read the committed bytes, not a potentially modified working-copy file.
    raw = subprocess.check_output(['git', '-C', str(root), 'show', f'{COMMIT}:{RELATIVE_PATH}'])
    checksum = hashlib.sha256(raw).hexdigest()
    collected = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    candidates = {}
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')), delimiter=';')
    for line, row in enumerate(reader, start=2):
        if row['plenVotacaoId'].strip() != VOTING_ID:
            continue
        official_id = row['idDeputado'].strip()
        if not official_id.isdigit() or int(official_id) <= 0:
            continue
        if official_id in candidates:
            raise SystemExit('Duplicate upstream deputy in selected voting; investigate before extraction.')
        candidates[official_id] = (line, row)
    selected = sorted(candidates.values(), key=lambda item: (normalized(item[1]['nomParlamentar'].strip()), int(item[1]['idDeputado'])))[:LIMIT]
    if len(selected) != LIMIT:
        raise SystemExit(f'Expected {LIMIT} records, got {len(selected)}.')
    politicians = []
    for line, row in selected:
        official_id = int(row['idDeputado'])
        event_date = row['datRegistroVoto'].strip()[:10]
        name = row['nomParlamentar'].strip()
        document_id = f'PlenVotos-L55:votacao-{VOTING_ID}:deputado-{official_id}:linha-{line}'
        source = {
            'id': f'camara-archive-{official_id}-{VOTING_ID}',
            'publisher': 'Câmara dos Deputados — repositório oficial Dados Abertos',
            'title': f'Registro histórico no Plenário em {event_date} — identificação, partido e UF daquela data',
            'url': f'https://github.com/camaradosdeputados/dados-abertos/blob/{COMMIT}/{quote(RELATIVE_PATH)}#L{line}',
            'documentId': document_id,
            'eventDate': event_date,
            'publishedAt': None,
            'collectedAt': collected,
            'verifiedAt': collected,
            'excerpt': f"idDeputado={official_id}; nomeParlRegistrado={row['nomeParlRegistrado'].strip()}; nomParlamentar={name}; sigPartido={row['sigPartido'].strip()}; sigUF={row['sigUF'].strip()}; datRegistroVoto={row['datRegistroVoto'].strip()}. Consulta ao arquivo histórico; não verifica situação atual.",
            'kind': 'primary',
            'verification': 'official-import',
        }
        politicians.append({
            'id': f'camara:{official_id}', 'officialId': official_id, 'name': name,
            'fullName': None, 'party': row['sigPartido'].strip(), 'uf': row['sigUF'].strip(),
            'role': 'Deputado(a) federal', 'municipality': None,
            'status': 'Registro histórico — exercício atual não verificado', 'legislature': 55,
            'photoUrl': None, 'referenceDate': event_date, 'collectedAt': collected,
            'coverage': 'historical', 'education': None, 'source': source,
            'timeline': [{
                'id': f'camara:{official_id}:votacao:{VOTING_ID}', 'date': event_date,
                'title': 'Registro em votação nominal',
                'description': 'Registro no sistema de votações do Plenário da Câmara na 55ª legislatura. Partido e UF se referem a esta data. Um registro nominal não equivale à presença geral em sessões. O sentido do voto não é apresentado sem o contexto da deliberação.',
                'source': source,
            }],
            'proposals': [], 'legalRecords': [],
        })
    result = {
        'metadata': {
            'upstreamRepository': 'https://github.com/camaradosdeputados/dados-abertos',
            'upstreamCommit': COMMIT, 'path': RELATIVE_PATH, 'sha256': checksum,
            'documentation': f'https://github.com/camaradosdeputados/dados-abertos/blob/{COMMIT}/{DOCUMENTATION_PATH}',
            'collectedAt': collected, 'referenceDate': '2015-02-03', 'count': len(politicians),
            'selection': '24 primeiros nomes em ordem alfabética normalizada entre os registros com idDeputado preenchido na votação nominal 6063; sem seleção partidária e sem pretensão de representatividade estatística.',
            'limitations': [
                'Amostra histórica: não comprova exercício atual, partido atual ou cobertura nacional.',
                'idDeputado foi relacionado ao cadastro central pela própria Câmara; sua documentação informa associação por nomes e registros não resolvidos. Este extrator não cria novas associações por nome.',
                'nomParlamentar vem de tabela complementar da fonte; nomeParlRegistrado fica preservado no trecho, sem afirmar nome civil.',
                'Data de publicação do documento não informada. Coleta e verificação indicam conferência do arquivo histórico, não atualização dos fatos para o presente.',
                'Sem imagens, patrimônio, promessas ou processos publicados; nenhuma inferência de ausência de processos.',
            ],
        },
        'politicians': politicians,
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(politicians)} registros oficiais históricos extraídos. SHA256 {checksum}')


if __name__ == '__main__':
    main()
