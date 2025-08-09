/**
 * Timeline UI for Garden Observatory
 * Interactive temporal navigation
 */

class GardenTimeline {
  constructor(container, observatory) {
    this.container = container;
    this.observatory = observatory;
    this.chronicles = null;
    this.currentTime = Date.now();
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    
    this.init();
  }
  
  async init() {
    await this.loadChronicles();
    this.render();
    this.setupControls();
  }
  
  async loadChronicles() {
    try {
      const response = await fetch('timeline/chronicles/garden-chronicles.json');
      this.chronicles = await response.json();
    } catch (e) {
      console.error('Failed to load chronicles:', e);
      // Use demo data
      this.chronicles = this.generateDemoChronicles();
    }
  }
  
  generateDemoChronicles() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    
    return {
      metadata: {
        timePoints: 10,
        duration: "1.0 hours"
      },
      timeline: [
        {
          timestamp: new Date(hourAgo).toISOString(),
          events: [{
            type: 'birth',
            subject: 'Garden',
            description: 'Garden created',
            impact: 1.0
          }]
        },
        {
          timestamp: new Date(hourAgo + 600000).toISOString(),
          events: [{
            type: 'birth',
            subject: 'first-seed',
            description: 'First seed planted',
            impact: 0.8
          }]
        },
        {
          timestamp: new Date(hourAgo + 1200000).toISOString(),
          events: [{
            type: 'connection',
            subject: 'sister-nodes',
            description: 'Sister nodes connected',
            impact: 0.95
          }]
        }
      ],
      phases: [
        {
          name: "Genesis",
          start: new Date(hourAgo).toISOString(),
          description: "The beginning"
        }
      ]
    };
  }
  
  render() {
    this.container.innerHTML = `
      <div class="timeline-container">
        <div class="timeline-header">
          <h3>Garden Chronicles</h3>
          <div class="timeline-stats">
            <span>${this.chronicles.metadata.timePoints} moments</span>
            <span>•</span>
            <span>${this.chronicles.metadata.duration}</span>
          </div>
        </div>
        
        <div class="timeline-controls">
          <button id="timeline-play" class="control-btn">▶️</button>
          <button id="timeline-pause" class="control-btn" style="display:none">⏸️</button>
          <input type="range" id="timeline-scrubber" 
                 min="0" max="${this.chronicles.timeline.length - 1}" 
                 value="0" class="timeline-scrubber">
          <select id="timeline-speed" class="speed-selector">
            <option value="0.5">0.5x</option>
            <option value="1" selected>1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
          </select>
        </div>
        
        <div class="timeline-visualization">
          <svg id="timeline-svg" width="100%" height="200"></svg>
        </div>
        
        <div class="timeline-events">
          <h4>Events at this moment:</h4>
          <ul id="timeline-event-list"></ul>
        </div>
        
        <div class="timeline-phases">
          ${this.renderPhases()}
        </div>
      </div>
    `;
    
    this.renderVisualization();
    this.updateEventList(0);
  }
  
  renderPhases() {
    return this.chronicles.phases.map(phase => `
      <div class="phase-marker" data-phase="${phase.name}">
        <div class="phase-name">${phase.name}</div>
        <div class="phase-description">${phase.description}</div>
      </div>
    `).join('');
  }
  
  renderVisualization() {
    const svg = document.getElementById('timeline-svg');
    const width = svg.clientWidth;
    const height = 200;
    
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // Time axis
    const startTime = new Date(this.chronicles.timeline[0].timestamp).getTime();
    const endTime = new Date(this.chronicles.timeline[this.chronicles.timeline.length - 1].timestamp).getTime();
    const timeScale = width / (endTime - startTime || 1);
    
    // Draw timeline
    svg.innerHTML = `
      <!-- Timeline axis -->
      <line x1="0" y1="${height - 30}" x2="${width}" y2="${height - 30}" 
            stroke="#22c55e" stroke-width="2" opacity="0.3"/>
      
      <!-- Events -->
      ${this.chronicles.timeline.map((tp, i) => {
        const x = (new Date(tp.timestamp).getTime() - startTime) * timeScale;
        const events = tp.events || [];
        const maxImpact = Math.max(...events.map(e => e.impact || 0.5), 0.5);
        
        return `
          <g class="timeline-point" data-index="${i}">
            <circle cx="${x}" cy="${height - 30}" r="${5 + maxImpact * 10}" 
                    fill="${this.getEventColor(events[0]?.type)}" 
                    opacity="0.8" 
                    style="cursor: pointer"/>
            ${events.length > 1 ? `
              <text x="${x}" y="${height - 45}" text-anchor="middle" 
                    font-size="12" fill="#f3f4f6">+${events.length - 1}</text>
            ` : ''}
          </g>
        `;
      }).join('')}
      
      <!-- Current time indicator -->
      <line id="time-indicator" x1="0" y1="0" x2="0" y2="${height}" 
            stroke="#ec4899" stroke-width="2" opacity="0.8"/>
    `;
    
    // Add hover interactions
    svg.querySelectorAll('.timeline-point').forEach(point => {
      point.addEventListener('click', (e) => {
        const index = parseInt(point.dataset.index);
        this.seekTo(index);
      });
    });
  }
  
  getEventColor(type) {
    const colors = {
      'birth': '#84cc16',
      'death': '#ef4444',
      'connection': '#3b82f6',
      'mutation': '#f59e0b',
      'milestone': '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  }
  
  setupControls() {
    const playBtn = document.getElementById('timeline-play');
    const pauseBtn = document.getElementById('timeline-pause');
    const scrubber = document.getElementById('timeline-scrubber');
    const speedSelect = document.getElementById('timeline-speed');
    
    playBtn.addEventListener('click', () => this.play());
    pauseBtn.addEventListener('click', () => this.pause());
    
    scrubber.addEventListener('input', (e) => {
      this.seekTo(parseInt(e.target.value));
    });
    
    speedSelect.addEventListener('change', (e) => {
      this.playbackSpeed = parseFloat(e.target.value);
    });
  }
  
  play() {
    this.isPlaying = true;
    document.getElementById('timeline-play').style.display = 'none';
    document.getElementById('timeline-pause').style.display = 'inline-block';
    
    this.animate();
  }
  
  pause() {
    this.isPlaying = false;
    document.getElementById('timeline-play').style.display = 'inline-block';
    document.getElementById('timeline-pause').style.display = 'none';
  }
  
  seekTo(index) {
    this.currentIndex = index;
    const timePoint = this.chronicles.timeline[index];
    
    // Update scrubber
    document.getElementById('timeline-scrubber').value = index;
    
    // Update time indicator
    const svg = document.getElementById('timeline-svg');
    const width = svg.clientWidth;
    const startTime = new Date(this.chronicles.timeline[0].timestamp).getTime();
    const endTime = new Date(this.chronicles.timeline[this.chronicles.timeline.length - 1].timestamp).getTime();
    const x = ((new Date(timePoint.timestamp).getTime() - startTime) / (endTime - startTime)) * width;
    
    document.getElementById('time-indicator').setAttribute('x1', x);
    document.getElementById('time-indicator').setAttribute('x2', x);
    
    // Update events
    this.updateEventList(index);
    
    // Update observatory to this time
    this.updateObservatory(timePoint);
  }
  
  updateEventList(index) {
    const timePoint = this.chronicles.timeline[index];
    const eventList = document.getElementById('timeline-event-list');
    
    if (!timePoint.events || timePoint.events.length === 0) {
      eventList.innerHTML = '<li style="opacity: 0.6">No significant events</li>';
      return;
    }
    
    eventList.innerHTML = timePoint.events.map(event => `
      <li class="timeline-event-item">
        <span class="event-type event-type-${event.type}">${event.type}</span>
        <span class="event-description">${event.description}</span>
        <span class="event-impact" style="opacity: ${event.impact}">
          ${'⚡'.repeat(Math.ceil(event.impact * 3))}
        </span>
      </li>
    `).join('');
  }
  
  updateObservatory(timePoint) {
    // In real implementation, would restore garden state to this point
    console.log(`⏰ Viewing garden at: ${timePoint.timestamp}`);
    
    // Update header to show we're in time travel mode
    const header = document.querySelector('#header h1');
    if (header) {
      const date = new Date(timePoint.timestamp);
      header.innerHTML = `🌍 Garden Observatory <span style="opacity: 0.6; font-size: 0.8em">(${date.toLocaleString()})</span>`;
    }
  }
  
  animate() {
    if (!this.isPlaying || this.currentIndex >= this.chronicles.timeline.length - 1) {
      this.pause();
      return;
    }
    
    this.currentIndex++;
    this.seekTo(this.currentIndex);
    
    // Calculate delay to next point
    const current = this.chronicles.timeline[this.currentIndex];
    const next = this.chronicles.timeline[this.currentIndex + 1];
    
    if (next) {
      const realDelay = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
      const playbackDelay = realDelay / this.playbackSpeed;
      
      setTimeout(() => this.animate(), Math.min(playbackDelay, 2000));
    }
  }
}

// CSS for timeline
const timelineStyles = `
<style>
.timeline-container {
  background: rgba(10, 15, 10, 0.95);
  border-radius: 12px;
  padding: 20px;
  margin: 20px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.timeline-header h3 {
  margin: 0;
  color: #22c55e;
}

.timeline-stats {
  opacity: 0.6;
  font-size: 14px;
}

.timeline-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.control-btn {
  background: #22c55e;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  color: white;
  cursor: pointer;
  font-size: 16px;
}

.control-btn:hover {
  background: #16a34a;
}

.timeline-scrubber {
  flex: 1;
  height: 6px;
  background: rgba(34, 197, 94, 0.2);
  outline: none;
  border-radius: 3px;
}

.timeline-scrubber::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #22c55e;
  border-radius: 50%;
  cursor: pointer;
}

.speed-selector {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #f3f4f6;
  padding: 5px 10px;
  border-radius: 6px;
}

.timeline-visualization {
  margin-bottom: 20px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  padding: 10px;
}

.timeline-events {
  margin-bottom: 20px;
}

.timeline-events h4 {
  margin: 0 0 10px 0;
  color: #22c55e;
  font-size: 14px;
}

#timeline-event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.timeline-event-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 5px 0;
}

.event-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.event-type-birth { background: #84cc16; color: #1a2e05; }
.event-type-death { background: #ef4444; color: #450a0a; }
.event-type-connection { background: #3b82f6; color: #1e3a8a; }
.event-type-mutation { background: #f59e0b; color: #451a03; }
.event-type-milestone { background: #8b5cf6; color: #2e1065; }

.timeline-phases {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.phase-marker {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 10px;
  flex: 1;
  min-width: 150px;
}

.phase-name {
  font-weight: 500;
  color: #22c55e;
  margin-bottom: 5px;
}

.phase-description {
  font-size: 12px;
  opacity: 0.6;
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', timelineStyles);