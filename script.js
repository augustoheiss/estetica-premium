/* ============================================================
   SCRIPT.JS — Aline Bertoldo Estética Premium
   Funcionalidades:
     1. Header: efeito de scroll + scroll-spy do menu ativo
     2. Menu mobile: abertura/fechamento com animação
     3. Calendário dinâmico de agendamento
     4. Seleção de horários e redirecionamento para WhatsApp
     5. Animações de entrada com Intersection Observer
     6. Ano dinâmico no rodapé
   ============================================================ */

'use strict';

/* ============================================================
   CONSTANTES
   ============================================================ */

/** Número do WhatsApp de Aline (formato internacional, sem +) */
const WHATSAPP_NUMBER = '5511988551535';

/** Ano e mês correntes para lógica do calendário */
const TODAY        = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH_IDX = TODAY.getMonth(); // 0 = Janeiro … 11 = Dezembro

/** Nomes dos meses em português */
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março',    'Abril',
  'Maio',    'Junho',     'Julho',    'Agosto',
  'Setembro','Outubro',   'Novembro', 'Dezembro'
];

/** Nomes dos dias da semana em português (Dom = 0) */
const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Horários disponíveis para agendamento.
 * Gerados automaticamente de 08:00 a 17:00, a cada 1 hora.
 */
const TIME_SLOTS = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
}

/* ============================================================
   REFERÊNCIAS AO DOM
   ============================================================ */
const headerEl          = document.getElementById('header');
const menuToggleEl      = document.getElementById('menuToggle');
const navEl             = document.getElementById('nav');
const monthSelectorEl   = document.getElementById('monthSelector');
const calendarViewEl    = document.getElementById('calendarView');
const timeSelectorEl    = document.getElementById('timeSelector');
const selectedDateLabelEl = document.getElementById('selectedDateLabel');
const timeGridEl        = document.getElementById('timeGrid');
const schedulingCtaEl   = document.getElementById('schedulingCta');
const ctaSummaryEl      = document.getElementById('ctaSummary');
const confirmBtnEl      = document.getElementById('confirmBtn');
const footerYearEl      = document.getElementById('footerYear');

/* ============================================================
   ESTADO DO AGENDAMENTO
   Armazena a seleção atual do usuário.
   ============================================================ */
const state = {
  selectedMonth : null,  // índice do mês selecionado (0-11)
  selectedDay   : null,  // número do dia selecionado (1-31)
  selectedTime  : null,  // string do horário selecionado "HH:00"
};


/* ============================================================
   MÓDULO 1: HEADER — EFEITO DE SCROLL & MENU ATIVO
   ============================================================ */

/**
 * Adiciona a classe .scrolled ao header quando a página
 * é rolada além de 60px, ativando a sombra.
 */
function handleHeaderScroll() {
  if (window.scrollY > 60) {
    headerEl.classList.add('scrolled');
  } else {
    headerEl.classList.remove('scrolled');
  }
}

/**
 * Percorre as seções e marca o link do menu correspondente
 * como .active com base na posição de scroll atual.
 */
