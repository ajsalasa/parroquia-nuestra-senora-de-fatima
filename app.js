// Configuración del Backend
const CONFIG = {
  // Reemplaza esto con la "Function URL" de tu AWS Lambda cuando lo publiques.
  // Ejemplo: 'https://xyz123.lambda-url.us-east-1.on.aws/'
  API_URL: 'https://qetoxgetzfgo5z6s7s7vijzmi40atjiw.lambda-url.us-east-1.on.aws/',
};

// State
const state = {
  // Actividades de prueba (se usarán solo si API_URL está vacío)
  events: [
    { id: '1', title: 'Curso Bautismal', date: '2026-05-12', endDate: '2026-05-14', time: '19:00', type: 'curso', description: 'Pláticas de preparación para padres y padrinos.' },
    { id: '2', title: 'Curso Matrimonial', date: '2026-05-18', endDate: '2026-05-22', time: '20:00', type: 'curso', description: 'Pláticas pre-matrimoniales para parejas.' }
  ],
  currentDate: new Date(2026, 3, 1), // Starting with April 2026 based on mock data
  activeFilter: 'all',
  isAdminLoggedIn: localStorage.getItem('adminLoggedIn') === 'true',
  isLoading: false
};

// Replace currentDate with actual current date
state.currentDate = new Date();

// DOM Elements
const appDiv = document.getElementById('app');

// Utility to render the App
function render() {
  const hash = window.location.hash || '#';

  if (hash === '#admin') {
    if (!state.isAdminLoggedIn) {
      window.location.hash = '#login';
      return;
    }
    renderAdmin();
  } else if (hash === '#login') {
    if (state.isAdminLoggedIn) {
      window.location.hash = '#admin';
      return;
    }
    renderLogin();
  } else {
    renderCalendar();
  }
}

// ----------------------------------------------------
// COMPONENTS
// ----------------------------------------------------

function Header() {
  const hash = window.location.hash || '#';
  let navHtml = '';

  if (hash === '#') {
    navHtml = `<a href="#login" class="btn btn-outline"><i class="ph ph-user"></i> Administrador</a>`;
  } else if (hash === '#admin') {
    navHtml = `
      <a href="#" class="btn btn-outline"><i class="ph ph-calendar"></i> Ver Calendario</a>
      <button onclick="logout()" class="btn btn-danger"><i class="ph ph-sign-out"></i> Salir</button>
    `;
  } else if (hash === '#login') {
    navHtml = `<a href="#" class="btn btn-outline"><i class="ph ph-calendar"></i> Volver al Calendario</a>`;
  }

  return `
    <header class="header">
      <a href="#" class="header-brand">
        <i class="ph-fill ph-church"></i>
        <h1>Parroquia Nuestra Señora de Fátima</h1>
      </a>
      <div class="header-nav">
        ${navHtml}
      </div>
    </header>
  `;
}

// ----------------------------------------------------
// CALENDAR VIEW
// ----------------------------------------------------

function renderCalendar() {
  appDiv.innerHTML = `
    ${Header()}
    <main class="main-content">
      <div class="filters-bar" style="margin-bottom: 1.5rem; border-radius: var(--radius);">
        ${renderFilters()}
      </div>
      
      <div class="upcoming-section">
        <h2><i class="ph-fill ph-list-bullets"></i> Actividades Destacadas</h2>
        ${renderUpcomingEventsList()}
      </div>

      <div class="upcoming-section">
        <h2 style="margin-bottom: 1.25rem; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem;"><i class="ph-fill ph-calendar-blank"></i> Calendario Mensual</h2>
        <div class="calendar-container">
          ${renderCalendarHeader()}
          ${renderCalendarGrid()}
        </div>
      </div>
    </main>
    ${renderEventModal()}
  `;
}

