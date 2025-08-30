document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel) => document.querySelector(sel);
  const statusDot  = $('#statusDot');
  const statusText = $('#statusText');
  const manualLink = $('#manualLink');
  const loader     = $('#loader');
  const diag       = $('#diag');
  const payloadEl  = $('#payload');
  const sampleSel  = $('#sampleSelect');
  const snippetsContainer = $('#snippets');

  const API_BASE_URL = "/api";

  const showLoader = () => (loader.style.display = 'flex');
  const hideLoader = () => (loader.style.display = 'none');

  function showToast(message, type = 'info') {
    const existingToast = $('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { 
      toast.classList.remove('show'); 
      setTimeout(() => toast.remove(), 500); 
    }, 3800);
  }
  
  const setStatus = (ok, msg) => {
    statusDot.className = 'status-dot';
    if (ok) statusDot.classList.add('ok');
    if (ok === false) statusDot.classList.add('err');
    statusText.textContent = msg;
  };

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
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const TINY_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVR4nGP8z8Dwn4EIwESMolGF1FMIAD2cAhK2AyPVAAAAAElFTkSuQmCC";

  const SAMPLES = {
    ficha: { filename: "ficha_cadastro_styled", title: "Ficha de Cadastro", options: { page_numbers: true, margins_mm: [18,16,18], title_align: "L", theme_text_color: [33,37,41] }, content_blocks: [ { type: "heading", content: "Dados do Cliente", style: { background_color: [224,238,255] }, line_height: 9 }, { type: "form_input", content: { label: "Nome completo", width_mm: 140, lines: 1, boxed: false } }, { type: "form_input", content: { label: "Endereço", width_mm: 140, lines: 2, boxed: true } }, { type: "subheading", content: "Preferências", style: { background_color: [245,247,250] }, line_height: 7.5 }, { type: "form_checklist", content: { label: "Canais de contato", options: ["E-mail","WhatsApp","Telefone","SMS"], columns: 2, box_size_mm: 4, gap_mm: 2 }}, { type: "form_radiogroup", content: { label: "Plano", options: ["Básico","Pro","Enterprise"], columns: 3, dot_size_mm: 4, gap_mm: 2 }}, { type: "heading", content: "Observações", style: { background_color: [224,238,255] }, line_height: 9 }, { type: "form_input", content: { label: "", width_mm: 140, lines: 3, boxed: true } }, { type: "subheading", content: "Consentimento", style: { background_color: [245,247,250] }, line_height: 7.5 }, { type: "paragraph", content: "Declaro que as informações prestadas são verdadeiras e autorizo o uso dos dados para fins de atendimento." }, { type: "spacer", content: 6 }, { type: "form_input", content: { label: "Assinatura", width_mm: 90, lines: 1, boxed: false } }, { type: "form_input", content: { label: "Data", width_mm: 60, lines: 1, boxed: false } } ] },
    status: { filename: "status_projeto_styled", title: "Status do Projeto — Sprint 12", options: { author: "Equipe XPTO", subject: "Status Sprint", keywords: "status, sprint, relatório", page_numbers: true, margins_mm: [18,16,18], title_align: "L", theme_text_color: [33,37,41] }, content_blocks: [ { type: "heading", content: "Resumo", style: { background_color: [232,244,248] }, line_height: 9 }, { type: "paragraph", content: "Nesta sprint foram entregues integrações com o gateway de pagamentos e o módulo de relatórios. Desempenho estável." }, { type: "subheading", content: "Entregas", style: { background_color: [245,247,250] }, line_height: 7.5 }, { type: "bullet_list", content: [ "Integração com PagBank finalizada", "Relatórios CSV: exportação e filtros", "Correção do leak de memória no worker" ]}, { type: "subheading", content: "Riscos & Ações", style: { background_color: [245,247,250] }, line_height: 7.5 }, { type: "bullet_list", content: [ "Fila de e-mails crescendo — ação: retry exponencial", "Dependência da equipe de Dados — ação: alinhar DRI até sexta" ]}, { type: "spacer", content: 6 }, { type: "key_value", style: { background_color: [248,249,250] }, content: { "Projeto": "XPTO", "Versão": "1.8.2", "Data": "____/____/______" }}, { type: "image", content: { base64_data: TINY_PNG, width: 80, align: "C" } } ] },
    widgets: { filename: "form_interativo_demo", title: "Formulário Interativo (AcroForm)", options: { page_numbers: true, margins_mm: [18,16,18], title_align: "L" }, content_blocks: [ { type: "heading", content: "Preencha os campos abaixo", style: { background_color: [232,244,248] }, line_height: 9 }, { type: "paragraph", content: "Campos editáveis: Nome, E-mail. Marque o aceite e escolha um plano." }, { type: "spacer", content: 4 } ], widgets: [ { type: "text", name: "nome",  page: 1, x_mm: 20, y_mm: 60,  w_mm: 120, h_mm: 8,  value: "", font_size: 10, required: true }, { type: "text", name: "email", page: 1, x_mm: 20, y_mm: 72,  w_mm: 120, h_mm: 8,  value: "", font_size: 10 }, { type: "checkbox", name: "aceite_lgpd", page: 1, x_mm: 20, y_mm: 86, w_mm: 6, h_mm: 6, checked: false }, { type: "radio", name: "plano", page: 1, x_mm: 20, y_mm: 100, w_mm: 6, h_mm: 6, export_value: "Basico" }, { type: "radio", name: "plano", page: 1, x_mm: 60, y_mm: 100, w_mm: 6, h_mm: 6, export_value: "Pro" }, { type: "radio", name: "plano", page: 1, x_mm: 100, y_mm: 100, w_mm: 6, h_mm: 6, export_value: "Enterprise" }, { type: "signature", name: "assinatura", page: 1, x_mm: 20, y_mm: 120, w_mm: 60, h_mm: 12 } ] }
  };

  function loadSample(key) {
    const selected = key || (sampleSel ? sampleSel.value : 'ficha');
    const tpl = SAMPLES[selected];
    if (!tpl) return showToast('Exemplo não encontrado.', 'error');
    const obj = JSON.parse(JSON.stringify(tpl));
    payloadEl.value = JSON.stringify(obj, null, 2);
    try { localStorage.setItem('fps_payload', payloadEl.value); } catch(_) {}
  }
  if (sampleSel) sampleSel.addEventListener('change', () => loadSample());
  $('#btnLoadSample').onclick = () => loadSample();

  const saved = (() => { try { return localStorage.getItem('fps_payload'); } catch(_) { return null; }})();
  payloadEl.value = saved || JSON.stringify(SAMPLES.ficha, null, 2);

  const SNIPPET_TEMPLATES = {
    heading: { type: "heading", content: "Título da Seção", style: { background_color: [224,238,255] }, line_height: 9 },
    subheading: { type: "subheading", content: "Subtítulo", style: { background_color: [245,247,250] }, line_height: 7.5 },
    paragraph: { type: "paragraph", content: "Texto do parágrafo aqui." },
    bullets: { type: "bullet_list", content: ["Item 1", "Item 2"] },
    keyValue: { type: "key_value", content: { "Chave": "Valor", "Versão": "1.0.0" } },
    spacer: { type: "spacer", content: 6 },
    image: { type: "image", content: { base64_data: TINY_PNG, width: 50, align: "C" } },
    input: { type: "form_input", content: { label: "Campo", width_mm: 120, lines: 1, boxed: false } },
    checklist: { type: "form_checklist", content: { label: "Checklist", options: ["A","B","C"], columns: 2, box_size_mm: 4, gap_mm: 2 } },
    radio: { type: "form_radiogroup", content: { label: "Opções", options: ["Opção 1","Opção 2"], columns: 2, dot_size_mm: 4, gap_mm: 2 } }
  };

  if (snippetsContainer) {
    snippetsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-snippet]');
      if (!btn) return;

      const snippetKey = btn.dataset.snippet;
      const snippet = SNIPPET_TEMPLATES[snippetKey];
      if (!snippet) return;

      try {
        const data = JSON.parse(payloadEl.value || '{}');
        if (!Array.isArray(data.content_blocks)) data.content_blocks = [];
        data.content_blocks.push(JSON.parse(JSON.stringify(snippet)));
        payloadEl.value = JSON.stringify(data, null, 2);
        try { localStorage.setItem('fps_payload', payloadEl.value); } catch(_) {}
      } catch (err) {
        showToast('JSON inválido – não foi possível adicionar o bloco.', 'error');
      }
    });
  }

  $('#btnBeautify').onclick = () => {
    try { payloadEl.value = JSON.stringify(JSON.parse(payloadEl.value), null, 2); showToast('JSON formatado.', 'success'); }
    catch { showToast('JSON inválido.', 'error'); }
  };
  $('#btnValidate').onclick = () => {
    try { JSON.parse(payloadEl.value); showToast('JSON válido.', 'success'); }
    catch (e) { showToast(`Inválido: ${e.message}`, 'error'); }
  };
  payloadEl.addEventListener('input', () => {
    try { localStorage.setItem('fps_payload', payloadEl.value); } catch(_) {}
  });

  async function createPdf(downloadMode) {
    showLoader(); if (diag) diag.textContent = "";
    try {
      let data;
      try { data = JSON.parse(payloadEl.value); }
      catch { throw new Error('O JSON no editor é inválido.'); }

      const resp = await fetch(`${API_BASE_URL}/create-pdf?download=${downloadMode ? 'true' : 'false'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!resp.ok) await handleApiError(resp);

      const ws = resp.headers.get('X-Widgets-Supported');
      const wi = resp.headers.get('X-Widgets-Injected');
      const wk = resp.headers.get('X-Widgets-Skipped');
      if ((ws || wi || wk) && diag) {
        const msg = [ ws ? `Widgets Supported: ${ws}` : null, wi ? `Widgets Injected: ${wi}` : null, wk ? `Widgets Skipped: ${wk}` : null ].filter(Boolean).join(" • ");
        diag.textContent = msg;
        showToast(msg, 'info');
      }

      const blob = await resp.blob();
      const filename = (data.filename || 'documento') + '.pdf';
      if (downloadMode) {
        downloadBlob(blob, filename);
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      showToast('PDF gerado com sucesso!', 'success');
    } catch (e) {
      console.error(e);
      showToast(`Erro: ${e.message}`, 'error');
    } finally {
      hideLoader();
    }
  }
  $('#btnCreate').onclick  = () => createPdf(true);
  $('#btnPreview').onclick = () => createPdf(false);

  async function extractText(returnAs) {
    const fileInput = $('#file');
    if (!fileInput.files.length) { showToast('Escolha um arquivo.', 'info'); return; }
    showLoader(); $('#out').textContent = '';
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
        showToast('.TXT gerado!', 'success');
      }
    } catch (e) {
      console.error(e);
      $('#out').textContent = `Erro: ${e.message}`;
      showToast(`Erro: ${e.message}`, 'error');
    } finally {
      hideLoader();
    }
  }
  $('#btnExtractJson').onclick = () => extractText('json');
  $('#btnExtractTxt').onclick  = () => extractText('txt');
  
  const setupFileInput = (inputId, labelId) => {
    const input = $(`#${inputId}`);
    const label = $(`#${labelId}`);
    if(input && label) {
      input.addEventListener('change', () => {
        label.textContent = input.files[0] ? input.files[0].name : 'Escolher arquivo...';
      });
    }
  };
  setupFileInput('imgFile', 'imgFileName');
  setupFileInput('file', 'fileName');

  $('#btnToBase64').onclick = () => {
    const file = $('#imgFile').files[0];
    if (!file) { showToast('Escolha uma imagem.', 'info'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64Out = $('#b64Out');
      b64Out.value = e.target.result;
      showToast('Imagem convertida para Base64!', 'success');
      b64Out.select();
      try {
        navigator.clipboard.writeText(b64Out.value)
          .then(() => showToast('Copiado para a área de transferência!', 'info'))
          .catch(() => showToast('Falha ao copiar.', 'error'));
      } catch(err) {
        showToast('Falha ao copiar.', 'error');
      }
    };
    reader.onerror = () => showToast('Falha ao ler o arquivo.', 'error');
    reader.readAsDataURL(file);
  };

  ping();
});