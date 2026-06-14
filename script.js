const slides = document.querySelectorAll('.slide');
const dotsContainer = document.getElementById('dots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const navLabel = document.getElementById('navLabel');
const goPaymentBtn = document.getElementById('goPayment');

let current = 0;

slides.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.classList.add('dot');
  dot.setAttribute('aria-label', `Ir para o slide ${i + 1}`);
  dot.addEventListener('click', () => goTo(i));
  dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.dot');

function render() {
  slides.forEach((slide, i) => {
    slide.classList.remove('active', 'prev');
    if (i === current) slide.classList.add('active');
    if (i < current) slide.classList.add('prev');
  });

  dots.forEach((dot, i) => dot.classList.toggle('active', i === current));

  navLabel.textContent = `${current + 1} / ${slides.length}`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;
}

function goTo(index) {
  if (index < 0 || index >= slides.length) return;
  current = index;
  render();
}

prevBtn.addEventListener('click', () => goTo(current - 1));
nextBtn.addEventListener('click', () => goTo(current + 1));
goPaymentBtn.addEventListener('click', () => goTo(3));

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT') return;
  if (e.key === 'ArrowRight') goTo(current + 1);
  if (e.key === 'ArrowLeft') goTo(current - 1);
});

render();

const optionGroups = document.querySelectorAll('.option-group');
const selections = { traffic: 'mediano', parking: 'medio' };

optionGroups.forEach((group) => {
  const name = group.dataset.name;
  const buttons = group.querySelectorAll('.option');

  buttons.forEach((btn) => {
    if (btn.dataset.value === selections[name]) {
      btn.classList.add('selected');
    }
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selections[name] = btn.dataset.value;
    });
  });
});

const RATE_TABLE = {
  livre:   { livre: 0.79, medio: 0.89, cheio: 0.99 },
  mediano: { livre: 0.99, medio: 1.19, cheio: 1.39 },
  pico:    { livre: 1.39, medio: 1.54, cheio: 1.69 },
};

const TRAFFIC_LABELS = {
  livre: { name: 'Horário livre', tag: 'tag-low' },
  mediano: { name: 'Movimento mediano', tag: 'tag-mid' },
  pico: { name: 'Horário de pico', tag: 'tag-high' },
};

const PARKING_LABELS = {
  livre: 'estacionamento livre',
  medio: 'estacionamento com ocupação média',
  cheio: 'estacionamento cheio',
};

const AVERAGE_POWER_KWH_PER_HOUR = 8.4;

const simForm = document.getElementById('simForm');
const formError = document.getElementById('formError');

simForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;

  if (!startTime || !endTime) {
    formError.textContent = 'Informe o horário de início e de término da recarga.';
    return;
  }

  const durationMinutes = getDurationMinutes(startTime, endTime);

  if (durationMinutes <= 0) {
    formError.textContent = 'O horário de término deve ser posterior ao horário de início.';
    return;
  }

  formError.textContent = '';

  buildReceipt({
    startTime,
    endTime,
    durationMinutes,
    traffic: selections.traffic,
    parking: selections.parking,
  });

  resetPayment();

  goTo(4);
});

function getDurationMinutes(start, end) {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;

  if (endTotal <= startTotal) {
    endTotal += 24 * 60;
  }

  return endTotal - startTotal;
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatTimeLabel(time) {
  const [h, m] = time.split(':');
  return `${h}h${m}`;
}

const receiptBody = document.getElementById('receiptBody');
const receiptTotal = document.getElementById('receiptTotal');
const receiptDate = document.getElementById('receiptDate');

function buildReceipt({ startTime, endTime, durationMinutes, traffic, parking }) {
  const ratePerKwh = RATE_TABLE[traffic][parking];
  const totalKwh = (durationMinutes / 60) * AVERAGE_POWER_KWH_PER_HOUR;
  const totalValue = totalKwh * ratePerKwh;

  receiptDate.textContent = `14/06/2026 · ${formatTimeLabel(startTime)} às ${formatTimeLabel(endTime)}`;

  receiptBody.innerHTML = '';

  const trafficInfo = TRAFFIC_LABELS[traffic];
  const durationLabel = formatDuration(durationMinutes);

  const conditionsRow = document.createElement('div');
  conditionsRow.className = 'receipt-item';
  conditionsRow.innerHTML = `
    <span class="item-tag ${trafficInfo.tag}">${trafficInfo.name}</span>
    <span class="item-detail">Duração de ${durationLabel} · ${PARKING_LABELS[parking]}</span>
    <span class="item-calc">${totalKwh.toFixed(1)} kWh × ${formatBRL(ratePerKwh)}</span>
    <span class="item-subtotal">${formatBRL(totalValue)}</span>
  `;
  receiptBody.appendChild(conditionsRow);

  receiptTotal.innerHTML = `
    <span class="total-label">Total a pagar</span>
    <span class="total-value">${formatBRL(totalValue)}</span>
  `;
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

const payButton = document.getElementById('payButton');
const payNote = document.getElementById('payNote');

function resetPayment() {
  payButton.disabled = false;
  payButton.textContent = 'Confirmar pagamento';
  payButton.classList.remove('paid');
  payNote.textContent = 'O valor será debitado automaticamente ao final de cada sessão de recarga.';
}

payButton.addEventListener('click', () => {
  const totalLabel = receiptTotal.querySelector('.total-value').textContent;

  payButton.disabled = true;
  payButton.textContent = 'Processando...';

  setTimeout(() => {
    payButton.textContent = `Pagamento de ${totalLabel} confirmado`;
    payButton.classList.add('paid');
    payNote.textContent = 'A cobrança foi enviada à operadora do cartão e a sessão foi encerrada.';
  }, 900);
});

buildReceipt({
  startTime: '17:32',
  endTime: '18:21',
  durationMinutes: getDurationMinutes('17:32', '18:21'),
  traffic: selections.traffic,
  parking: selections.parking,
});