function renderUpcomingEventsList() {
  const todayStr = new Date().toISOString().split('T')[0];

  let listEvents = state.events;
  if (state.activeFilter !== 'all') {
    listEvents = listEvents.filter(e => e.type === state.activeFilter);
  }

  // Solo futuros o de hoy (considerando endDate si existe)
  listEvents = listEvents.filter(e => (e.endDate || e.date) >= todayStr);

  // Ordenar por fecha y hora
  listEvents = listEvents.sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.time.localeCompare(b.time);
  });

  if (listEvents.length === 0) {
    return `<div style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--surface); border-radius: var(--radius); border: 1px dashed var(--border);">No hay actividades próximas para mostrar.</div>`;
  }

  // Limitar a los próximos 15
  listEvents = listEvents.slice(0, 15);

  let html = `<div class="events-list">`;
  html += listEvents.map(e => {
    const parts = e.date.split('-');
    const day = parts[2];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = months[parseInt(parts[1], 10) - 1];

    let dateDisplay = `<span class="event-card-day">${day}</span><span class="event-card-month">${month}</span>`;
    if (e.endDate && e.endDate !== e.date) {
      const endParts = e.endDate.split('-');
      const endDay = endParts[2];
      const endMonth = months[parseInt(endParts[1], 10) - 1];
      if (month === endMonth) {
        dateDisplay = `<span class="event-card-day" style="font-size: 1.1rem;">${day}-${endDay}</span><span class="event-card-month">${month}</span>`;
      } else {
        dateDisplay = `<span class="event-card-day" style="font-size: 1rem;">${day} ${month}</span><span class="event-card-month" style="font-size: 0.8rem;">al ${endDay} ${endMonth}</span>`;
      }
    }

    return `
    <div class="event-card type-${e.type}" onclick="showEventDetails('${e.id}')">
      <div class="event-card-date">
        ${dateDisplay}
      </div>
      <div class="event-card-info">
        <h3>${e.title}</h3>
        <div class="event-card-meta">
          <span><i class="ph ph-clock"></i> ${e.time}</span>
          <span class="badge badge-${e.type}">${formatType(e.type)}</span>
        </div>
      </div>
      <div class="event-card-arrow">
        <i class="ph ph-caret-right"></i>
      </div>
    </div>
    `;
  }).join('');

  html += `</div>`;
  return html;
}

function renderFilters() {
  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'curso', label: 'Cursos' },
    { id: 'retiro', label: 'Retiros' },
    { id: 'charla', label: 'Charlas' },
    { id: 'comunitario', label: 'Comunitario' },
    { id: 'otro', label: 'Otros' }
  ];

  return filters.map(f => `
    <button class="filter-btn ${state.activeFilter === f.id ? 'active' : ''}" onclick="setFilter('${f.id}')">
      ${f.label}
    </button>
  `).join('');
}

function renderCalendarHeader() {
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const month = monthNames[state.currentDate.getMonth()];
  const year = state.currentDate.getFullYear();

  return `
    <div class="calendar-header">
      <button class="btn btn-outline" onclick="goToToday()">Hoy</button>
      <div class="month-selector">
        <button class="icon-btn" onclick="prevMonth()"><i class="ph ph-caret-left"></i></button>
        <h2>${month} ${year}</h2>
        <button class="icon-btn" onclick="nextMonth()"><i class="ph ph-caret-right"></i></button>
      </div>
      <div style="width: 70px;"></div> <!-- Spacer for alignment -->
    </div>
  `;
}

