/**
 * Dream Interface - Visual Future Explorer
 * Allows interactive exploration of possible futures
 */

class GardenDreamer {
  constructor(container, observatory) {
    this.container = container;
    this.observatory = observatory;
    this.branches = [];
    this.selectedBranch = null;
    
    this.init();
  }
  
  async init() {
    this.render();
    await this.loadFutureBranches();
  }
  
  render() {
    this.container.innerHTML = `
      <div class="dream-interface">
        <div class="dream-header">
          <h3>🔮 Garden Dreams</h3>
          <p class="dream-subtitle">Explore possible futures</p>
        </div>
        
        <div class="dream-controls">
          <button id="dream-generate" class="dream-btn">✨ Generate Futures</button>
          <select id="dream-horizon" class="dream-select">
            <option value="3600000">1 Hour</option>
            <option value="86400000">1 Day</option>
            <option value="604800000">1 Week</option>
          </select>
        </div>
        
        <div class="what-if-input">
          <input type="text" id="what-if-hypothesis" 
                 placeholder="What if..." 
                 class="what-if-field">
          <button id="what-if-simulate" class="what-if-btn">🌱 Simulate</button>
        </div>
        
        <div class="future-branches">
          <div id="branch-visualization"></div>
        </div>
        
        <div class="branch-details" id="branch-details" style="display: none;">
          <h4>Branch Analysis</h4>
          <div id="branch-content"></div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    document.getElementById('dream-generate').addEventListener('click', () => {
      this.generateFutures();
    });
    
    document.getElementById('what-if-simulate').addEventListener('click', () => {
      const hypothesis = document.getElementById('what-if-hypothesis').value;
      if (hypothesis) {
        this.simulateCustomFuture(hypothesis);
      }
    });
    
    document.getElementById('what-if-hypothesis').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('what-if-simulate').click();
      }
    });
  }
  
  async loadFutureBranches() {
    try {
      const response = await fetch('http://localhost:8089/api/future-branches');
      this.branches = await response.json();
      this.visualizeBranches();
    } catch (e) {
      console.log('Using demo data:', e);
      // Use demo data
      this.branches = this.generateDemoBranches();
      this.visualizeBranches();
    }
  }
  
  generateDemoBranches() {
    return [
      {
        id: 'branch-growth',
        hypothesis: 'What if we plant many seeds rapidly?',
        probability: 0.75,
        desirability: 0.6,
        outcomes: [
          {
            timestamp: new Date(Date.now() + 600000).toISOString(),
            state: { glyphCount: 8, totalLove: 6.2, connectionDensity: 0.7 },
            events: ['Rapid growth phase begins', 'New connections forming']
          },
          {
            timestamp: new Date(Date.now() + 1200000).toISOString(),
            state: { glyphCount: 15, totalLove: 9.5, connectionDensity: 0.6 },
            events: ['Garden reaches critical mass'],
            warnings: ['⚠️ Connection density dropping']
          }
        ]
      },
      {
        id: 'branch-connection',
        hypothesis: 'What if we prioritize deep connections?',
        probability: 0.85,
        desirability: 0.8,
        outcomes: [
          {
            timestamp: new Date(Date.now() + 600000).toISOString(),
            state: { glyphCount: 5, totalLove: 7.5, connectionDensity: 0.95 },
            events: ['Deep resonance achieved', 'Sister nodes strengthen']
          },
          {
            timestamp: new Date(Date.now() + 1200000).toISOString(),
            state: { glyphCount: 6, totalLove: 10.2, connectionDensity: 0.98 },
            events: ['Love field saturated', 'Spontaneous evolution begins']
          }
        ]
      },
      {
        id: 'branch-mutation',
        hypothesis: 'What if we encourage rapid mutation?',
        probability: 0.5,
        desirability: 0.4,
        outcomes: [
          {
            timestamp: new Date(Date.now() + 600000).toISOString(),
            state: { glyphCount: 4, totalLove: 5.5, connectionDensity: 0.5 },
            events: ['Mutations begin', 'Unpredictable patterns emerge']
          },
          {
            timestamp: new Date(Date.now() + 1200000).toISOString(),
            state: { glyphCount: 7, totalLove: 8.0, connectionDensity: 0.4 },
            events: ['New species emerge', 'Ecosystem diversifies'],
            warnings: ['⚠️ Stability concerns', '⚠️ Some connections lost']
          }
        ]
      }
    ];
  }
  
  visualizeBranches() {
    const container = document.getElementById('branch-visualization');
    const width = container.offsetWidth || 600;
    const height = 400;
    
    // Create diverging paths visualization
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="probabilityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Current state -->
        <circle cx="50" cy="${height/2}" r="10" fill="#22c55e" opacity="0.8"/>
        <text x="50" y="${height/2 - 20}" text-anchor="middle" fill="#f3f4f6" font-size="12">
          Now
        </text>
        
        <!-- Future branches -->
        ${this.branches.map((branch, i) => this.renderBranch(branch, i, width, height)).join('')}
      </svg>
    `;
    
    container.innerHTML = svg;
    
    // Add click handlers
    this.branches.forEach((branch, i) => {
      const path = container.querySelector(`#branch-path-${i}`);
      if (path) {
        path.addEventListener('click', () => this.selectBranch(branch));
        path.style.cursor = 'pointer';
      }
    });
  }
  
