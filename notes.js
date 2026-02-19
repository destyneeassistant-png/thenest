// Notes JavaScript

const DB_NAME = 'nest_db';
const DB_VERSION = 2;

// Database class
class NotesDatabase {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('notes')) {
                    const store = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    async saveNote(note) {
        note.updated = new Date().toISOString();
        return this.put('notes', note);
    }

    async getNotes() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes'], 'readonly');
            const store = transaction.objectStore('notes');
            const index = store.index('date');
            const request = index.openCursor(null, 'prev');
            const notes = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    notes.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(notes);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteNote(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes'], 'readwrite');
            const store = transaction.objectStore('notes');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// Notes Manager class
class NotesManager {
    constructor(db) {
        this.db = db;
        this.notes = [];
        this.currentNote = null;
        this.saveTimeout = null;
    }

    async init() {
        this.setupEventListeners();
        await this.loadNotesList();
    }

    setupEventListeners() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });

        // New note button
        document.getElementById('new-note-btn').addEventListener('click', () => this.createNewNote());

        // Delete button
        document.getElementById('delete-btn').addEventListener('click', () => this.deleteCurrentNote());

        // Auto-save on input
        document.getElementById('note-title').addEventListener('input', () => this.scheduleSave());
        document.getElementById('note-content').addEventListener('input', () => {
            this.updateWordCount();
            this.scheduleSave();
        });
    }

    async loadNotesList() {
        try {
            this.notes = await this.db.getNotes();
            this.renderNotesList();
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    }

    renderNotesList() {
        const container = document.getElementById('notes-list');

        if (this.notes.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">[Empty] No notes yet</p>';
            return;
        }

        container.innerHTML = this.notes.map(note => {
            const title = note.title || 'Untitled Note';
            const date = new Date(note.date);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isActive = this.currentNote && this.currentNote.id === note.id;

            return `
                <div class="note-preview ${isActive ? 'active' : ''}" data-note-id="${note.id}">
                    <div class="note-preview-title">${this.escapeHtml(title)}</div>
                    <div class="note-preview-date">${dateStr}</div>
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.note-preview').forEach(el => {
            el.addEventListener('click', () => {
                const noteId = parseInt(el.dataset.noteId);
                this.loadNote(noteId);
            });
        });
    }

    async loadNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.currentNote = note;

        // Show editor, hide empty state
        document.getElementById('empty-editor').style.display = 'none';
        document.getElementById('editor-content').style.display = 'flex';

        // Load content
        document.getElementById('note-title').value = note.title || '';
        document.getElementById('note-content').value = note.content || '';

        // Update timestamp
        this.updateTimestamp();

        // Update word count
        this.updateWordCount();

        // Update list selection
        this.renderNotesList();

        // Reset save status
        this.updateSaveStatus('saved');
    }

    createNewNote() {
        this.currentNote = {
            title: '',
            content: '',
            date: new Date().toISOString()
        };

        // Show editor
        document.getElementById('empty-editor').style.display = 'none';
        document.getElementById('editor-content').style.display = 'flex';

        // Clear fields
        document.getElementById('note-title').value = '';
        document.getElementById('note-content').value = '';
        document.getElementById('note-timestamp').textContent = 'Just created';
        document.getElementById('word-count').textContent = '0 words';

        // Focus title
        document.getElementById('note-title').focus();

        this.updateSaveStatus('saved');
    }

    scheduleSave() {
        this.updateSaveStatus('saving');

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(() => this.saveCurrentNote(), 1000);
    }

    async saveCurrentNote() {
        if (!this.currentNote) return;

        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value;

        this.currentNote.title = title || 'Untitled Note';
        this.currentNote.content = content;

        try {
            const id = await this.db.saveNote(this.currentNote);
            
            // Update ID if new note
            if (!this.currentNote.id) {
                this.currentNote.id = id;
                this.notes.unshift(this.currentNote);
            } else {
                // Update in list
                const index = this.notes.findIndex(n => n.id === this.currentNote.id);
                if (index !== -1) {
                    this.notes[index] = this.currentNote;
                }
            }

            // Sort by date
            this.notes.sort((a, b) => new Date(b.date) - new Date(a.date));

            this.updateTimestamp();
            this.updateSaveStatus('saved');
            this.renderNotesList();
        } catch (error) {
            console.error('Error saving note:', error);
            this.updateSaveStatus('error');
        }
    }

    async deleteCurrentNote() {
        if (!this.currentNote) return;

        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            if (this.currentNote.id) {
                await this.db.deleteNote(this.currentNote.id);
                this.notes = this.notes.filter(n => n.id !== this.currentNote.id);
            }

            // Reset to empty state
            this.currentNote = null;
            document.getElementById('empty-editor').style.display = 'flex';
            document.getElementById('editor-content').style.display = 'none';

            this.renderNotesList();
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Failed to delete note');
        }
    }

    updateTimestamp() {
        if (!this.currentNote) return;

        const date = new Date(this.currentNote.updated || this.currentNote.date);
        const now = new Date();
        const diff = now - date;

        let text = '';
        if (diff < 60000) text = 'Last edited just now';
        else if (diff < 3600000) text = `Last edited ${Math.floor(diff / 60000)} min ago`;
        else if (diff < 86400000) text = `Last edited ${Math.floor(diff / 3600000)} hours ago`;
        else text = `Last edited ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

        document.getElementById('note-timestamp').textContent = text;
    }

    updateSaveStatus(status) {
        const el = document.getElementById('save-status');
        el.className = 'save-status ' + status;

        switch(status) {
            case 'saving':
                el.innerHTML = '<span>[...]</span> Saving...';
                break;
            case 'saved':
                el.innerHTML = '<span>[OK]</span> Saved';
                break;
            case 'error':
                el.innerHTML = '<span>[X]</span> Error saving';
                break;
        }
    }

    updateWordCount() {
        const content = document.getElementById('note-content').value;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        document.getElementById('word-count').textContent = `${words} word${words !== 1 ? 's' : ''}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const db = new NotesDatabase();
    await db.init();
    const notesManager = new NotesManager(db);
    await notesManager.init();
});