function renderCalendarGrid() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 0 = Sunday, 1 = Monday... We want Monday to be first day
  let startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalDays = lastDay.getDate();

  let gridHtml = `
    <div class="calendar-grid">
      <div class="weekday-header">Lun</div>
      <div class="weekday-header">Mar</div>
      <div class="weekday-header">Mié</div>
      <div class="weekday-header">Jue</div>
      <div class="weekday-header">Vie</div>
      <div class="weekday-header">Sáb</div>
      <div class="weekday-header">Dom</div>
  `;

  // Empty cells before start of month
  for (let i = 0; i < startingDay; i++) {
    gridHtml += `<div class="calendar-day empty"></div>`;
  }

  // Days
  const today = new Date();
  const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  for (let day = 1; day <= totalDays; day++) {
    const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    const currentDayOfWeek = new Date(year, month, day).getDay();
    const weekdayName = weekdays[currentDayOfWeek];

    // Get events for this day
    let dayEvents = state.events.filter(e => {
      const startDate = e.date;
      const endDate = e.endDate || e.date;
      return currentDateStr >= startDate && currentDateStr <= endDate;
    });

    if (state.activeFilter !== 'all') {
      dayEvents = dayEvents.filter(e => e.type === state.activeFilter);
    }

    dayEvents = dayEvents.sort((a, b) => a.time.localeCompare(b.time));

    let eventsHtml = dayEvents.map(e => `
      <div class="event-item type-${e.type}" onclick="showEventDetails('${e.id}')">
        ${e.time} - ${e.title}
      </div>
    `).join('');

    const hasEventsClass = dayEvents.length > 0 ? 'has-events' : '';

    gridHtml += `
      <div class="calendar-day ${isToday ? 'today' : ''} ${hasEventsClass}">
        <div class="day-header">
          <span class="day-number">${day}</span>
          <span class="mobile-weekday">${weekdayName}</span>
        </div>
        <div class="day-events">
          ${eventsHtml}
        </div>
      </div>
    `;
  }

  // Empty cells after end of month to complete grid
  const totalCells = startingDay + totalDays;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remainingCells; i++) {
    gridHtml += `<div class="calendar-day empty"></div>`;
  }

  gridHtml += `</div>`;
  return gridHtml;
}