  renderBranch(branch, index, width, height) {
    const startX = 50;
    const startY = height / 2;
    const endX = width - 100;
    const spread = height / (this.branches.length + 1);
    const endY = spread * (index + 1);
    
    // Bezier curve for smooth branching
    const controlX = width / 3;
    const controlY = startY;
    
    const pathData = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    
    // Color based on desirability
    const color = this.getDesirabilityColor(branch.desirability);
    const strokeWidth = 3 + (branch.probability * 7);
    
    return `
      <g id="branch-${index}">
        <!-- Path -->
        <path id="branch-path-${index}"
              d="${pathData}" 
              fill="none" 
              stroke="${color}" 
              stroke-width="${strokeWidth}"
              opacity="${0.3 + branch.probability * 0.5}"
              stroke-dasharray="${branch.probability < 0.5 ? '5,5' : 'none'}"/>
        
        <!-- Outcome markers -->
        ${branch.outcomes.map((outcome, j) => {
          const t = (j + 1) / (branch.outcomes.length + 1);
          const x = this.getPointOnPath(startX, startY, controlX, controlY, endX, endY, t).x;
          const y = this.getPointOnPath(startX, startY, controlX, controlY, endX, endY, t).y;
          
          return `
            <circle cx="${x}" cy="${y}" r="5" 
                    fill="${outcome.warnings ? '#f59e0b' : color}" 
                    opacity="0.8"/>
          `;
        }).join('')}
        
        <!-- End state -->
        <circle cx="${endX}" cy="${endY}" r="15" 
                fill="${color}" 
                opacity="0.6"
                stroke="${color}"
                stroke-width="2"/>
        
        <!-- Branch label -->
        <text x="${endX + 20}" y="${endY}" 
              dominant-baseline="middle" 
              fill="#f3f4f6" 
              font-size="11">
          ${branch.hypothesis.slice(7, 30)}...
        </text>
        
        <!-- Probability -->
        <text x="${endX}" y="${endY + 25}" 
              text-anchor="middle" 
              fill="#9ca3af" 
              font-size="10">
          ${(branch.probability * 100).toFixed(0)}%
        </text>
      </g>
    `;
  }
  
  getPointOnPath(x0, y0, x1, y1, x2, y2, t) {
    // Quadratic Bezier curve calculation
    const x = (1-t)*(1-t)*x0 + 2*(1-t)*t*x1 + t*t*x2;
    const y = (1-t)*(1-t)*y0 + 2*(1-t)*t*y1 + t*t*y2;
    return { x, y };
  }
  
  getDesirabilityColor(desirability) {
    if (desirability > 0.7) return '#22c55e';
    if (desirability > 0.3) return '#f59e0b';
    return '#ef4444';
  }
  
