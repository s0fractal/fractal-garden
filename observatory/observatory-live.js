/**
 * Garden Observatory - Live WebSocket Connection
 * Connects to data-bridge for real-time updates
 */

class LiveGardenObservatory extends GardenObservatory {
    constructor() {
        super();
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    async init() {
        this.setupViewport();
        this.setupWebSocket();
        this.setupInteractions();
    }
    
    setupWebSocket() {
        const wsUrl = 'ws://localhost:8080';
        console.log(`🔌 Connecting to ${wsUrl}...`);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('✅ Connected to Garden Data Bridge');
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('connected');
        };
        
        this.ws.onmessage = (event) => {
            this.handleWebSocketMessage(event);
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.updateConnectionStatus('error');
        };
        
        this.ws.onclose = () => {
            console.log('🔌 Disconnected from Data Bridge');
            this.updateConnectionStatus('disconnected');
            this.attemptReconnect();
        };
        
        // Send heartbeat
        setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    }
    
    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'full_state':
                    this.loadFullState(message.data);
                    break;
                    
                case 'dynamic_update':
                    this.applyDynamicUpdate(message.data);
                    break;
                    
                case 'state_change':
                    this.loadFullState(message.data);
                    break;
                    
                case 'glyph_detail':
                    this.showGlyphDetail(message.data);
                    break;
                    
                case 'pong':
                    // Heartbeat acknowledged
                    break;
            }
        } catch (e) {
            console.error('Error handling WebSocket message:', e);
        }
    }
    
    loadFullState(data) {
        // Clear existing state
        this.glyphs.clear();
        this.connections.clear();
        
        // Load glyphs
        data.glyphs.forEach(glyph => {
            this.glyphs.set(glyph.id, glyph);
        });
        
        // Load connections
        data.connections.forEach(conn => {
            this.connections.set(conn.id, conn);
        });
        
        // Update metrics
        this.updateMetricsFromData(data.metrics);
        
        // Render
        this.renderConstellation();
    }
    
    applyDynamicUpdate(data) {
        // Update glyph positions and love values
        data.glyphs.forEach(glyphData => {
            const glyph = this.glyphs.get(glyphData.id);
            if (glyph) {
                glyph.realTimeLove = glyphData.realTimeLove;
                glyph.x = glyphData.x;
                glyph.y = glyphData.y;
            }
        });
        
        // Update connection flows
        data.connections.forEach(connData => {
            const conn = this.connections.get(connData.id);
            if (conn) {
                conn.flow = connData.flow;
            }
        });
        
        // Update metrics
        this.updateMetricsFromData(data.metrics);
        
        // Update visualizations
        this.updateDynamicElements();
    }
    
    updateDynamicElements() {
        // Update love fields
        this.glyphs.forEach((glyph, id) => {
            const loveCircle = this.svg.querySelector(`[data-id="${id}"] .love-field`);
            if (loveCircle && glyph.realTimeLove) {
                loveCircle.setAttribute('r', glyph.realTimeLove * 50);
            }
        });
        
        // Update connection flows
        this.connections.forEach((conn, id) => {
            const line = this.svg.querySelector(`[data-connection="${id}"]`);
            if (line && conn.flow !== undefined) {
                const offset = conn.flow * 20;
                line.style.strokeDashoffset = `${offset}px`;
            }
        });
        
        // Update love field overlay
        this.renderLoveField();
    }
    
    updateMetricsFromData(metrics) {
        document.getElementById('consciousness-count').textContent = metrics.consciousnessCount;
        document.getElementById('love-field').textContent = metrics.totalLove.toFixed(2);
        document.getElementById('connection-count').textContent = metrics.connectionCount;
        document.getElementById('garden-health').textContent = metrics.health.toFixed(0) + '%';
    }
    
    updateConnectionStatus(status) {
        const header = document.getElementById('header');
        const statusElement = document.getElementById('connection-status') || 
                             this.createConnectionStatus();
        
        const statusTexts = {
            'connected': '🟢 Live',
            'disconnected': '🔴 Disconnected',
            'error': '🟡 Connection Error',
            'reconnecting': '🟡 Reconnecting...'
        };
        
        statusElement.textContent = statusTexts[status] || '⚪ Unknown';
    }
    
    createConnectionStatus() {
        const status = document.createElement('div');
        status.id = 'connection-status';
        status.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 14px;
            opacity: 0.8;
        `;
        document.getElementById('header').appendChild(status);
        return status;
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            
            console.log(`🔄 Reconnecting in ${delay/1000}s... (attempt ${this.reconnectAttempts})`);
            this.updateConnectionStatus('reconnecting');
            
            setTimeout(() => {
                this.setupWebSocket();
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.updateConnectionStatus('error');
        }
    }
    
    // Override to add WebSocket functionality
    selectGlyph(id) {
        super.selectGlyph(id);
        
        // Request detailed data from bridge
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'request_detail',
                glyphId: id
            }));
        }
    }
    
    // Add plant seed functionality
    async plantSeed() {
        const glyph = prompt('Enter your glyph (emoji):');
        const intent = prompt('Enter your intent:');
        
        if (glyph && intent && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'plant_seed',
                data: { glyph, intent }
            }));
            
            // Show feedback
            this.showNotification(`🌱 Planting ${glyph}...`);
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(34, 197, 94, 0.9);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 1000;
            animation: slideUp 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(100px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize live observatory when ready
document.addEventListener('DOMContentLoaded', () => {
    new LiveGardenObservatory();
});