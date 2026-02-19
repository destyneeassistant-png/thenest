// PDF Upload JavaScript

const DB_NAME = 'nest_db';
const DB_VERSION = 2;

// Database class
class UploadDatabase {
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
                if (!db.objectStoreNames.contains('pdf_files')) {
                    db.createObjectStore('pdf_files', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async saveFile(fileData) {
        return this.put('pdf_files', fileData);
    }

    async getFiles() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pdf_files'], 'readonly');
            const store = transaction.objectStore('pdf_files');
            const request = store.openCursor(null, 'prev');
            const files = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    files.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(files);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFile(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pdf_files'], 'readwrite');
            const store = transaction.objectStore('pdf_files');
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

// Upload Manager class
class UploadManager {
    constructor(db) {
        this.db = db;
        this.files = [];
    }

    async init() {
        this.setupEventListeners();
        await this.loadFiles();
    }

    setupEventListeners() {
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const selectBtn = document.getElementById('select-btn');
        const backBtn = document.getElementById('back-btn');

        // Back button
        backBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });

        // Click to browse
        uploadZone.addEventListener('click', () => fileInput.click());
        selectBtn.addEventListener('click', () => fileInput.click());

        // File selection
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFiles(e.target.files);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files).filter(f => 
                f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
            );
            
            if (files.length > 0) {
                this.handleFiles(files);
            } else {
                alert('Please upload PDF files only.');
            }
        });
    }

    async handleFiles(fileList) {
        const files = Array.from(fileList).filter(f => 
            f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
        );

        for (const file of files) {
            await this.uploadFile(file);
        }

        await this.loadFiles();
    }

    async uploadFile(file) {
        const id = Date.now() + Math.random();
        
        // Add to list with loading state
        this.files.unshift({
            id,
            name: file.name,
            size: file.size,
            status: 'uploading',
            progress: 0,
            date: new Date().toISOString()
        });

        this.renderFiles();

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise(r => setTimeout(r, 100));
            this.updateFileProgress(id, progress);
        }

        // Store metadata in IndexedDB
        const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            date: new Date().toISOString(),
            status: 'complete'
        };

        try {
            const savedId = await this.db.saveFile(fileData);
            
            // Update file in list
            const fileIndex = this.files.findIndex(f => f.id === id);
            if (fileIndex !== -1) {
                this.files[fileIndex] = { ...fileData, id: savedId, status: 'complete' };
            }
        } catch (error) {
            console.error('Error saving file:', error);
            const fileIndex = this.files.findIndex(f => f.id === id);
            if (fileIndex !== -1) {
                this.files[fileIndex].status = 'error';
            }
        }

        this.renderFiles();
        this.updateStats();
    }

    updateFileProgress(id, progress) {
        const file = this.files.find(f => f.id === id);
        if (file) {
            file.progress = progress;
        }
        
        // Update DOM
        const progressBar = document.querySelector(`[data-file-id="${id}"] .progress-fill`);
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }

    async loadFiles() {
        try {
            this.files = await this.db.getFiles();
            this.renderFiles();
            this.updateStats();
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }

    async deleteFile(id) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await this.db.deleteFile(id);
            this.files = this.files.filter(f => f.id !== id);
            this.renderFiles();
            this.updateStats();
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Failed to delete file');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    renderFiles() {
        const container = document.getElementById('files-container');

        if (this.files.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">[Empty]</div>
                    <p>No files uploaded yet</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">PDFs you upload will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.files.map(file => {
            const statusClass = file.status || 'complete';
            let statusIcon = '[OK]';
            if (file.status === 'uploading') statusIcon = '[...]';
            if (file.status === 'error') statusIcon = '[X]';

            return `
                <div class="file-item ${statusClass}" data-file-id="${file.id}">
                    <div class="file-info">
                        <span class="file-icon">[PDF]</span>
                        <div class="file-details">
                            <div class="file-name">${file.name}</div>
                            <div class="file-meta">${this.formatFileSize(file.size)} • ${this.formatDate(file.date)}</div>
                        </div>
                    </div>
                    <div class="file-status">
                        ${file.status === 'uploading' ? `
                            <div class="progress-bar-small">
                                <div class="progress-fill" style="width: ${file.progress || 0}%"></div>
                            </div>
                        ` : ''}
                        <span class="status-icon">${statusIcon}</span>
                        ${file.status !== 'uploading' ? `
                            <button class="delete-btn" onclick="uploadManager.deleteFile(${file.id})" title="Delete">[Del]</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const totalFiles = this.files.length;
        const totalSize = this.files.reduce((sum, f) => sum + (f.size || 0), 0);
        const lastUpload = this.files[0]?.date;

        document.getElementById('total-files').textContent = totalFiles;
        document.getElementById('total-size').textContent = this.formatFileSize(totalSize);
        document.getElementById('upload-date').textContent = lastUpload ? this.formatDate(lastUpload) : '-';
    }
}

// Initialize
let uploadManager;

document.addEventListener('DOMContentLoaded', async () => {
    const db = new UploadDatabase();
    await db.init();
    uploadManager = new UploadManager(db);
    await uploadManager.init();
});
