# File Processor Service

**Resumo:** Um serviço HTTP construído com FastAPI para **extrair texto** de diversos tipos de arquivos (PDF, DOCX, XLSX, TXT) e **gerar PDFs dinâmicos** a partir de dados estruturados em JSON. Inclui uma interface web simples para demonstração e uma API robusta e bem documentada.

---

## ▶️ Recursos Principais

-   **Interface Web Amigável**: Uma página de demonstração (`index.html`) para testar as funcionalidades de forma visual e intuitiva.
-   **Extração de Texto Universal**: Suporte para extrair conteúdo de:
    -   `.pdf` (usando PyMuPDF)
    -   `.docx` (usando python-docx)
    -   `.xlsx` (usando openpyxl)
    -   `.txt`
-   **Geração Dinâmica de PDF**: Crie PDFs complexos a partir de um JSON, com suporte para:
    -   Títulos, cabeçalhos e parágrafos.
    -   Listas com marcadores (`bullets`) e recuo automático.
    -   Imagens de fontes diversas (URL, Base64 ou arquivos locais).
    -   Quebra de página automática e numeração de rodapé.
    -   Configuração de margens, autor e outras propriedades do documento.
-   **Documentação Interativa da API**: A interface do Swagger UI está disponível em `/api/docs` para explorar e testar todos os endpoints.
-   **Segurança**: Proteção básica contra ataques SSRF ao buscar imagens remotas.

## 📂 Estrutura do Projeto

.
├── app/
│   └── main.py         # Lógica principal da API FastAPI (/api)
├── static/
│   ├── script.js       # JavaScript da interface web
│   └── style.css       # CSS da interface web
├── templates/
│   └── index.html      # Estrutura HTML da página de demonstração
├── run.py              # Script para iniciar o servidor e a interface web
└── requirements.txt    # Lista de dependências Python


## ⚙️ Pré-requisitos

Antes de começar, certifique-se de que você tem os seguintes softwares instalados:

-   **Python 3.11+**
-   **pip** (gerenciador de pacotes do Python)
-   **venv** (módulo para criação de ambientes virtuais, geralmente incluído no Python)

## 🚀 Instalação e Configuração

Siga estes passos para configurar o ambiente de desenvolvimento na sua máquina local.

**1. Clone o Repositório**
   (Se você já tem os arquivos, pule este passo)
   ```bash
   git clone <URL_DO_SEU_REPOSITORIO>
   cd <NOME_DO_DIRETORIO>
2. Crie e Ative um Ambiente Virtual
É uma boa prática isolar as dependências do projeto.

Bash

# Para macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Para Windows
python -m venv venv
venv\Scripts\activate
3. Instale as Dependências
O arquivo requirements.txt contém todas as bibliotecas que o projeto precisa.

Bash

pip install -r requirements.txt
(Observação: Certifique-se de que o arquivo requirements.txt existe e está preenchido com as bibliotecas necessárias como fastapi, uvicorn, python-docx, openpyxl, PyMuPDF, fpdf2, Pillow, requests).

4. (Opcional) Fontes Unicode
Para garantir a melhor compatibilidade com caracteres especiais e acentos nos PDFs gerados, coloque os seguintes arquivos de fonte na raiz do projeto:

DejaVuSans.ttf

DejaVuSans-Bold.ttf

Se não encontradas, a aplicação usará a fonte "Arial" como padrão.

▶️ Como Executar a Aplicação
O projeto inclui um script run.py que simplifica a inicialização. Ele inicia o servidor web e abre a aplicação no seu navegador padrão automaticamente.

Para executar, simplesmente rode o seguinte comando no seu terminal:

Bash

python run.py
Após a execução, você verá uma mensagem no terminal indicando que o servidor está rodando, e uma nova aba será aberta no seu navegador.

Interface Web: http://127.0.0.1:8000

Documentação da API (Swagger): http://127.0.0.1:8000/api/docs

✨ Como Usar
1. Interface Web de Demonstração
A página inicial (http://127.0.0.1:8000) é dividida em duas seções principais:

Gerar PDF Dinâmico:

Edite o payload JSON na área de texto. Você pode carregar um exemplo clicando em "Carregar Exemplo".

Use os botões + Título, + Parágrafo, etc., para adicionar novos blocos de conteúdo ao JSON.

Se precisar usar uma imagem do seu computador, use a ferramenta "Converter imagem local para Base64" para gerar o código e colá-lo no JSON.

Clique em "Gerar e Baixar PDF" para criar o documento.

Extrair Texto de Arquivos:

Clique em "Escolher arquivo" e selecione um arquivo .pdf, .docx, .xlsx ou .txt.

Clique em "Extrair como JSON" para ver o resultado na tela ou em "Baixar como .TXT" para salvar o texto extraído em um arquivo.

2. Usando a API Diretamente
Você pode interagir com a API usando qualquer cliente HTTP, como cURL ou Postman.

Exemplo: Extrair texto de um arquivo PDF

Bash

curl -X POST "[http://127.0.0.1:8000/api/process-file](http://127.0.0.1:8000/api/process-file)" \
     -F "file=@/caminho/para/seu/arquivo.pdf"
Exemplo: Gerar um PDF a partir de um arquivo JSON
Primeiro, crie um arquivo payload.json com o conteúdo do PDF, por exemplo:

JSON

{
  "filename": "meu_relatorio",
  "title": "Relatório de Teste",
  "content_blocks": [
    { "type": "heading", "content": "Seção 1" },
    { "type": "paragraph", "content": "Este é um teste de geração de PDF via API." },
    { "type": "bullet_list", "content": ["Item A", "Item B"] }
  ]
}
Depois, execute o comando cURL para gerar o arquivo meu_relatorio.pdf:

Bash

curl -X POST "[http://127.0.0.1:8000/api/create-pdf?download=true](http://127.0.0.1:8000/api/create-pdf?download=true)" \
     -H "Content-Type: application/json" \
     -d @payload.json \
     --output meu_relatorio.pdf
📋 Endpoints da API
GET /api/: Retorna o status e a versão do serviço.

POST /api/process-file: Recebe um arquivo (multipart/form-data) e extrai seu conteúdo textual.

POST /api/create-pdf: Recebe um corpo JSON (DynamicPDF) e gera um arquivo PDF.

Para ver todos os detalhes sobre os parâmetros, schemas e respostas de cada endpoint, acesse a documentação interativa do Swagger.


---

### Instruções de Implementação

1.  **Crie o arquivo**: Na pasta raiz do seu projeto, crie um novo arquivo chamado `README.md`.
2.  **Copie e Cole**: Copie todo o conteúdo do bloco de código acima e cole-o dentro do arquivo `README.md`.
3.  **Salve o arquivo**: Salve as alterações.
4.  **Verifique**: Se o seu projeto estiver em uma plataforma como GitHub ou GitLab, o conteúdo do `README.md` será exibido automaticamente na página principal do repositório, formatado e pronto para leitura.
