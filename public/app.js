// ==========================================
// APP.JS - Lógica do Painel de Controle
// ==========================================

class DashboardApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.history = [];
        this.stats = {
            messagesReceived: 0,
            messagesSent: 0,
            errors: 0,
            avgTime: 0,
        };
        this.config = {
            aiModel: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 500,
            customPrompt: '',
        };
        this.autoScroll = true;

        this.initializeEventListeners();
        this.loadInitialData();
        this.startAutoRefresh();
    }

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    initializeEventListeners() {
        // Navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // Botão de refresh
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshDashboard();
        });

        // Formulário de envio
        document.getElementById('send-form').addEventListener('submit', (e) => {
            this.handleSendMessage(e);
        });

        // Mudança de tipo de mensagem
        document.getElementById('message-type').addEventListener('change', (e) => {
            this.updateFormFields(e.target.value);
        });

        // Configurações
        document.getElementById('ai-temp').addEventListener('input', (e) => {
            document.getElementById('temp-value').textContent = e.target.value;
        });

        document.getElementById('save-config-btn').addEventListener('click', () => {
            this.saveConfiguration();
        });

        // Logs
        document.getElementById('clear-logs-btn').addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('toggle-auto-scroll-btn').addEventListener('click', (e) => {
            this.autoScroll = !this.autoScroll;
            e.target.textContent = this.autoScroll ? 'Auto Scroll ON' : 'Auto Scroll OFF';
            e.target.classList.toggle('active');
        });

        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // Filtros de histórico
        document.getElementById('search-phone').addEventListener('input', () => {
            this.filterHistory();
        });

        document.getElementById('filter-type').addEventListener('change', () => {
            this.filterHistory();
        });
    }

    loadInitialData() {
        this.loadStats();
        this.loadHistory();
        this.loadConfiguration();
        this.checkServerStatus();
        this.fetchLogs();
    }

    // ==========================================
    // NAVEGAÇÃO
    // ==========================================

    navigateTo(page) {
        // Atualizar página ativa
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');

        // Atualizar nav-link ativo
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Atualizar título da página
        const titles = {
            dashboard: 'Dashboard',
            enviar: 'Enviar Mensagem',
            historico: 'Histórico de Mensagens',
            logs: 'Logs do Sistema',
            config: 'Configurações',
        };
        document.getElementById('page-title').textContent = titles[page];

        this.currentPage = page;
    }

    // ==========================================
    // DASHBOARD
    // ==========================================

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();

            this.stats = data;
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            this.showNotification('Erro ao carregar estatísticas', 'error');
        }
    }

    updateStatsDisplay() {
        document.getElementById('msgs-received').textContent = this.stats.messagesReceived;
        document.getElementById('msgs-sent').textContent = this.stats.messagesSent;
        document.getElementById('avg-time').textContent = (this.stats.avgTime / 1000).toFixed(2) + 's';
        document.getElementById('errors').textContent = this.stats.errors;
    }

    async checkServerStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();

            if (data.status === 'online') {
                this.updateStatusBadges('success');
            }
        } catch (error) {
            this.updateStatusBadges('error');
        }
    }

    updateStatusBadges(status) {
        const badges = document.querySelectorAll('[id$="-status"]');
        const badgeClass = status === 'success' ? 'badge-success' : 'badge-danger';
        const prevClass = status === 'success' ? 'badge-danger' : 'badge-success';

        badges.forEach(badge => {
            badge.classList.remove(prevClass);
            badge.classList.add(badgeClass);
            badge.textContent = status === 'success' ? 'Conectado' : 'Erro';
        });
    }

    refreshDashboard() {
        document.getElementById('refresh-btn').style.transform = 'rotate(360deg)';
        this.loadStats();
        this.checkServerStatus();
        setTimeout(() => {
            document.getElementById('refresh-btn').style.transform = 'rotate(0deg)';
        }, 1000);
    }

    // ==========================================
    // ENVIAR MENSAGEM
    // ==========================================

    updateFormFields(type) {
        const textGroup = document.getElementById('text-group');
        const docGroup = document.getElementById('doc-group');

        if (type === 'document') {
            textGroup.style.display = 'none';
            docGroup.style.display = 'block';
        } else {
            textGroup.style.display = 'block';
            docGroup.style.display = 'none';
        }
    }

    async handleSendMessage(e) {
        e.preventDefault();

        const phone = document.getElementById('phone').value;
        const type = document.getElementById('message-type').value;
        const text = document.getElementById('message-text').value;
        const docUrl = document.getElementById('doc-url').value;
        const docName = document.getElementById('doc-name').value;

        if (!phone) {
            this.showNotification('Preencha o número de WhatsApp', 'error');
            return;
        }

        const resultDiv = document.getElementById('send-result');
        resultDiv.style.display = 'block';
        resultDiv.className = 'result-message';
        resultDiv.textContent = '⏳ Enviando...';

        try {
            let response;

            if (type === 'document') {
                response = await fetch('/api/send-document', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone,
                        docUrl,
                        docName: docName || 'documento.pdf',
                    }),
                });
            } else {
                response = await fetch('/api/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone,
                        type,
                        text,
                    }),
                });
            }

            const data = await response.json();

            if (response.ok) {
                resultDiv.classList.add('success');
                resultDiv.textContent = `✅ ${data.message || 'Mensagem enviada com sucesso!'}`;
                this.addLog('[INFO]', `Mensagem enviada para ${phone}`);
                e.target.reset();
                setTimeout(() => {
                    resultDiv.style.display = 'none';
                }, 5000);
            } else {
                resultDiv.classList.add('error');
                resultDiv.textContent = `❌ Erro: ${data.error || 'Falha ao enviar'}`;
                this.addLog('[ERROR]', `Erro ao enviar para ${phone}: ${data.error}`);
            }
        } catch (error) {
            resultDiv.classList.add('error');
            resultDiv.textContent = '❌ Erro de conexão com o servidor';
            console.error('Erro:', error);
        }
    }

    // ==========================================
    // HISTÓRICO
    // ==========================================

    async loadHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();

            this.history = data;
            this.displayHistory(data);
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            this.displayHistory([]);
        }
    }

    displayHistory(items) {
        const tbody = document.getElementById('history-body');

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma mensagem encontrada</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.phone || 'N/A'}</td>
                <td>${item.message.substring(0, 50)}${item.message.length > 50 ? '...' : ''}</td>
                <td><span class="badge badge-success">${item.type}</span></td>
                <td>${new Date(item.timestamp).toLocaleString('pt-BR')}</td>
                <td><span class="badge badge-success">${item.status}</span></td>
            </tr>
        `).join('');
    }

    filterHistory() {
        const phone = document.getElementById('search-phone').value.toLowerCase();
        const type = document.getElementById('filter-type').value;

        const filtered = this.history.filter(item => {
            const phoneMatch = !phone || (item.phone && item.phone.includes(phone));
            const typeMatch = !type || item.type === type;
            return phoneMatch && typeMatch;
        });

        this.displayHistory(filtered);
    }

    // ==========================================
    // LOGS
    // ==========================================

    addLog(type, message) {
        const container = document.getElementById('logs-container');
        const now = new Date().toLocaleTimeString('pt-BR');

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">${now}</span>
            <span class="log-type ${this.getLogTypeClass(type)}">${type}</span>
            <span class="log-message">${message}</span>
        `;

        container.appendChild(entry);

        if (this.autoScroll) {
            container.scrollTop = container.scrollHeight;
        }

        // Manter máximo de 100 linhas
        while (container.children.length > 100) {
            container.removeChild(container.firstChild);
        }
    }

    getLogTypeClass(type) {
        if (type.includes('ERROR')) return 'error';
        if (type.includes('WARN')) return 'warn';
        if (type.includes('SUCCESS')) return 'success';
        return 'info';
    }

    async fetchLogs() {
        try {
            const response = await fetch('/api/logs');
            const data = await response.json();

            // Limpar logs anteriores
            document.getElementById('logs-container').innerHTML = '';

            data.forEach(log => {
                this.addLog(log.type, log.message);
            });
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        }
    }

    clearLogs() {
        if (confirm('Tem certeza que deseja limpar todos os logs?')) {
            document.getElementById('logs-container').innerHTML = '';
            this.addLog('[INFO]', 'Logs limpos');
        }
    }

    // ==========================================
    // CONFIGURAÇÕES
    // ==========================================

    async loadConfiguration() {
        try {
            const response = await fetch('/api/config');
            const data = await response.json();

            this.config = data;
            this.displayConfiguration();
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    displayConfiguration() {
        document.getElementById('ai-model').value = this.config.aiModel;
        document.getElementById('ai-temp').value = this.config.temperature;
        document.getElementById('temp-value').textContent = this.config.temperature;
        document.getElementById('ai-tokens').value = this.config.maxTokens;
        document.getElementById('ai-prompt').value = this.config.customPrompt || '';

        // Informações do servidor
        this.displayServerInfo();
    }

    displayServerInfo() {
        const uptime = Math.floor(process.uptime ? process.uptime() : 0);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);

        document.getElementById('node-version').textContent = 'v16.0.0+';
        document.getElementById('uptime').textContent = `${hours}h ${minutes}m`;
        document.getElementById('memory').textContent = '~50MB';
    }

    async saveConfiguration() {
        const config = {
            aiModel: document.getElementById('ai-model').value,
            temperature: parseFloat(document.getElementById('ai-temp').value),
            maxTokens: parseInt(document.getElementById('ai-tokens').value),
            customPrompt: document.getElementById('ai-prompt').value,
        };

        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (response.ok) {
                this.config = config;
                this.showNotification('Configurações salvas com sucesso!', 'success');
                this.addLog('[SUCCESS]', 'Configurações atualizadas');
            } else {
                this.showNotification('Erro ao salvar configurações', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            this.showNotification('Erro ao salvar configurações', 'error');
        }
    }

    // ==========================================
    // UTILITÁRIOS
    // ==========================================

    showNotification(message, type = 'info') {
        // Pode ser implementado com toastr, sweetalert, ou notificação simples
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(message);
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    startAutoRefresh() {
        setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.loadStats();
            } else if (this.currentPage === 'historico') {
                this.loadHistory();
            }
        }, 30000); // A cada 30 segundos
    }
}

// ==========================================
// INICIALIZAR APP
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DashboardApp();
    console.log('Dashboard inicializado com sucesso!');
});