function updateActiveNavLink() {
  const scrollPos = window.scrollY + 100; // offset para ativar um pouco antes

  document.querySelectorAll('main section[id]').forEach(section => {
    const top    = section.offsetTop;
    const bottom = top + section.offsetHeight;
    const link   = navEl.querySelector(`a[href="#${section.id}"]`);

    if (link) {
      if (scrollPos >= top && scrollPos < bottom) {
        navEl.querySelectorAll('.nav__link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}

window.addEventListener('scroll', () => {
  handleHeaderScroll();
  updateActiveNavLink();
}, { passive: true });

// Executa uma vez no carregamento para definir o estado inicial
handleHeaderScroll();


/* ============================================================
   MÓDULO 2: MENU MOBILE
   ============================================================ */

/**
 * Alterna a abertura/fechamento do menu em dispositivos móveis.
 */
menuToggleEl.addEventListener('click', () => {
  const isOpen = navEl.classList.toggle('is-open');
  menuToggleEl.classList.toggle('is-open', isOpen);
  menuToggleEl.setAttribute('aria-expanded', String(isOpen));
});

/**
 * Fecha o menu ao clicar em qualquer link de navegação.
 */
navEl.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navEl.classList.remove('is-open');
    menuToggleEl.classList.remove('is-open');
    menuToggleEl.setAttribute('aria-expanded', 'false');
  });
});

/**
 * Fecha o menu ao clicar fora dele (em qualquer área da página).
 */
document.addEventListener('click', (event) => {
  const clickedInsideNav    = navEl.contains(event.target);
  const clickedToggleBtn    = menuToggleEl.contains(event.target);

  if (!clickedInsideNav && !clickedToggleBtn && navEl.classList.contains('is-open')) {
    navEl.classList.remove('is-open');
    menuToggleEl.classList.remove('is-open');
    menuToggleEl.setAttribute('aria-expanded', 'false');
  }
});


/* ============================================================
   MÓDULO 3: CALENDÁRIO DE AGENDAMENTO
   ============================================================ */

/**
 * Gera os 12 botões de mês no seletor.
 * Meses passados ficam desabilitados.
 */
function renderMonthSelector() {
  monthSelectorEl.innerHTML = '';

  MONTHS_PT.forEach((name, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'month-btn';
    // Usa abreviação de 3 letras para os botões
    btn.textContent = name.substring(0, 3);
    btn.setAttribute('aria-label', `Abrir calendário de ${name} de ${CURRENT_YEAR}`);

    // Desabilita meses que já passaram no ano corrente
    const isPastMonth = (idx < CURRENT_MONTH_IDX);
    if (isPastMonth) {
      btn.disabled = true;
      btn.title = 'Mês já encerrado';
    }

    btn.addEventListener('click', () => onMonthSelect(idx, btn));

    monthSelectorEl.appendChild(btn);
  });
}

/**
 * Callback ao selecionar um mês.
 * Atualiza o estado, marca o botão como ativo e renderiza o calendário.
 * @param {number} monthIdx - Índice do mês (0-11)
 * @param {HTMLButtonElement} btn - Botão clicado
 */
function onMonthSelect(monthIdx, btn) {
  // Atualiza estado e reinicia seleção de dia/hora
  state.selectedMonth = monthIdx;
  state.selectedDay   = null;
  state.selectedTime  = null;

  // Marca o botão selecionado
  document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');

  // Renderiza o calendário do mês
  renderCalendar(monthIdx);

  // Oculta os painéis de horário e CTA
  timeSelectorEl.hidden  = true;
  schedulingCtaEl.hidden = true;
}

/**
 * Gera a grade visual do calendário para o mês e ano correntes.
 * @param {number} monthIdx - Índice do mês (0-11)
 */
function renderCalendar(monthIdx) {
  calendarViewEl.innerHTML = '';

  const firstWeekday   = new Date(CURRENT_YEAR, monthIdx, 1).getDay(); // dia da semana do 1º
  const totalDays      = new Date(CURRENT_YEAR, monthIdx + 1, 0).getDate(); // total de dias no mês

  // Prepara a data de "hoje" zerada para comparação
  const todayNormalized = new Date(TODAY);
  todayNormalized.setHours(0, 0, 0, 0);

  /* --- Título do mês --- */
  const headerEl = document.createElement('div');
  headerEl.className = 'calendar-header';
  headerEl.innerHTML = `
    <h3 class="calendar-month-title">${MONTHS_PT[monthIdx]} ${CURRENT_YEAR}</h3>
  `;
  calendarViewEl.appendChild(headerEl);

  /* --- Linha de dias da semana --- */
  const weekdaysRow = document.createElement('div');
  weekdaysRow.className = 'calendar-weekdays';
  WEEKDAYS_PT.forEach(day => {
    const cell = document.createElement('div');
    cell.className = 'calendar-weekday';
    cell.textContent = day;
    weekdaysRow.appendChild(cell);
  });
  calendarViewEl.appendChild(weekdaysRow);

  /* --- Grade de dias --- */
  const daysGrid = document.createElement('div');
  daysGrid.className = 'calendar-days';

  // Células vazias para alinhar o 1º dia ao dia correto da semana
  for (let i = 0; i < firstWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day is-empty';
    empty.setAttribute('aria-hidden', 'true');
    daysGrid.appendChild(empty);
  }

  // Células de cada dia do mês
  for (let d = 1; d <= totalDays; d++) {
    const dateObj   = new Date(CURRENT_YEAR, monthIdx, d);
    const dayOfWeek = dateObj.getDay();
    const isPast    = dateObj < todayNormalized;
    const isSunday  = (dayOfWeek === 0);
    const isToday   = (dateObj.getTime() === todayNormalized.getTime());

    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    cell.textContent = d;
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', isPast || isSunday ? '-1' : '0');
    cell.setAttribute('aria-label', `${d} de ${MONTHS_PT[monthIdx]}`);

    if (isToday)  cell.classList.add('is-today');
    if (isSunday) cell.classList.add('is-sunday');

    if (isPast || isSunday) {
      // Domingos e datas passadas ficam desabilitados
      cell.classList.add('is-disabled');
      cell.setAttribute('aria-disabled', 'true');
    } else {
      // Dias disponíveis: clique e tecla Enter/Espaço
      cell.addEventListener('click', () => onDaySelect(d, cell));
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onDaySelect(d, cell);
        }
      });
    }

    daysGrid.appendChild(cell);
  }

  calendarViewEl.appendChild(daysGrid);
}

