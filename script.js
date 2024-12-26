document.addEventListener('DOMContentLoaded', () => {
    const addNoteButton = document.getElementById('add-note');
    const noteTitleInput = document.getElementById('note-title');
    const noteCategorySelect = document.getElementById('note-category');
    const notesList = document.getElementById('notes-list');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const exportNotesButton = document.getElementById('export-notes');
    const importNotesInput = document.getElementById('import-notes');

    let quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Escreva sua nota aqui...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Carregar notas salvas
    loadNotes();

    // Carregar preferência de tema
    if (localStorage.getItem('dark-mode') === 'true') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Adicionar nota
    addNoteButton.addEventListener('click', () => {
        const title = noteTitleInput.value.trim();
        const content = quill.root.innerHTML;
        const category = noteCategorySelect.value;

        if (title && content) {
            addNote({
                title,
                content,
                category,
                checklist: false
            });
            noteTitleInput.value = '';
            quill.root.innerHTML = '';
            noteCategorySelect.value = '';
            saveNotes();
        }
    });

    // Alternar tema
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', isDarkMode);
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    // Pesquisar notas
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const notes = document.querySelectorAll('.note');
        notes.forEach(note => {
            const title = note.querySelector('h3').textContent.toLowerCase();
            const content = note.querySelector('.note-content').textContent.toLowerCase();
            const isVisible = title.includes(searchTerm) || content.includes(searchTerm);
            note.style.display = isVisible ? 'block' : 'none';
        });
    });

    // Função para adicionar uma nova nota
    function addNote({ title, content, category, checklist }) {
        const noteDiv = document.createElement('div');
        noteDiv.classList.add('note');
        noteDiv.innerHTML = `
            <h3>${title}</h3>
            ${category ? `<span class="note-category">${category}</span>` : ''}
            <div class="note-content">${content}</div>
            <button class="edit-note"><i class="fas fa-edit"></i> Editar</button>
            <button class="delete-note"><i class="fas fa-trash"></i> Excluir</button>
            <button class="toggle-checklist"><i class="fas fa-check-square"></i> ${checklist ? 'Desativar Checklist' : 'Ativar Checklist'}</button>
        `;

        // Adicionar evento para editar a nota
        noteDiv.querySelector('.edit-note').addEventListener('click', () => {
            noteTitleInput.value = title;
            quill.root.innerHTML = content;
            noteCategorySelect.value = category;
            noteDiv.remove();
            saveNotes();
        });

        // Adicionar evento para excluir a nota
        noteDiv.querySelector('.delete-note').addEventListener('click', () => {
            noteDiv.classList.add('fade-out');
            setTimeout(() => {
                noteDiv.remove();
                saveNotes();
            }, 300);
        });

        // Adicionar evento para alternar checklist
        noteDiv.querySelector('.toggle-checklist').addEventListener('click', () => {
            checklist = !checklist;
            noteDiv.querySelector('.toggle-checklist').innerHTML = `<i class="fas fa-check-square"></i> ${checklist ? 'Desativar Checklist' : 'Ativar Checklist'}`;
            if (checklist) {
                quill.format('list', 'checked');
            } else {
                quill.format('list', false);
            }
            saveNotes();
        });

        notesList.appendChild(noteDiv);
        setTimeout(() => noteDiv.style.opacity = '1', 10);
    }

    // Função para salvar notas no localStorage
    function saveNotes() {
        const notes = [];
        document.querySelectorAll('.note').forEach(noteElement => {
            const title = noteElement.querySelector('h3').textContent;
            const content = noteElement.querySelector('.note-content').innerHTML;
            const category = noteElement.querySelector('.note-category')?.textContent || '';
            const checklist = noteElement.querySelector('.toggle-checklist').textContent.includes('Desativar Checklist');
            notes.push({ title, content, category, checklist });
        });
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    // Função para carregar notas do localStorage
    function loadNotes() {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes.forEach(note => addNote(note));
    }

    // Função para exportar notas como JSON
    exportNotesButton.addEventListener('click', () => {
        const notes = JSON.parse(localStorage.getItem('notes')) || [];
        const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Função para importar notas de um arquivo JSON
    importNotesInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const notes = JSON.parse(e.target.result);
                localStorage.setItem('notes', JSON.stringify(notes));
                loadNotes();
            };
            reader.readAsText(file);
        }
    });

    // Função para marcar nota como importante
    function markAsImportant(noteElement) {
        noteElement.classList.toggle('important');
        saveNotes();
    }

    // Função para ordenar notas por título
    function sortNotesByTitle() {
        const notes = Array.from(document.querySelectorAll('.note'));
        notes.sort((a, b) => a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));
        notesList.innerHTML = '';
        notes.forEach(note => notesList.appendChild(note));
    }

    // Função para adicionar tags às notas
    function addTag(noteElement, tag) {
        const tagsContainer = noteElement.querySelector('.tags');
        if (!tagsContainer) {
            const newTagsContainer = document.createElement('div');
            newTagsContainer.classList.add('tags');
            noteElement.appendChild(newTagsContainer);
        }
        const tagElement = document.createElement('span');
        tagElement.classList.add('tag');
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
        saveNotes();
    }

    // Função para proteger nota com senha
    function protectNoteWithPassword(noteElement, password) {
        noteElement.dataset.password = password;
        saveNotes();
    }

    // Função para manter histórico de edições
    function addEditHistory(noteElement, edit) {
        const historyContainer = noteElement.querySelector('.history');
        if (!historyContainer) {
            const newHistoryContainer = document.createElement('div');
            newHistoryContainer.classList.add('history');
            noteElement.appendChild(newHistoryContainer);
        }
        const editElement = document.createElement('div');
        editElement.classList.add('edit');
        editElement.textContent = edit;
        historyContainer.appendChild(editElement);
        saveNotes();
    }

    // Função para adicionar notificações
    function addNotification(message) {
        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Função para adicionar lembretes
    function addReminder(noteElement, reminderTime) {
        const reminder = new Date(reminderTime);
        const now = new Date();
        const timeUntilReminder = reminder - now;
        if (timeUntilReminder > 0) {
            setTimeout(() => {
                addNotification(`Lembrete: ${noteElement.querySelector('h3').textContent}`);
            }, timeUntilReminder);
        }
    }
});