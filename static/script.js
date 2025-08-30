document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const $ = sel => document.querySelector(sel);
    const statusDot = $('#statusDot');
    const statusText = $('#statusText');
    const manualLink = $('#manualLink');
    const loader = $('#loader');
    
    // API URL base (não precisa mais de input)
    const API_BASE_URL = "/api";

    // --- Funções de UI ---
    const showLoader = () => loader.style.display = 'flex';
    const hideLoader = () => loader.style.display = 'none';

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        // Adicionar CSS para o toast dinamicamente
        if (!$('style#toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.innerHTML = `
                .toast { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; 
                         color: white; font-weight: 600; z-index: 1000; transition: opacity 0.5s, transform 0.5s; 
                         transform: translateX(120%); opacity: 0; }
                .toast.show { transform: translateX(0); opacity: 1; }
                .toast.success { background-color: #28a745; }
                .toast.error { background-color: #dc3545; }
                .toast.info { background-color: #007bff; }
            `;
            document.head.appendChild(style);
        }
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    const setStatus = (ok, msg) => {
        statusDot.className = 'status-dot'; // Reset
        if (ok) statusDot.classList.add('ok');
        if (ok === false) statusDot.classList.add('err');
        statusText.textContent = msg;
    };

    // --- Lógica da Aplicação ---
    async function ping() {
        manualLink.href = `${window.location.origin}/api/manual`;
        setStatus(null, 'testando...');
        try {
            const r = await fetch(`${window.location.origin}/api/`);
            if (!r.ok) throw new Error(r.statusText);
            const j = await r.json();
            setStatus(true, `online — v${j.version || 'N/D'}`);
        } catch (e) {
            setStatus(false, 'falha na conexão');
            console.error(e);
        }
    }
    
    // Helpers
    const handleApiError = async (response) => {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorJson = await response.json();
            errorMsg = errorJson.detail || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
    };

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
    
    // Gerar PDF
    $('#btnCreate').addEventListener('click', async () => {
        showLoader();
        try {
            let data;
            try {
                data = JSON.parse($('#payload').value);
            } catch (e) {
                throw new Error('O JSON no editor é inválido.');
            }
            
            const response = await fetch(`${API_BASE_URL}/create-pdf?download=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) await handleApiError(response);
            
            const blob = await response.blob();
            const filename = (data.filename || 'documento') + '.pdf';
            downloadBlob(blob, filename);
            showToast('PDF gerado com sucesso!', 'success');
        } catch (e) {
            console.error(e);
            showToast(`Erro: ${e.message}`, 'error');
        } finally {
            hideLoader();
        }
    });

    // Extrair Texto
    const extractText = async (returnAs) => {
        const fileInput = $('#file');
        if (!fileInput.files.length) {
            showToast('Por favor, escolha um arquivo.', 'info');
            return;
        }
        showLoader();
        $('#out').textContent = '';
        try {
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append('file', file, file.name);

            const download = returnAs === 'txt';
            const url = `${API_BASE_URL}/process-file?return_as=${returnAs}&download=${download}`;
            const response = await fetch(url, { method: 'POST', body: formData });
            
            if (!response.ok) await handleApiError(response);

            if (returnAs === 'json') {
                const result = await response.json();
                $('#out').textContent = JSON.stringify(result, null, 2);
                showToast('Texto extraído com sucesso!', 'success');
            } else {
                const blob = await response.blob();
                const filename = (file.name.replace(/\.[^/.]+$/, '') || 'texto') + '.txt';
                downloadBlob(blob, filename);
                showToast('Arquivo .txt gerado!', 'success');
            }
        } catch (e) {
            console.error(e);
            $('#out').textContent = `Erro: ${e.message}`;
            showToast(`Erro: ${e.message}`, 'error');
        } finally {
            hideLoader();
        }
    };
    $('#btnExtractJson').addEventListener('click', () => extractText('json'));
    $('#btnExtractTxt').addEventListener('click', () => extractText('txt'));
    
    // Conversor Base64
    $('#btnToBase64').addEventListener('click', () => {
        const file = $('#imgFile').files[0];
        if (!file) {
            showToast('Escolha uma imagem para converter.', 'info');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            $('#b64Out').value = event.target.result;
            showToast('Imagem convertida para Base64!', 'success');
            $('#b64Out').select();
            document.execCommand('copy');
            showToast('Copiado para a área de transferência!', 'info');
        };
        reader.onerror = () => showToast('Falha ao ler o arquivo.', 'error');
        reader.readAsDataURL(file);
    });
    
    // Snippets e Exemplo
    const payloadEl = $('#payload');
    const insertAtCursor = (snippet) => {
        // ... (lógica para inserir snippet, se desejar)
        const currentBlocks = JSON.parse(payloadEl.value).content_blocks;
        currentBlocks.push(snippet);
        payloadEl.value = JSON.stringify(JSON.parse(payloadEl.value), null, 2); // Reformatar
        
        // Simplesmente adiciona no final para ser mais robusto
        try {
            const data = JSON.parse(payloadEl.value);
            data.content_blocks.push(snippet);
            payloadEl.value = JSON.stringify(data, null, 2);
        } catch(e) {
            showToast('JSON inválido, não foi possível adicionar o bloco.', 'error');
        }

    };

    $('#btnSnippetHeading').onclick = () => insertAtCursor({ "type": "heading", "content": "Título da Seção" });
    $('#btnSnippetParagraph').onclick = () => insertAtCursor({ "type": "paragraph", "content": "Texto do parágrafo aqui." });
    $('#btnSnippetBullets').onclick = () => insertAtCursor({ "type": "bullet_list", "content": ["Item 1", "Item 2"] });
    $('#btnSnippetImage').onclick = () => insertAtCursor({ "type": "image", "content": { "base64_data": "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVR4nGP8z8Dwn4EIwESMolGF1FMIAD2cAhK2AyPVAAAAAElFTkSuQmCC", "width": 50, "align": "C" } });

    const loadSample = () => {
        payloadEl.value = JSON.stringify({
            "filename": "relatorio_demo",
            "title": "Relatório de Atividades - Demo",
            "options": { "author": "Equipe Demo", "page_numbers": true, "margins_mm": [20, 15, 20] },
            "content_blocks": [
                { "type": "heading", "content": "1. Visão Geral" },
                { "type": "paragraph", "content": "Este relatório apresenta os principais indicadores e entregas do mês, demonstrando o progresso contínuo em nossas iniciativas estratégicas." },
                { "type": "bullet_list", "content": ["Feature X entregue com sucesso.", "Integração com o sistema Y foi publicada em produção.", "Todas as correções críticas planejadas para este ciclo foram resolvidas."] },
                { "type": "subheading", "content": "Indicadores-Chave" },
                { "type": "key_value", "content": { "Projetos Ativos": "5", "Entregas Realizadas": "12", "Bugs Críticos": "0" } }
            ]
        }, null, 2);
    };
    $('#btnLoadSample').onclick = loadSample;

    // --- Inicialização ---
    loadSample();
    ping();
});