/**
 * Callback ao selecionar um dia disponível no calendário.
 * @param {number} day - Número do dia
 * @param {HTMLElement} cell - Célula clicada
 */
function onDaySelect(day, cell) {
  // Remove seleção anterior
  document.querySelectorAll('.calendar-day.is-selected').forEach(c => {
    c.classList.remove('is-selected');
    c.removeAttribute('aria-current');
  });

  cell.classList.add('is-selected');
  cell.setAttribute('aria-current', 'date');

  state.selectedDay  = day;
  state.selectedTime = null; // reseta horário ao trocar de dia

  // Formata "DD/MM" para o label
  const dayStr   = String(day).padStart(2, '0');
  const monthStr = String(state.selectedMonth + 1).padStart(2, '0');
  selectedDateLabelEl.textContent = `${dayStr}/${monthStr}`;

  // Renderiza horários e exibe o painel
  renderTimeSlots();
  timeSelectorEl.hidden  = false;
  schedulingCtaEl.hidden = true;

  // Scroll suave para os horários
  setTimeout(() => {
    timeSelectorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 120);
}

/**
 * Gera os botões de horário disponíveis (08:00 → 17:00).
 */
function renderTimeSlots() {
  timeGridEl.innerHTML = '';

  TIME_SLOTS.forEach(time => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-btn';
    btn.textContent = time;
    btn.setAttribute('aria-label', `Selecionar horário ${time}`);

    btn.addEventListener('click', () => onTimeSelect(time, btn));

    timeGridEl.appendChild(btn);
  });
}

/**
 * Callback ao selecionar um horário.
 * @param {string} time - Horário no formato "HH:00"
 * @param {HTMLButtonElement} btn - Botão clicado
 */
function onTimeSelect(time, btn) {
  // Remove seleção anterior
  document.querySelectorAll('.time-btn.is-selected').forEach(b => {
    b.classList.remove('is-selected');
    b.removeAttribute('aria-pressed');
  });

  btn.classList.add('is-selected');
  btn.setAttribute('aria-pressed', 'true');

  state.selectedTime = time;

  // Exibe o resumo e o botão de confirmação
  updateCtaSummary();
  schedulingCtaEl.hidden = false;

  // Scroll suave para o CTA
  setTimeout(() => {
    schedulingCtaEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 120);
}

/**
 * Atualiza o texto de resumo da seleção (dia + horário).
 */
function updateCtaSummary() {
  const dayStr   = String(state.selectedDay).padStart(2, '0');
  const monthStr = String(state.selectedMonth + 1).padStart(2, '0');

  ctaSummaryEl.innerHTML = `
    Você selecionou: <strong>${dayStr}/${monthStr}</strong>
    às <strong>${state.selectedTime}</strong>.
    <br>Clique em confirmar para finalizar pelo WhatsApp.
  `;
}

/**
 * Listener do botão "Confirmar Agendamento via WhatsApp".
 * Monta a URL da API do WhatsApp com a mensagem personalizada
 * e abre em nova aba.
 */
confirmBtnEl.addEventListener('click', () => {
  if (state.selectedDay === null || state.selectedMonth === null || !state.selectedTime) return;

  const dayStr   = String(state.selectedDay).padStart(2, '0');
  const monthStr = String(state.selectedMonth + 1).padStart(2, '0');

  // Mensagem exata conforme especificado
  const message =
    `Olá Aline! Gostaria de pré-agendar meu atendimento para o dia ${dayStr}/${monthStr} às ${state.selectedTime}. Podemos confirmar os detalhes?`;

  const encodedMsg  = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;

  // Abre o link do WhatsApp em nova aba
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
});


/* ============================================================
   MÓDULO 4: ANIMAÇÕES DE SCROLL (Intersection Observer)
   Anima a entrada dos elementos marcados com .animate-on-scroll
   quando eles entram no viewport.
   ============================================================ */

const scrollObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Para de observar após a animação (sem repetição)
        scrollObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,           // aciona quando 12% do elemento está visível
    rootMargin: '0px 0px -40px 0px', // margem de segurança na base
  }
);

// Registra todos os elementos animáveis
document.querySelectorAll('.animate-on-scroll').forEach(el => {
  scrollObserver.observe(el);
});


/* ============================================================
   MÓDULO 5: UTILITÁRIOS GERAIS
   ============================================================ */

/** Preenche o ano no footer dinamicamente */
footerYearEl.textContent = CURRENT_YEAR;


/* ============================================================
   INICIALIZAÇÃO
   Chamada após todo o DOM e módulos estarem prontos.
   ============================================================ */

/** Renderiza o seletor de meses ao carregar a página */
renderMonthSelector();
