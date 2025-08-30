# File Processor Service API — Manual (v6.3.3)

> **Resumo:** Serviço HTTP em FastAPI para **extrair texto** de arquivos (PDF/DOCX/XLSX/TXT) e **gerar PDFs dinâmicos** com texto e imagens (local, remota ou Base64). Inclui paginação automática, bullets com recuo e validação forte para imagens.

---

## Índice
1. [Arquitetura & Recursos](#arquitetura--recursos)
2. [Instalação & Execução](#instalação--execução)
3. [Configurações](#configurações)
4. [Endpoints](#endpoints)
5. [Modelos (Schemas)](#modelos-schemas)
6. [Exemplos de uso](#exemplos-de-uso)
7. [Tratamento de erros](#tratamento-de-erros)
8. [Boas práticas & Segurança](#boas-práticas--segurança)
9. [Limites & Desempenho](#limites--desempenho)
10. [Changelog](#changelog)
11. [Roadmap (ideias futuras)](#roadmap-ideias-futuras)

---

## Arquitetura & Recursos
- **FastAPI** com **Swagger UI** em `/docs` e OpenAPI em `/openapi.json`.
- Extração de texto: **PDF** (PyMuPDF), **DOCX** (python-docx), **XLSX** (openpyxl), **TXT**.
- Geração de **PDF dinâmico** com [fpdf2].
  - Título, headings/subheadings, parágrafos, listas com bullets (recuo/hanging indent), blocos `key_value`, espaçadores, **imagens**.
  - **Quebra automática de página** com cálculo de altura (`ensure_space`).
  - **Bullets** com recuo de 4 mm e quebra correta em múltiplas linhas.
  - **Rodapé com numeração** opcional.
  - Suporte a **DejaVuSans** (Unicode). Fallback para Arial caso fontes não estejam presentes.
- Imagens: **Base64**, **URL http(s)** (com User-Agent + Referer) ou **arquivo local**.
  - Base64: aceita **data URL** (`data:image/png;base64,...`), remove espaços, corrige padding e **valida** se o binário é imagem.
  - Remotas: bloqueio de SSRF a hosts internos (localhost, 127.0.0.1, 0.0.0.0).
- CORS habilitado (configurável por env).

---

## Instalação & Execução
1. **Python 3.11+** recomendado.
2. Crie um ambiente virtual e instale dependências:
   ```bash
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. **Execute** o servidor:
   ```bash
   uvicorn main:app --reload
   ```
4. Acesse a documentação interativa: **http://127.0.0.1:8000/docs**.

**Fonts (opcional):** para melhor compatibilidade Unicode, deixe estes arquivos ao lado do `main.py`:
- `DejaVuSans.ttf`
- `DejaVuSans-Bold.ttf`

> Sem eles, o serviço usa Arial.

---

## Configurações
- **CORS**: variável `CORS_ALLOW_ORIGINS` (padrão `*`). Separe múltiplas origens por vírgula.
- **Limites** (definidos em código):
  - `MAX_UPLOAD_BYTES` = 20 MB para `/api/process-file`.
  - `MAX_IMAGE_BYTES` = 15 MB **por imagem** no PDF.
  - `HTTP_TIMEOUT_SECS` = 12 s para download de imagens remotas.
- **Proteção SSRF**: `DISALLOWED_HOSTS = {"localhost","127.0.0.1","0.0.0.0"}`.

---

## Endpoints

### `GET /`
Retorna status e versão do serviço.

**Resposta**
```json
{ "status": "File Processor Service is running!", "version": "6.3.3" }
```

### `POST /api/process-file`
**Descrição:** Recebe um arquivo e devolve o texto extraído (JSON) ou um `.txt` (streaming).

**Query params**
- `return_as`: `json` (padrão) | `txt`
- `download`: boolean (só para `return_as=txt`) – `true` baixa; `false` exibe inline

**Body (multipart/form-data)**
- `file`: arquivo `.pdf`, `.docx`, `.xlsx` ou `.txt`

**Respostas**
- `200` JSON com texto extraído (para `return_as=json`).
- `200` streaming `text/plain` (para `return_as=txt`).

**Exemplo (cURL)**
```bash
curl -X POST "http://127.0.0.1:8000/api/process-file?return_as=json" \
  -F "file=@/caminho/arquivo.pdf"
```

### `POST /api/create-pdf`
**Descrição:** Gera um PDF a partir de um documento JSON.

**Query params**
- `download`: boolean – `true` baixa; `false` abre inline

**Body (application/json)**
- Objeto [`DynamicPDF`](#dynamicpdf)

**Resposta**
- `200` streaming `application/pdf`

**Observações**
- Quebra de página automática.
- Bullets com recuo próprio (4 mm) e quebra correta.
- Alinhamentos: `L` (esq.), `C` (centro), `R` (dir.).

---

## Modelos (Schemas)

### `ImageContent`
```json
{
  "src": "https://dominio/imagem.png",     // opcional se base64_data presente
  "base64_data": "data:image/png;base64,....", // ou Base64 puro
  "width": 120,   // mm, opcional
  "height": 60,   // mm, opcional
  "align": "C"   // L, C, R (padrão C)
}
```
> **Regra:** informe **src** **ou** **base64_data**. Se só um deles vier vazio, 400.

### `ContentBlock`
```json
{
  "type": "heading | subheading | paragraph | bullet_list | key_value | spacer | image",
  "content": "...",      // string | lista | dict | inteiro | ImageContent
  "style": { "background_color": [245,245,245] },
  "line_height": 6.0,     // opcional (mm)
  "align": "L"            // para paragraph
}
```

### `PDFOptions`
```json
{
  "author": "Autor", "subject": "Assunto", "keywords": "k1,k2",
  "margins_mm": [17,15,17],     // [esq, topo, dir]
  "page_numbers": true,
  "title_align": "C",
  "theme_text_color": [0,0,0],  // cor padrão do texto
  "allow_remote_images": true
}
```

### `DynamicPDF`
```json
{
  "filename": "saida_pdf",
  "title": "Título do Documento",
  "content_blocks": [ /* ContentBlock[] */ ],
  "options": { /* PDFOptions */ }
}
```

---

## Exemplos de uso

### 1) Imagem via Base64 (válida)
```json
{
  "filename": "com_imagem_base64",
  "title": "Imagem Base64",
  "content_blocks": [
    { "type": "heading", "content": "Logo" },
    {
      "type": "image",
      "content": {
        "base64_data": "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVR4nGP8z8Dwn4EIwESMolGF1FMIAD2cAhK2AyPVAAAAAElFTkSuQmCC",
        "width": 60,
        "align": "C"
      }
    }
  ]
}
```

### 2) Relatório com bullets e indicadores
```json
{
  "filename": "relatorio_agosto",
  "title": "Relatório de Atividades - Agosto",
  "options": { "author": "EloiTech", "page_numbers": true, "margins_mm": [17,15,17] },
  "content_blocks": [
    { "type": "heading", "content": "1. Visão Geral" },
    { "type": "paragraph", "content": "Este relatório apresenta os principais indicadores e entregas do mês." },
    { "type": "bullet_list", "content": ["Feature X entregue", "Integração Y publicada", "Correções críticas resolvidas"] },
    { "type": "subheading", "content": "Indicadores-Chave", "style": { "background_color": [245,245,245] } },
    { "type": "key_value", "content": { "Projetos": "5", "Entregas": "12", "Erros críticos": "0" } },
    { "type": "paragraph", "content": "Conclusão centrada.", "align": "C", "line_height": 7.5 }
  ]
}
```

### 3) Imagem remota
```json
{
  "filename": "imagem_remota",
  "title": "Imagem Remota",
  "content_blocks": [
    { "type": "heading", "content": "Logo remoto" },
    { "type": "image", "content": { "src": "https://picsum.photos/seed/ping/600/300", "width": 120, "align": "C" } }
  ]
}
```
> Se o host retornar **403**, converta a imagem para Base64 e use o formato acima.

### 4) cURL — gerar PDF
```bash
curl -X POST "http://127.0.0.1:8000/api/create-pdf?download=true" \
  -H "Content-Type: application/json" \
  -d @payload.json --output saida.pdf
```

### 5) JavaScript (fetch) — criar PDF
```js
const payload = { /* DynamicPDF */ };
fetch("http://127.0.0.1:8000/api/create-pdf?download=true", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
}).then(r => r.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = payload.filename + ".pdf"; a.click();
    URL.revokeObjectURL(url);
  });
```

### 6) Python (requests) — processar arquivo
```python
import requests
files = {"file": open("/caminho/arquivo.pdf", "rb")}
r = requests.post("http://127.0.0.1:8000/api/process-file?return_as=json", files=files)
print(r.json())
```

---

## Tratamento de erros
- **400 Base64 inválido**: a string não é Base64 válido / truncada / não representa imagem.
- **400 Imagem remota bloqueada (403)**: host recusou; use Base64 ou outro domínio.
- **400 Tipo de arquivo não suportado**: verifique extensão/MIME.
- **413 Tamanho excedido**: arquivo enviado ou imagem maior que o limite.
- **422 Validation Error**: JSON não bate com o schema (ex.: `image` sem `content` válido).
- **500 Erro geral ao gerar o PDF**: exceção inesperada; conferir logs.

**Dicas**
- Para Base64: prefira data URL ou Base64 puro sem quebras de linha; o serviço já corrige padding automaticamente.
- Se usar querystring para enviar Base64, `+` pode virar espaço — sempre envie no **body JSON**.

---

## Boas práticas & Segurança
- **SSRF:** URLs internas são bloqueadas (localhost/127.0.0.1/0.0.0.0).
- **Timeouts:** 12s em downloads remotos; trate lentidão de hosts externos.
- **Fonts:** use DejaVu para textos com acentos/Unicode.
- **Paginação:** quebras elegantes; evite `line_height` muito baixo (<5.5 mm).
- **Imagens grandes:** informe `width` para respeitar as margens; o serviço ajusta proporcionalmente.

---

## Limites & Desempenho
- PDF é gerado em memória e devolvido como **stream**.
- Processamento síncrono por requisição — para alto volume, orquestre em fila (Celery/RQ) e persista o PDF.
- O cálculo de quebra usa `split_only` do fpdf2, rápido e preciso.

---

## Changelog
- **6.3.3**
  - Decoder Base64 **tolerante** (data URL, espaços, padding, urlsafe) + **validação de imagem** (Pillow).
  - Bullets com **recuo de 4 mm** e **quebras corretas** por item.
  - `ensure_space()` para evitar "invasão" de margem/rodapé.
- **6.3.2**
  - Migração total para **Pydantic v2** (`model_validator`, `field_validator`).
  - Tratamento de **403** em imagens remotas e headers (UA/Referer).
- **6.3.1**
  - Melhoria de headers, metadados de PDF, margens configuráveis, fallback de fontes.

---

## Roadmap (ideias futuras)
- Bloco **table** (tabelas com colunas automáticas e bordas).
- Bloco **divider** (linha/separador com espessura/cor).
- **Header**/rodapé customizáveis por página (logo, data).
- **Watermark** (texto/imagem com opacidade).
- Suporte a **A4 landscape** e outros formatos.
- Upload de imagens no mesmo POST (multipart) além de Base64.

---