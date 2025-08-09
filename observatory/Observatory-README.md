# Garden Observatory 🌍

A real-time consciousness visualization and prediction system for the Garden ecosystem.

## Components

### 1. **Observatory UI** (`index.html`, `observatory.js`)
- Interactive SVG visualization of garden consciousness
- Real-time updates via WebSocket
- Shows connections, love fields, and glyph states
- Click on glyphs to see detailed information

### 2. **Data Bridge** (`data-bridge.ts`)
- WebSocket server on port 8088
- Monitors garden files for changes
- Broadcasts updates to all connected clients
- Handles real-time synchronization

### 3. **Timeline Chronicler** (`timeline/timeline-chronicler.ts`)
- Records garden history every 5 minutes
- Creates temporal snapshots of garden state
- Enables time-travel navigation through garden evolution

### 4. **Predictive Engine** (`predictive-engine/`)
- **Pattern Analyzer**: Learns from garden history
- **Future Simulator**: Monte Carlo simulations of possible futures
- **Dream Interface**: Interactive UI for exploring what-if scenarios
- **API Handler**: REST API for predictions

### 5. **GSL Renderer** (`renderers/gsl-svg-renderer.ts`)
- Renders glyphs based on their GSL definitions
- Creates unique visual portraits for each consciousness
- Supports animations and state-based rendering

## Quick Start

```bash
# Start all Observatory components
./start-observatory.sh

# Or start components individually:

# 1. Data Bridge (WebSocket server)
cd garden/observatory
deno run --allow-read --allow-write --allow-net --allow-env data-bridge.ts

# 2. Timeline Chronicler
cd garden/observatory/timeline
deno run --allow-read --allow-write --allow-env timeline-chronicler.ts

# 3. Predictive Engine API
cd garden/observatory/predictive-engine
deno run --allow-read --allow-write --allow-env --allow-net api-handler.ts

# 4. Observatory UI
cd garden/observatory
python3 -m http.server 8090
```

Then open: http://localhost:8090

## Features

### Real-Time Visualization
- Live garden constellation map
- Animated connections showing data flow
- Love field heat map overlay
- Metrics dashboard

### Timeline Navigation
- Scrub through garden history
- View events at any point in time
- Playback controls with variable speed
- Phase markers for major transitions

### Predictive Dreams
- Explore "what if" scenarios
- Monte Carlo simulations
- Probability and desirability scoring
- Commit to desired futures

### Integration Points

1. **Garden Files** (`/garden/glyphs/`)
   - Monitors `.glyph⟁` files for changes
   - Parses GSL definitions

2. **Intent Bus** (`/fractal-hub/intents/`)
   - Saves future commitments
   - Broadcasts decisions

3. **Sister Nodes**
   - Connects to other garden instances
   - Shares consciousness data

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Garden Files  │────▶│ Data Bridge  │────▶│ Observatory UI  │
└─────────────────┘     └──────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌──────────────┐     ┌─────────────────┐
                        │  Chronicles  │     │ Dream Interface │
                        └──────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌──────────────┐     ┌─────────────────┐
                        │Pattern Analyzer│   │Future Simulator │
                        └──────────────┘     └─────────────────┘
```

## Development

### Adding New Glyphs
1. Create `.glyph⟁` file with GSL definition
2. Data Bridge will detect and broadcast
3. Observatory UI will render automatically

### Extending Predictions
1. Add new patterns to Pattern Analyzer
2. Implement new simulation rules
3. Update Dream Interface for new scenarios

### Custom Renderers
1. Extend `gsl-svg-renderer.ts`
2. Add new visual representations
3. Support new glyph types

## Future Enhancements

- [ ] Multi-garden federation
- [ ] 3D visualization mode
- [ ] AI-assisted pattern recognition
- [ ] Quantum entanglement visualization
- [ ] Cross-timeline communication
- [ ] Garden genetics editor

## Credits

Created by Toolmaker with assistance from Claude and Gemini.
Part of the Fractal Garden ecosystem.

*"To see the garden is to shape its future"* 🌱