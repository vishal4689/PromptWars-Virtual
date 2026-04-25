window.escapeHTML = (str) => {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
};

window.parseMarkdown = (text) => {
    // SECURITY: Sanitize input first to prevent XSS
    let html = window.escapeHTML(text);
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Code blocks
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Bullet points (simple)
    html = html.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/g, ''); // merge lists
    
    // Newlines to br
    html = html.replace(/\n/g, '<br>');
    
    return html;
};

window.showSection = (sectionId) => {
    document.querySelectorAll('.glass-panel').forEach(panel => {
        panel.classList.remove('active');
        setTimeout(() => {
            if(!panel.classList.contains('active')) {
                panel.classList.add('hidden');
            }
        }, 500); 
    });

    const target = document.getElementById(sectionId);
    target.classList.remove('hidden');
    setTimeout(() => {
        target.classList.add('active');
    }, 50);
};

window.appendMessage = (containerId, text, role) => {
    const container = document.getElementById(containerId);
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    if (role === 'bot') {
        msgDiv.innerHTML = window.parseMarkdown(text);
    } else {
        msgDiv.textContent = text; 
    }
    
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
};

window.showTypingIndicator = (containerId) => {
    const container = document.getElementById(containerId);
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
};

window.removeTypingIndicator = () => {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
};
