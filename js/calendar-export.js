/* ═══════════════════════════════════════════════════════════════
   CALENDAR EXPORT — Export événements vers iCal/Google Calendar
   Intégration avec EventsCalendar, boutons d'export partout
   ═══════════════════════════════════════════════════════════════ */
const CalendarExport = (() => {
  'use strict';

  // ── Utilitaires de formatage de date iCal ──
  function _toICSDate(date) {
    if (typeof date === 'string') date = new Date(date);
    if (isNaN(date.getTime())) date = new Date();
    var y = date.getUTCFullYear();
    var m = String(date.getUTCMonth() + 1).padStart(2, '0');
    var d = String(date.getUTCDate()).padStart(2, '0');
    var h = String(date.getUTCHours()).padStart(2, '0');
    var mn = String(date.getUTCMinutes()).padStart(2, '0');
    var s = String(date.getUTCSeconds()).padStart(2, '0');
    return y + m + d + 'T' + h + mn + s + 'Z';
  }

  function _toGoogleDate(date) {
    if (typeof date === 'string') date = new Date(date);
    if (isNaN(date.getTime())) date = new Date();
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function _escapeICS(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  function _uid() {
    return 'culte-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '@scenews.sn';
  }

  // ── Génération de fichier ICS ──
  function generateICS(event) {
    var startDate = event.date ? new Date(event.date) : new Date();
    var endDate = new Date(startDate);
    if (event.endDate) {
      endDate = new Date(event.endDate);
    } else {
      endDate.setHours(endDate.getHours() + (event.duration || 2));
    }

    var location = [event.lieu, event.region, 'Sénégal'].filter(Boolean).join(', ');
    var description = (event.description || event.name || '') + '\\n\\nVia Scenews — Culture Sénégal';

    var ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Scenews//Culture Senegal//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + _uid(),
      'DTSTAMP:' + _toICSDate(new Date()),
      'DTSTART:' + _toICSDate(startDate),
      'DTEND:' + _toICSDate(endDate),
      'SUMMARY:' + _escapeICS(event.name || 'Événement culturel'),
      'DESCRIPTION:' + _escapeICS(description),
      'LOCATION:' + _escapeICS(location),
      'STATUS:CONFIRMED',
      'CATEGORIES:CULTURE,SENEGAL' + (event.type ? ',' + event.type.toUpperCase() : ''),
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Rappel : ' + _escapeICS(event.name || 'Événement') + ' dans 1 heure',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Demain : ' + _escapeICS(event.name || 'Événement'),
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return ics;
  }

  // ── Téléchargement .ics ──
  function downloadICS(event) {
    var ics = generateICS(event);
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var filename = (event.name || 'evenement').replace(/[^a-zA-Z0-9àâéèêëïôùûç\s-]/g, '').replace(/\s+/g, '_').substring(0, 40) + '.ics';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    _showToast('📅 Fichier .ics téléchargé');
  }

  // ── Lien Google Calendar ──
  function getGoogleCalendarURL(event) {
    var startDate = event.date ? new Date(event.date) : new Date();
    var endDate = new Date(startDate);
    if (event.endDate) {
      endDate = new Date(event.endDate);
    } else {
      endDate.setHours(endDate.getHours() + (event.duration || 2));
    }

    var location = [event.lieu, event.region, 'Sénégal'].filter(Boolean).join(', ');
    var details = (event.description || '') + '\n\nVia Scenews — Culture Sénégal';

    var params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.name || 'Événement culturel',
      dates: _toGoogleDate(startDate) + '/' + _toGoogleDate(endDate),
      details: details,
      location: location,
      ctz: 'Africa/Dakar'
    });

    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  function openGoogleCalendar(event) {
    var url = getGoogleCalendarURL(event);
    window.open(url, '_blank');
    _showToast('📅 Google Calendar ouvert');
  }

  // ── Lien Outlook ──
  function getOutlookURL(event) {
    var startDate = event.date ? new Date(event.date) : new Date();
    var endDate = new Date(startDate);
    if (event.endDate) {
      endDate = new Date(event.endDate);
    } else {
      endDate.setHours(endDate.getHours() + (event.duration || 2));
    }

    var location = [event.lieu, event.region, 'Sénégal'].filter(Boolean).join(', ');

    var params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.name || 'Événement culturel',
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      location: location,
      body: (event.description || '') + '\n\nVia Scenews — Culture Sénégal'
    });

    return 'https://outlook.live.com/calendar/0/deeplink/compose?' + params.toString();
  }

  function openOutlook(event) {
    window.open(getOutlookURL(event), '_blank');
    _showToast('📅 Outlook ouvert');
  }

  // ── Export multiple événements ──
  function exportMultipleICS(events) {
    if (!events || !events.length) return;

    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Scenews//Culture Senegal//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Événements Culturels Sénégal'
    ];

    events.forEach(function(event) {
      var startDate = event.date ? new Date(event.date) : new Date();
      var endDate = new Date(startDate);
      if (event.endDate) {
        endDate = new Date(event.endDate);
      } else {
        endDate.setHours(endDate.getHours() + (event.duration || 2));
      }
      var location = [event.lieu, event.region, 'Sénégal'].filter(Boolean).join(', ');

      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + _uid());
      lines.push('DTSTAMP:' + _toICSDate(new Date()));
      lines.push('DTSTART:' + _toICSDate(startDate));
      lines.push('DTEND:' + _toICSDate(endDate));
      lines.push('SUMMARY:' + _escapeICS(event.name || 'Événement'));
      lines.push('DESCRIPTION:' + _escapeICS((event.description || '') + '\\nVia Scenews'));
      lines.push('LOCATION:' + _escapeICS(location));
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');

    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'evenements_culture_senegal.ics';
    a.click();
    URL.revokeObjectURL(a.href);
    _showToast('📅 ' + events.length + ' événements exportés');
  }

  // ── Boutons d'export rendu HTML ──
  function renderExportButtons(event) {
    var eventData = encodeURIComponent(JSON.stringify(event));
    return '<div class="calendar-export-btns" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      '<button class="cal-export-btn" data-action="ics" data-event="' + eventData + '" style="padding:6px 12px;border-radius:8px;border:none;background:#3D9970;color:#fff;font-size:.8rem;cursor:pointer" title="Télécharger .ics">📅 iCal</button>' +
      '<button class="cal-export-btn" data-action="google" data-event="' + eventData + '" style="padding:6px 12px;border-radius:8px;border:none;background:#4285f4;color:#fff;font-size:.8rem;cursor:pointer" title="Google Calendar">📅 Google</button>' +
      '<button class="cal-export-btn" data-action="outlook" data-event="' + eventData + '" style="padding:6px 12px;border-radius:8px;border:none;background:#0078d4;color:#fff;font-size:.8rem;cursor:pointer" title="Outlook">📅 Outlook</button>' +
    '</div>';
  }

  // ── Widget pour le calendrier d'événements ──
  function renderCalendarWidget() {
    if (typeof EventsCalendar === 'undefined') return '';
    var upcoming = [];
    if (EventsCalendar.searchEvents) {
      upcoming = EventsCalendar.searchEvents('').slice(0, 5);
    }
    if (!upcoming.length) return '';

    var html = '<div style="padding:12px;background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.06);margin:12px 0">' +
      '<h3 style="margin:0 0 10px;font-size:.95rem;color:#3D405B">📅 Prochains événements</h3>';

    upcoming.forEach(function(evt) {
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0">' +
        '<div><strong style="font-size:.85rem">' + (evt.name || evt.titre || 'Événement') + '</strong>' +
        '<div style="font-size:.75rem;color:#888">' + (evt.date || '') + ' • ' + (evt.region || '') + '</div></div>' +
        renderExportButtons({ name: evt.name || evt.titre, date: evt.date, region: evt.region, description: evt.description, lieu: evt.lieu }) +
      '</div>';
    });

    html += '<button class="cal-export-all-btn" style="margin-top:10px;width:100%;padding:8px;border-radius:8px;border:none;background:#E07A5F;color:#fff;font-size:.85rem;cursor:pointer">📅 Exporter tous les événements</button></div>';
    return html;
  }

  // ── Toast notification ──
  function _showToast(msg) {
    var existing = document.querySelector('.cal-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'cal-toast';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:20px;font-size:.85rem;z-index:99999;opacity:0;transition:opacity .3s';
    document.body.appendChild(toast);
    setTimeout(function(){toast.style.opacity='1';}, 10);
    setTimeout(function(){toast.style.opacity='0';setTimeout(function(){toast.remove();},300);}, 2500);
  }

  // ── Délégation d'événements globale ──
  function init() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.cal-export-btn');
      if (btn) {
        e.preventDefault();
        try {
          var eventData = JSON.parse(decodeURIComponent(btn.dataset.event));
          var action = btn.dataset.action;
          if (action === 'ics') downloadICS(eventData);
          else if (action === 'google') openGoogleCalendar(eventData);
          else if (action === 'outlook') openOutlook(eventData);
        } catch(err) { console.warn('[CalendarExport] Erreur parse event:', err); }
      }
      // Export tous
      if (e.target.closest('.cal-export-all-btn')) {
        if (typeof EventsCalendar !== 'undefined' && EventsCalendar.searchEvents) {
          var all = EventsCalendar.searchEvents('');
          exportMultipleICS(all);
        }
      }
    });
  }

  return {
    init: init,
    generateICS: generateICS,
    downloadICS: downloadICS,
    getGoogleCalendarURL: getGoogleCalendarURL,
    openGoogleCalendar: openGoogleCalendar,
    getOutlookURL: getOutlookURL,
    openOutlook: openOutlook,
    exportMultipleICS: exportMultipleICS,
    renderExportButtons: renderExportButtons,
    renderCalendarWidget: renderCalendarWidget
  };
})();