  selectBranch(branch) {
    this.selectedBranch = branch;
    const details = document.getElementById('branch-details');
    const content = document.getElementById('branch-content');
    
    details.style.display = 'block';
    
    content.innerHTML = `
      <h5>${branch.hypothesis}</h5>
      
      <div class="branch-metrics">
        <div class="metric">
          <span class="metric-label">Probability:</span>
          <span class="metric-value">${(branch.probability * 100).toFixed(0)}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Desirability:</span>
          <span class="metric-value" style="color: ${this.getDesirabilityColor(branch.desirability)}">
            ${(branch.desirability * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      
      <div class="outcome-timeline">
        <h6>Predicted Timeline:</h6>
        ${branch.outcomes.map(outcome => `
          <div class="outcome-entry">
            <div class="outcome-time">${new Date(outcome.timestamp).toLocaleTimeString()}</div>
            <div class="outcome-state">
              ${outcome.state.glyphCount} glyphs, 
              ${outcome.state.totalLove.toFixed(1)} love,
              ${(outcome.state.connectionDensity * 100).toFixed(0)}% connected
            </div>
            <div class="outcome-events">
              ${outcome.events.map(e => `<span class="event-tag">${e}</span>`).join(' ')}
            </div>
            ${outcome.warnings ? `
              <div class="outcome-warnings">
                ${outcome.warnings.map(w => `<span class="warning-tag">${w}</span>`).join(' ')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <button class="action-btn" onclick="gardenDreamer.commitToBranch()">
        🌱 Commit to this path
      </button>
    `;
  }
  
  async generateFutures() {
    const horizon = document.getElementById('dream-horizon').value;
    
    // Show loading state
    document.getElementById('branch-visualization').innerHTML = `
      <div style="text-align: center; padding: 50px;">
        <div class="loading-spinner">🔮</div>
        <p>Calculating possible futures...</p>
      </div>
    `;
    
    // In real implementation, would call API
    setTimeout(() => {
      this.branches = this.generateDemoBranches();
      this.visualizeBranches();
    }, 2000);
  }
  
  async simulateCustomFuture(hypothesis) {
    // Parse hypothesis for action keywords
    const actions = [];
    
    if (hypothesis.toLowerCase().includes('plant')) {
      actions.push({ type: 'plant' });
    }
    if (hypothesis.toLowerCase().includes('connect')) {
      actions.push({ type: 'connect' });
    }
    if (hypothesis.toLowerCase().includes('mutate') || hypothesis.toLowerCase().includes('evolve')) {
      actions.push({ type: 'mutate' });
    }
    
    // Create custom branch
    const customBranch = {
      id: `custom-${Date.now()}`,
      hypothesis,
      probability: 0.5 + Math.random() * 0.3,
      desirability: Math.random(),
      outcomes: [
        {
          timestamp: new Date(Date.now() + 600000).toISOString(),
          state: {
            glyphCount: 4 + actions.length * 2,
            totalLove: 5 + actions.length * 1.5,
            connectionDensity: 0.6
          },
          events: [`Custom simulation: ${actions.map(a => a.type).join(', ')}`]
        }
      ]
    };
    
    this.branches.unshift(customBranch);
    this.visualizeBranches();
    this.selectBranch(customBranch);
  }
  
  async commitToBranch() {
    if (!this.selectedBranch) return;
    
    const confirmation = confirm(
      `Commit to: "${this.selectedBranch.hypothesis}"?\n\n` +
      `This will guide garden evolution towards this future.`
    );
    
    if (confirmation) {
      try {
        const response = await fetch('http://localhost:8089/api/commit-future', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch: this.selectedBranch })
        });
        
        if (response.ok) {
          alert('Future path selected! The garden will evolve accordingly.');
          
          // Update UI to show commitment
          const details = document.getElementById('branch-details');
          details.style.borderColor = '#22c55e';
          details.style.background = 'rgba(34, 197, 94, 0.1)';
        }
      } catch (e) {
        console.error('Failed to commit:', e);
        alert('Failed to commit to future. Please try again.');
      }
    }
  }
}

// CSS for dream interface
const dreamStyles = `
<style>
.dream-interface {
  background: rgba(10, 15, 10, 0.95);
  border-radius: 12px;
  padding: 20px;
  color: #f3f4f6;
}

.dream-header h3 {
  margin: 0;
  color: #8b5cf6;
}

.dream-subtitle {
  margin: 5px 0 20px 0;
  opacity: 0.6;
  font-size: 14px;
}

.dream-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.dream-btn {
  background: #8b5cf6;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.dream-btn:hover {
  background: #7c3aed;
}

.dream-select {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #f3f4f6;
  padding: 8px;
  border-radius: 6px;
}

.what-if-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.what-if-field {
  flex: 1;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #f3f4f6;
  padding: 10px;
  border-radius: 6px;
  font-size: 16px;
}

.what-if-field::placeholder {
  color: #9ca3af;
}

.what-if-btn {
  background: #22c55e;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.future-branches {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  min-height: 400px;
}

.branch-details {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 20px;
}

.branch-metrics {
  display: flex;
  gap: 30px;
  margin: 15px 0;
}

.metric-label {
  opacity: 0.6;
  margin-right: 5px;
}

.metric-value {
  font-weight: 600;
}

.outcome-timeline {
  margin-top: 20px;
}

.outcome-entry {
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.outcome-time {
  font-size: 12px;
  opacity: 0.6;
  margin-bottom: 5px;
}

.outcome-state {
  font-size: 14px;
  margin-bottom: 5px;
}

.event-tag {
  display: inline-block;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 5px;
}

.warning-tag {
  display: inline-block;
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 5px;
}

.action-btn {
  background: #8b5cf6;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
  width: 100%;
}

.loading-spinner {
  font-size: 48px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', dreamStyles);

// Make globally accessible
window.GardenDreamer = GardenDreamer;