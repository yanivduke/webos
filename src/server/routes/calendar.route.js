/**
 * Calendar API Routes for WebOS
 * Handles calendar and event management
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// In-Memory Data Store
// ============================================================================

// Mock database for calendars
const calendars = new Map();

// Mock database for events
const events = new Map();

// Initialize with default calendar
let calendarIdCounter = 1;
let eventIdCounter = 1;

const defaultCalendar = {
  id: 'cal_1',
  name: 'Personal',
  color: '#0055aa',
  visible: true,
  isDefault: true,
  created: new Date().toISOString()
};

calendars.set(defaultCalendar.id, defaultCalendar);

// ============================================================================
// Helper Functions
// ============================================================================

function generateCalendarId() {
  return `cal_${calendarIdCounter++}`;
}

function generateEventId() {
  return `evt_${eventIdCounter++}`;
}

function parseDate(dateString) {
  return dateString ? new Date(dateString) : null;
}

function isDateInRange(date, startDate, endDate) {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return d >= start && d <= end;
}

function eventsOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 < e2 && e1 > s2;
}

// ============================================================================
// Calendar Endpoints
// ============================================================================

// GET /api/calendar/calendars - Get all calendars
router.get('/calendars', (req, res) => {
  try {
    const calendarList = Array.from(calendars.values());
    res.json({
      success: true,
      calendars: calendarList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/calendar/calendars/:id - Get single calendar
router.get('/calendars/:id', (req, res) => {
  try {
    const calendar = calendars.get(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: 'Calendar not found'
      });
    }

    res.json({
      success: true,
      calendar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/calendar/calendars - Create calendar
router.post('/calendars', (req, res) => {
  try {
    const { name, color, visible, isDefault } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Calendar name is required'
      });
    }

    const id = generateCalendarId();
    const calendar = {
      id,
      name: name.trim(),
      color: color || '#0055aa',
      visible: visible !== false,
      isDefault: isDefault || false,
      created: new Date().toISOString()
    };

    // If this is set as default, unset others
    if (calendar.isDefault) {
      for (const cal of calendars.values()) {
        cal.isDefault = false;
      }
    }

    calendars.set(id, calendar);

    res.status(201).json({
      success: true,
      calendar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/calendar/calendars/:id - Update calendar
router.put('/calendars/:id', (req, res) => {
  try {
    const calendar = calendars.get(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: 'Calendar not found'
      });
    }

    const { name, color, visible, isDefault } = req.body;

    if (name !== undefined) calendar.name = name.trim();
    if (color !== undefined) calendar.color = color;
    if (visible !== undefined) calendar.visible = visible;
    if (isDefault !== undefined) {
      if (isDefault) {
        // Unset default on all other calendars
        for (const cal of calendars.values()) {
          cal.isDefault = false;
        }
      }
      calendar.isDefault = isDefault;
    }

    res.json({
      success: true,
      calendar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/calendar/calendars/:id - Delete calendar
router.delete('/calendars/:id', (req, res) => {
  try {
    const calendar = calendars.get(req.params.id);

    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: 'Calendar not found'
      });
    }

    // Don't allow deleting the last calendar
    if (calendars.size <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the last calendar'
      });
    }

    // Find a default calendar to move events to
    let targetCalendar = null;
    for (const cal of calendars.values()) {
      if (cal.id !== req.params.id) {
        targetCalendar = cal;
        if (cal.isDefault) break;
      }
    }

    // Move all events from this calendar to target calendar
    if (targetCalendar) {
      for (const event of events.values()) {
        if (event.calendarId === req.params.id) {
          event.calendarId = targetCalendar.id;
        }
      }
    }

    calendars.delete(req.params.id);

    res.json({
      success: true,
      message: 'Calendar deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Event Endpoints
// ============================================================================

// GET /api/calendar/events - Get events (with optional date range filter)
router.get('/events', (req, res) => {
  try {
    const { startDate, endDate, calendarIds } = req.query;

    let eventList = Array.from(events.values());

    // Filter by calendar IDs if provided
    if (calendarIds) {
      const ids = calendarIds.split(',');
      eventList = eventList.filter(event => ids.includes(event.calendarId));
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      eventList = eventList.filter(event => {
        return eventsOverlap(event.start, event.end, startDate, endDate);
      });
    }

    // Sort by start date
    eventList.sort((a, b) => new Date(a.start) - new Date(b.start));

    res.json({
      success: true,
      events: eventList,
      count: eventList.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/calendar/events/:id - Get single event
router.get('/events/:id', (req, res) => {
  try {
    const event = events.get(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/calendar/events - Create event
router.post('/events', (req, res) => {
  try {
    const {
      title,
      description,
      start,
      end,
      allDay,
      recurring,
      color,
      calendarId,
      reminders
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Event title is required'
      });
    }

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Start and end dates are required'
      });
    }

    if (new Date(start) >= new Date(end)) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date'
      });
    }

    if (calendarId && !calendars.has(calendarId)) {
      return res.status(400).json({
        success: false,
        error: 'Calendar not found'
      });
    }

    const id = generateEventId();
    const now = new Date().toISOString();

    const event = {
      id,
      title: title.trim(),
      description: description || '',
      start,
      end,
      allDay: allDay || false,
      recurring: recurring || null,
      color: color || '#0055aa',
      calendarId: calendarId || Array.from(calendars.values())[0].id,
      reminders: reminders || [],
      created: now,
      modified: now
    };

    events.set(id, event);

    res.status(201).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/calendar/events/:id - Update event
router.put('/events/:id', (req, res) => {
  try {
    const event = events.get(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const {
      title,
      description,
      start,
      end,
      allDay,
      recurring,
      color,
      calendarId,
      reminders
    } = req.body;

    // Validation
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Event title cannot be empty'
      });
    }

    if (start !== undefined && end !== undefined) {
      if (new Date(start) >= new Date(end)) {
        return res.status(400).json({
          success: false,
          error: 'End date must be after start date'
        });
      }
    }

    if (calendarId !== undefined && !calendars.has(calendarId)) {
      return res.status(400).json({
        success: false,
        error: 'Calendar not found'
      });
    }

    // Update fields
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description;
    if (start !== undefined) event.start = start;
    if (end !== undefined) event.end = end;
    if (allDay !== undefined) event.allDay = allDay;
    if (recurring !== undefined) event.recurring = recurring;
    if (color !== undefined) event.color = color;
    if (calendarId !== undefined) event.calendarId = calendarId;
    if (reminders !== undefined) event.reminders = reminders;
    event.modified = new Date().toISOString();

    res.json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/calendar/events/:id - Delete event
router.delete('/events/:id', (req, res) => {
  try {
    const event = events.get(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    events.delete(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Import/Export Endpoints
// ============================================================================

// POST /api/calendar/import - Import ICS data
router.post('/import', (req, res) => {
  try {
    const { icsData, calendarId } = req.body;

    if (!icsData) {
      return res.status(400).json({
        success: false,
        error: 'ICS data is required'
      });
    }

    if (!calendarId || !calendars.has(calendarId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid calendar ID is required'
      });
    }

    // Simple ICS parser (basic implementation)
    const lines = icsData.split(/\r?\n/);
    let importedCount = 0;
    let currentEvent = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === 'BEGIN:VEVENT') {
        currentEvent = {
          calendarId,
          allDay: false,
          recurring: null,
          reminders: [],
          color: calendars.get(calendarId).color
        };
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.title && currentEvent.start && currentEvent.end) {
          const id = generateEventId();
          const now = new Date().toISOString();

          const event = {
            ...currentEvent,
            id,
            created: now,
            modified: now
          };

          events.set(id, event);
          importedCount++;
        }
        currentEvent = null;
      } else if (currentEvent) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');

        if (key === 'SUMMARY') {
          currentEvent.title = value;
        } else if (key === 'DESCRIPTION') {
          currentEvent.description = value;
        } else if (key.startsWith('DTSTART')) {
          currentEvent.start = parseICSDate(value);
          if (key.includes('VALUE=DATE')) {
            currentEvent.allDay = true;
          }
        } else if (key.startsWith('DTEND')) {
          currentEvent.end = parseICSDate(value);
        }
      }
    }

    res.json({
      success: true,
      imported: importedCount,
      message: `Imported ${importedCount} event(s)`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/calendar/export/:calendarId? - Export ICS data
router.get('/export/:calendarId?', (req, res) => {
  try {
    const { calendarId } = req.params;

    let eventList = Array.from(events.values());

    if (calendarId) {
      if (!calendars.has(calendarId)) {
        return res.status(404).json({
          success: false,
          error: 'Calendar not found'
        });
      }
      eventList = eventList.filter(e => e.calendarId === calendarId);
    }

    // Generate ICS content
    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//WebOS//Calendar//EN\r\n';
    ics += 'CALSCALE:GREGORIAN\r\n';

    for (const event of eventList) {
      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${event.id}\r\n`;
      ics += `DTSTAMP:${formatICSDate(event.created)}\r\n`;
      ics += `DTSTART:${formatICSDate(event.start)}\r\n`;
      ics += `DTEND:${formatICSDate(event.end)}\r\n`;
      ics += `SUMMARY:${escapeICS(event.title)}\r\n`;

      if (event.description) {
        ics += `DESCRIPTION:${escapeICS(event.description)}\r\n`;
      }

      ics += 'END:VEVENT\r\n';
    }

    ics += 'END:VCALENDAR\r\n';

    res.json({
      success: true,
      icsData: ics,
      eventCount: eventList.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// Utility Endpoints
// ============================================================================

// GET /api/calendar/stats - Get calendar statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalCalendars: calendars.size,
      totalEvents: events.size,
      upcomingEvents: 0,
      pastEvents: 0
    };

    const now = new Date();
    for (const event of events.values()) {
      if (new Date(event.start) >= now) {
        stats.upcomingEvents++;
      } else {
        stats.pastEvents++;
      }
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/calendar/clear - Clear all calendar data (for testing)
router.delete('/clear', (req, res) => {
  try {
    events.clear();
    calendars.clear();

    // Recreate default calendar
    calendars.set(defaultCalendar.id, { ...defaultCalendar });

    res.json({
      success: true,
      message: 'All calendar data cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ICS Helper Functions
// ============================================================================

function parseICSDate(dateString) {
  // Format: YYYYMMDDTHHMMSS or YYYYMMDD
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1;
  const day = parseInt(dateString.substring(6, 8));

  if (dateString.includes('T')) {
    const hour = parseInt(dateString.substring(9, 11));
    const minute = parseInt(dateString.substring(11, 13));
    const second = parseInt(dateString.substring(13, 15));
    return new Date(year, month, day, hour, minute, second).toISOString();
  } else {
    return new Date(year, month, day).toISOString();
  }
}

function formatICSDate(dateString) {
  const date = new Date(dateString);
  const pad = (n) => n.toString().padStart(2, '0');

  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function escapeICS(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

module.exports = router;