function renderEventModal() {
  return `
    <div class="modal-overlay" id="eventModalOverlay" onclick="closeEventModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="closeEventModal()"><i class="ph ph-x"></i></button>
        <div id="eventModalBody"></div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// LOGIN VIEW
// ----------------------------------------------------

function renderLogin() {
  appDiv.innerHTML = `
    ${Header()}
    <main class="main-content">
      <div class="login-container">
        <div class="login-icon">
          <i class="ph ph-lock-key"></i>
        </div>
        <h2 class="login-title">Acceso Administrativo</h2>
        <form onsubmit="handleLogin(event)">
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" class="form-control" placeholder="Ingrese contraseña..." required autofocus>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
            <i class="ph ph-sign-in"></i> Entrar
          </button>
        </form>
      </div>
    </main>
  `;
}

// ----------------------------------------------------
// ADMIN VIEW
// ----------------------------------------------------

function renderAdmin() {
  const sortedEvents = [...state.events].sort((a, b) => new Date(a.date) - new Date(b.date));

  appDiv.innerHTML = `
    ${Header()}
    <main class="main-content">
      <div class="admin-header">
        <h2>Gestión de Actividades</h2>
        <button class="btn btn-primary" onclick="openEventForm()"><i class="ph ph-plus"></i> Nueva Actividad</button>
      </div>
      
      <div class="events-table-wrapper">
        <table class="events-table">
          <thead>
            <tr>
              <th>Fechas y Hora</th>
              <th>Actividad</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${sortedEvents.map(e => `
              <tr>
                <td>
                  <div style="font-weight: 500;">${formatDateRange(e.date, e.endDate)}</div>
                  <div style="color: var(--text-muted); font-size: 0.875rem;">${e.time}</div>
                </td>
                <td style="font-weight: 500;">${e.title}</td>
                <td>
                  <span class="badge badge-${e.type}">
                    ${formatType(e.type)}
                  </span>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="icon-btn" onclick="openEventForm('${e.id}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                    <button class="icon-btn" style="color: var(--error);" onclick="deleteEvent('${e.id}')" title="Eliminar"><i class="ph ph-trash"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
            ${sortedEvents.length === 0 ? `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No hay actividades programadas.</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    </main>
    ${renderAdminFormModal()}
  `;
}

function renderAdminFormModal() {
  return `
    <div class="modal-overlay" id="adminModalOverlay" onclick="closeAdminModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <button class="modal-close" onclick="closeAdminModal()"><i class="ph ph-x"></i></button>
        <h2 class="modal-title" id="adminModalTitle">Nueva Actividad</h2>
        <form id="eventForm" onsubmit="saveEvent(event)">
          <input type="hidden" id="eventId">
          <div class="form-group">
            <label for="eventTitle">Título</label>
            <input type="text" id="eventTitle" class="form-control" required>
          </div>
          <div style="display: flex; gap: 1rem;">
            <div class="form-group" style="flex: 1;">
              <label for="eventDate">Fecha Inicio</label>
              <input type="date" id="eventDate" class="form-control" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="eventEndDate">Fecha Fin</label>
              <input type="date" id="eventEndDate" class="form-control">
              <small style="color: var(--text-muted); font-size: 0.75rem;">Opcional si dura 1 día</small>
            </div>
          </div>
          <div style="display: flex; gap: 1rem;">
            <div class="form-group" style="flex: 1;">
              <label for="eventType">Tipo</label>
              <select id="eventType" class="form-control" required>
                <option value="curso">Curso</option>
                <option value="retiro">Retiro</option>
                <option value="charla">Charla / Taller</option>
                <option value="comunitario">Actividad Comunitaria</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="eventTime">Hora</label>
              <input type="time" id="eventTime" class="form-control" required>
            </div>
          </div>
          <div class="form-group">
            <label for="eventDesc">Descripción (Opcional)</label>
            <textarea id="eventDesc" class="form-control" rows="3"></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Guardar Actividad</button>
        </form>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// ACTIONS & LOGIC
// ----------------------------------------------------

window.setFilter = (filterId) => {
  state.activeFilter = filterId;
  render();
};

window.prevMonth = () => {
  state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1);
  render();
};

window.nextMonth = () => {
  state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1);
  render();
};

window.goToToday = () => {
  state.currentDate = new Date();
  render();
};

window.showEventDetails = (id) => {
  const event = state.events.find(e => e.id === id);
  if (!event) return;

  document.getElementById('eventModalBody').innerHTML = `
    <h2 class="modal-title" style="margin-bottom: 0.5rem;">${event.title}</h2>
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
      <span class="badge badge-${event.type}">${formatType(event.type)}</span>
    </div>
    
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--text-muted);">
      <i class="ph ph-calendar-blank"></i>
      <span>${formatDateRange(event.date, event.endDate)}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; color: var(--text-muted);">
      <i class="ph ph-clock"></i>
      <span>${event.time}</span>
    </div>
    
    ${event.description ? `
      <div style="background: var(--background); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
        <p style="white-space: pre-wrap;">${event.description}</p>
      </div>
    ` : ''}
  `;
  document.getElementById('eventModalOverlay').classList.add('active');
};

window.closeEventModal = (e) => {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('eventModalOverlay').classList.remove('active');
};

window.handleLogin = (e) => {
  e.preventDefault();
  const pwd = document.getElementById('password').value;

  if (CONFIG.API_URL) {
    // Si hay backend, guardamos la contraseña y entramos. 
    // La validación real ocurre al intentar guardar o borrar.
    state.isAdminLoggedIn = true;
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('adminPassword', pwd);
    window.location.hash = '#admin';
  } else {
    // Modo de prueba local
    if (pwd === 'admin123') {
      state.isAdminLoggedIn = true;
      localStorage.setItem('adminLoggedIn', 'true');
      window.location.hash = '#admin';
    } else {
      alert('Contraseña incorrecta. (Hint: admin123)');
    }
  }
};

window.logout = () => {
  state.isAdminLoggedIn = false;
  localStorage.removeItem('adminLoggedIn');
  localStorage.removeItem('adminPassword');
  window.location.hash = '#';
};

window.openEventForm = (id = null) => {
  document.getElementById('adminModalTitle').innerText = id ? 'Editar Actividad' : 'Nueva Actividad';
  const form = document.getElementById('eventForm');

  if (id) {
    const event = state.events.find(e => e.id === id);
    document.getElementById('eventId').value = event.id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventEndDate').value = event.endDate || '';
    document.getElementById('eventTime').value = event.time;
    document.getElementById('eventType').value = event.type;
    document.getElementById('eventDesc').value = event.description || '';
  } else {
    form.reset();
    document.getElementById('eventId').value = '';
    // Set default date to today
    const today = new Date();
    document.getElementById('eventDate').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    document.getElementById('eventEndDate').value = '';
  }

  document.getElementById('adminModalOverlay').classList.add('active');
};

window.closeAdminModal = (e) => {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('adminModalOverlay').classList.remove('active');
};

window.saveEvent = async (e) => {
  e.preventDefault();

  const id = document.getElementById('eventId').value || Date.now().toString();
  const newEvent = {
    id,
    title: document.getElementById('eventTitle').value,
    date: document.getElementById('eventDate').value,
    endDate: document.getElementById('eventEndDate').value || document.getElementById('eventDate').value,
    time: document.getElementById('eventTime').value,
    type: document.getElementById('eventType').value,
    description: document.getElementById('eventDesc').value
  };

  // Guardamos estado por si la red falla
  const previousEvents = [...state.events];

  const existingIndex = state.events.findIndex(ev => ev.id === id);
  if (existingIndex >= 0) {
    state.events[existingIndex] = newEvent;
  } else {
    state.events.push(newEvent);
  }

  const success = await syncEventsToBackend();
  if (!success) {
    state.events = previousEvents; // Revertir cambios
  } else {
    closeAdminModal();
  }
  render();
};

window.deleteEvent = async (id) => {
  if (confirm('¿Está seguro de que desea eliminar esta actividad?')) {
    const previousEvents = [...state.events];
    state.events = state.events.filter(e => e.id !== id);

    const success = await syncEventsToBackend();
    if (!success) {
      state.events = previousEvents; // Revertir
    }
    render();
  }
};

// --- Integración con AWS Backend ---
async function fetchEventsFromBackend() {
  if (!CONFIG.API_URL) return; // Modo prueba
  try {
    const response = await fetch(CONFIG.API_URL);
    if (response.ok) {
      state.events = await response.json();
    }
  } catch (error) {
    console.error("Error al obtener actividades:", error);
  }
}

async function syncEventsToBackend() {
  if (!CONFIG.API_URL) return true; // Modo prueba, simular éxito

  const pwd = localStorage.getItem('adminPassword') || '';
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pwd}`
      },
      body: JSON.stringify(state.events)
    });

    if (response.status === 401) {
      alert("No autorizado. Contraseña incorrecta.");
      window.logout();
      return false;
    }

    if (!response.ok) throw new Error("Error en servidor");
    return true;
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Error de conexión. Intente nuevamente.");
    return false;
  }
}

// Utils
function formatType(type) {
  const map = {
    'curso': 'Curso',
    'retiro': 'Retiro',
    'charla': 'Charla / Taller',
    'comunitario': 'Comunitario',
    'otro': 'Otro'
  };
  return map[type] || 'Otro';
}

function formatDateRange(startDate, endDate) {
  if (!endDate || startDate === endDate) {
    return formatDate(startDate);
  }
  const startParts = startDate.split('-');
  const endParts = endDate.split('-');

  const dStart = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  const dEnd = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  if (startParts[1] === endParts[1] && startParts[0] === endParts[0]) {
    return `Del ${dStart.getDate()} al ${dEnd.getDate()} de ${months[dStart.getMonth()]} ${dStart.getFullYear()}`;
  } else if (startParts[0] === endParts[0]) {
    return `Del ${dStart.getDate()} ${months[dStart.getMonth()]} al ${dEnd.getDate()} ${months[dEnd.getMonth()]} ${dStart.getFullYear()}`;
  } else {
    return `Del ${dStart.getDate()} ${months[dStart.getMonth()]} ${dStart.getFullYear()} al ${dEnd.getDate()} ${months[dEnd.getMonth()]} ${dEnd.getFullYear()}`;
  }
}

function formatDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Initialization
window.addEventListener('hashchange', render);

(async function init() {
  if (CONFIG.API_URL) {
    appDiv.innerHTML = '<div class="loading-state"><div class="loader"></div><p>Cargando calendario...</p></div>';
    await fetchEventsFromBackend();
  }
  render();
})();
