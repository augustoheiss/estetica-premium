/* ============================================================
   LEGAL.JS — Controlador da Página Legal (Termos & Privacidade)
   Estratégia: State-based rendering com hash routing (#termos)
   para compatibilidade com GitHub Pages (sem 404 no F5).
   ============================================================ */

'use strict';

(function () {
  /* ---- Referências ao DOM ---- */
  const legalOverlay   = document.getElementById('legalOverlay');
  const legalLink      = document.getElementById('legalLink');
  const legalBack      = document.getElementById('legalBack');
  const legalBackBottom = document.getElementById('legalBackBottom');

  const mainContent    = document.querySelector('main');
  const siteHeader     = document.querySelector('.header');
  const siteFooter     = document.querySelector('.footer');

  if (!legalOverlay) return; // Guard: sai se a estrutura não existir

  /* ---- Funções de controle de estado ---- */

  /**
   * Exibe a página legal e oculta o conteúdo principal do site.
   */
  function showLegalPage() {
    // Oculta conteúdo principal
    mainContent.style.display = 'none';
    siteHeader.style.display  = 'none';
    siteFooter.style.display  = 'none';

    // Exibe overlay legal
    legalOverlay.classList.add('is-active');
    legalOverlay.setAttribute('aria-hidden', 'false');

    // Scroll para o topo da página legal
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Atualiza título da aba
    document.title = 'Termos de Uso e Privacidade | Aline Bertoldo';
  }

  /**
   * Oculta a página legal e restaura o conteúdo principal.
   */
  function hideLegalPage() {
    // Restaura conteúdo principal
    mainContent.style.display = '';
    siteHeader.style.display  = '';
    siteFooter.style.display  = '';

    // Oculta overlay legal
    legalOverlay.classList.remove('is-active');
    legalOverlay.setAttribute('aria-hidden', 'true');

    // Restaura título original
    document.title = 'Aline Bertoldo | Estética Premium';

    // Limpa o hash sem causar scroll
    history.replaceState(null, '', window.location.pathname);

    // Scroll suave para o footer (de onde o usuário veio)
    setTimeout(() => {
      const footerEl = document.querySelector('.footer');
      if (footerEl) {
        footerEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 50);
  }

  /* ---- Hash router ---- */

  /**
   * Verifica o hash atual e ativa/desativa a página legal.
   */
  function handleHash() {
    if (window.location.hash === '#termos') {
      showLegalPage();
    } else {
      // Só oculta se estiver ativo (evita flicker no load)
      if (legalOverlay.classList.contains('is-active')) {
        hideLegalPage();
      }
    }
  }

  /* ---- Event Listeners ---- */

  // Link no footer
  legalLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#termos';
  });

  // Botão "Voltar" no topo
  legalBack.addEventListener('click', (e) => {
    e.preventDefault();
    hideLegalPage();
  });

  // Botão "Voltar" no rodapé da legal page
  legalBackBottom.addEventListener('click', (e) => {
    e.preventDefault();
    hideLegalPage();
  });

  // Escuta mudanças de hash (Back/Forward do browser)
  window.addEventListener('hashchange', handleHash);

  // Verifica hash no carregamento (para links diretos com #termos)
  handleHash();

  // Escuta tecla Escape para fechar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && legalOverlay.classList.contains('is-active')) {
      hideLegalPage();
    }
  });
})();
