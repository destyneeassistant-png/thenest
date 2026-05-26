// Optional Supabase calendar sync adapter for The Nest.
// Keeps calendar.js localStorage-first. If Supabase is not configured, this file
// quietly disables itself and the app continues working locally.

(function () {
    const DEFAULT_TABLE = 'calendar_events';
    const DEFAULT_SYNC_LOG_TABLE = 'assistant_sync_log';

    const blankResult = (reason) => ({ ok: false, skipped: true, reason });

    function getConfig() {
        const cfg = window.NEST_SUPABASE_CONFIG || {};
        if (!cfg.enabled) return null;
        if (!cfg.url || !cfg.anonKey || !cfg.ownerId) return null;
        if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
        return {
            url: cfg.url,
            anonKey: cfg.anonKey,
            ownerId: cfg.ownerId,
            calendarTable: cfg.calendarTable || DEFAULT_TABLE,
            syncLogTable: cfg.syncLogTable || DEFAULT_SYNC_LOG_TABLE
        };
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function toDbEvent(event, ownerId) {
        return {
            id: event.id,
            owner_id: ownerId,
            title: event.title || '',
            event_date: event.date,
            start_time: event.start,
            end_time: event.end,
            calendar: event.calendar || 'other',
            repeat_rule: event.repeat || 'none',
            reminder: String(event.reminder || 'none'),
            location: event.location || '',
            notes: event.notes || '',
            source: event.source || 'nest_frontend',
            status: event.status || 'planned',
            is_deleted: false,
            updated_at: nowIso()
        };
    }

    function fromDbEvent(row) {
        return {
            id: row.id,
            title: row.title || '',
            date: row.event_date,
            start: (row.start_time || '09:00').slice(0, 5),
            end: (row.end_time || '10:00').slice(0, 5),
            calendar: row.calendar || 'other',
            repeat: row.repeat_rule || 'none',
            reminder: row.reminder || 'none',
            location: row.location || '',
            notes: row.notes || '',
            source: row.source || 'supabase',
            status: row.status || 'planned',
            updatedAt: row.updated_at || row.created_at || null
        };
    }

    function newerEvent(localEvent, remoteEvent) {
        const localTime = Date.parse(localEvent.updatedAt || localEvent.updated_at || localEvent.createdAt || 0) || 0;
        const remoteTime = Date.parse(remoteEvent.updatedAt || remoteEvent.updated_at || remoteEvent.createdAt || 0) || 0;
        return localTime >= remoteTime ? localEvent : remoteEvent;
    }

    class NestSupabaseCalendarSync {
        constructor() {
            this.config = getConfig();
            this.client = this.config ? window.supabase.createClient(this.config.url, this.config.anonKey) : null;
        }

        get enabled() {
            return Boolean(this.config && this.client);
        }

        async pullEvents() {
            if (!this.enabled) return blankResult('Supabase calendar sync is not configured.');
            const { data, error } = await this.client
                .from(this.config.calendarTable)
                .select('*')
                .eq('owner_id', this.config.ownerId)
                .eq('is_deleted', false)
                .order('event_date', { ascending: true })
                .order('start_time', { ascending: true });
            if (error) throw error;
            return { ok: true, events: (data || []).map(fromDbEvent) };
        }

        async upsertEvent(event) {
            if (!this.enabled) return blankResult('Supabase calendar sync is not configured.');
            const { error } = await this.client
                .from(this.config.calendarTable)
                .upsert(toDbEvent(event, this.config.ownerId), { onConflict: 'id' });
            if (error) throw error;
            await this.logSync('frontend_upsert_event', { eventId: event.id });
            return { ok: true };
        }

        async replaceEvents(events) {
            if (!this.enabled) return blankResult('Supabase calendar sync is not configured.');
            if (!Array.isArray(events) || !events.length) return { ok: true };
            const { error } = await this.client
                .from(this.config.calendarTable)
                .upsert(events.map(event => toDbEvent(event, this.config.ownerId)), { onConflict: 'id' });
            if (error) throw error;
            await this.logSync('frontend_replace_events', { count: events.length });
            return { ok: true };
        }

        async deleteEvent(id) {
            if (!this.enabled) return blankResult('Supabase calendar sync is not configured.');
            const { error } = await this.client
                .from(this.config.calendarTable)
                .update({ is_deleted: true, updated_at: nowIso(), source: 'nest_frontend' })
                .eq('id', id)
                .eq('owner_id', this.config.ownerId);
            if (error) throw error;
            await this.logSync('frontend_delete_event', { eventId: id });
            return { ok: true };
        }

        mergeEvents(localEvents, remoteEvents) {
            const merged = new Map();
            [...(localEvents || []), ...(remoteEvents || [])].forEach(event => {
                if (!event || !event.id) return;
                const current = merged.get(event.id);
                merged.set(event.id, current ? newerEvent(current, event) : event);
            });
            return Array.from(merged.values()).sort((a, b) =>
                String(a.date).localeCompare(String(b.date)) || String(a.start).localeCompare(String(b.start))
            );
        }

        async logSync(action, details = {}) {
            if (!this.enabled || !this.config.syncLogTable) return;
            await this.client.from(this.config.syncLogTable).insert({
                owner_id: this.config.ownerId,
                actor: 'nest_frontend',
                action,
                details
            });
        }
    }

    window.NestSupabaseCalendarSync = NestSupabaseCalendarSync;
})();
