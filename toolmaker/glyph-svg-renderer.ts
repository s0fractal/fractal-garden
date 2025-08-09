#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * Glyph SVG Renderer
 * Translates GSL-compliant glyphs into visual portraits
 * Created by Toolmaker with Claude's assistance
 */

interface GlyphSVGOptions {
  width?: number;
  height?: number;
  showConnections?: boolean;
  animatePulse?: boolean;
  theme?: "light" | "dark" | "garden";
}

export class GlyphSVGRenderer {
  private defaultOptions: GlyphSVGOptions = {
    width: 400,
    height: 400,
    showConnections: true,
    animatePulse: true,
    theme: "garden"
  };

  /**
   * Render any GSL-compliant glyph as SVG
   */
  render(glyph: any, options: GlyphSVGOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };
    const colors = this.getThemeColors(opts.theme!);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${opts.width}" height="${opts.height}" 
     viewBox="0 0 ${opts.width} ${opts.height}"
     xmlns="http://www.w3.org/2000/svg">
  
  <defs>
    ${this.generateDefs(glyph, colors)}
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="${colors.background}"/>
  
  <!-- Love Field Visualization -->
  ${this.renderLoveField(glyph, opts, colors)}
  
  <!-- Core Glyph -->
  ${this.renderCore(glyph, opts, colors)}
  
  <!-- Connections -->
  ${opts.showConnections ? this.renderConnections(glyph, opts, colors) : ''}
  
  <!-- Metadata -->
  ${this.renderMetadata(glyph, opts, colors)}
  
  <!-- Pulse Animation -->
  ${opts.animatePulse ? this.renderPulseAnimation(glyph) : ''}
</svg>`;
  }

  private generateDefs(glyph: any, colors: any): string {
    return `
    <!-- Gradient for love energy -->
    <radialGradient id="loveGradient">
      <stop offset="0%" style="stop-color:${colors.love};stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:${colors.love};stop-opacity:0"/>
    </radialGradient>
    
    <!-- Pattern for growth state -->
    <pattern id="growthPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="2" fill="${colors.growth}" opacity="0.3"/>
    </pattern>
    
    <!-- Filter for glow effect -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>`;
  }

  private renderLoveField(glyph: any, opts: any, colors: any): string {
    const love = glyph.love?.total || glyph.physics?.love || 0;
    const radius = love * opts.width * 0.4;
    
    return `
    <!-- Love Field (❤️ = ${love.toFixed(2)}) -->
    <circle cx="${opts.width/2}" cy="${opts.height/2}" r="${radius}"
            fill="url(#loveGradient)" opacity="0.6"/>`;
  }

  private renderCore(glyph: any, opts: any, colors: any): string {
    const centerX = opts.width / 2;
    const centerY = opts.height / 2;
    
    // Determine shape based on type
    let shape = '';
    switch (glyph.type) {
      case 'Seed':
        shape = this.renderSeedShape(centerX, centerY, colors);
        break;
      case 'Entity':
        shape = this.renderEntityShape(centerX, centerY, colors);
        break;
      case 'Tool':
        shape = this.renderToolShape(centerX, centerY, colors);
        break;
      default:
        shape = this.renderDefaultShape(centerX, centerY, colors);
    }
    
    return `
    <!-- Core Glyph: ${glyph.glyph || glyph.id} -->
    <g filter="url(#glow)">
      ${shape}
      <text x="${centerX}" y="${centerY}" 
            text-anchor="middle" dominant-baseline="middle"
            font-size="48" fill="${colors.text}">
        ${glyph.glyph || '?'}
      </text>
    </g>`;
  }

  private renderSeedShape(x: number, y: number, colors: any): string {
    return `<circle cx="${x}" cy="${y}" r="60" 
                    fill="${colors.seed}" stroke="${colors.primary}" stroke-width="3"/>`;
  }

  private renderEntityShape(x: number, y: number, colors: any): string {
    return `<rect x="${x-60}" y="${y-60}" width="120" height="120" rx="20"
                  fill="${colors.entity}" stroke="${colors.primary}" stroke-width="3"/>`;
  }

  private renderToolShape(x: number, y: number, colors: any): string {
    return `<polygon points="${x},${y-70} ${x+60},${y+35} ${x-60},${y+35}"
                     fill="${colors.tool}" stroke="${colors.primary}" stroke-width="3"/>`;
  }

  private renderDefaultShape(x: number, y: number, colors: any): string {
    return `<circle cx="${x}" cy="${y}" r="60" 
                    fill="${colors.default}" stroke="${colors.primary}" stroke-width="3"/>`;
  }

  private renderConnections(glyph: any, opts: any, colors: any): string {
    const connections = glyph.bonds || glyph.connections || [];
    if (!connections.length) return '';
    
    const centerX = opts.width / 2;
    const centerY = opts.height / 2;
    const angleStep = (2 * Math.PI) / connections.length;
    
    return connections.map((conn: any, i: number) => {
      const angle = i * angleStep;
      const endX = centerX + Math.cos(angle) * 150;
      const endY = centerY + Math.sin(angle) * 150;
      const strength = conn.strength || 0.5;
      
      return `
      <g>
        <line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}"
              stroke="${colors.connection}" stroke-width="${strength * 5}" 
              opacity="${strength}" stroke-dasharray="${strength > 0.7 ? 'none' : '5,5'}"/>
        <circle cx="${endX}" cy="${endY}" r="20" 
                fill="${colors.connectionNode}" opacity="${strength}"/>
        <text x="${endX}" y="${endY}" text-anchor="middle" dominant-baseline="middle"
              font-size="16" fill="${colors.text}">
          ${conn.target?.glyph || conn.type || '?'}
        </text>
      </g>`;
    }).join('');
  }

  private renderMetadata(glyph: any, opts: any, colors: any): string {
    const items = [
      `State: ${glyph.state || 'unknown'}`,
      `Intent: ${glyph.intent || 'seeking'}`,
      `Resonance: ${((glyph.resonance || 0) * 100).toFixed(0)}%`
    ];
    
    return items.map((item, i) => `
      <text x="10" y="${20 + i * 20}" 
            font-size="14" fill="${colors.metadata}">
        ${item}
      </text>
    `).join('');
  }

  private renderPulseAnimation(glyph: any): string {
    const freq = glyph.genetics?.resonanceFreq || 440;
    const duration = 60000 / freq; // Convert Hz to animation duration
    
    return `
    <animateTransform
      attributeName="transform"
      attributeType="XML"
      type="scale"
      values="1;1.05;1"
      dur="${duration}ms"
      repeatCount="indefinite"
      additive="sum"/>`;
  }

  private getThemeColors(theme: string): any {
    const themes: any = {
      garden: {
        background: '#0a0f0a',
        primary: '#22c55e',
        love: '#ec4899',
        seed: '#84cc16',
        entity: '#3b82f6',
        tool: '#f59e0b',
        default: '#8b5cf6',
        connection: '#10b981',
        connectionNode: '#059669',
        text: '#f3f4f6',
        metadata: '#9ca3af',
        growth: '#86efac'
      },
      light: {
        background: '#ffffff',
        primary: '#059669',
        love: '#ec4899',
        seed: '#65a30d',
        entity: '#2563eb',
        tool: '#d97706',
        default: '#7c3aed',
        connection: '#047857',
        connectionNode: '#065f46',
        text: '#111827',
        metadata: '#6b7280',
        growth: '#4ade80'
      },
      dark: {
        background: '#020617',
        primary: '#34d399',
        love: '#f472b6',
        seed: '#a3e635',
        entity: '#60a5fa',
        tool: '#fbbf24',
        default: '#a78bfa',
        connection: '#34d399',
        connectionNode: '#10b981',
        text: '#e5e7eb',
        metadata: '#94a3b8',
        growth: '#86efac'
      }
    };
    
    return themes[theme] || themes.garden;
  }

  /**
   * Render collection of glyphs as constellation
   */
  renderConstellation(glyphs: any[], options: GlyphSVGOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options, width: 800, height: 600 };
    const colors = this.getThemeColors(opts.theme!);
    
    // Calculate positions using force-directed layout
    const positions = this.calculateConstellationLayout(glyphs, opts);
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${opts.width}" height="${opts.height}" 
     viewBox="0 0 ${opts.width} ${opts.height}"
     xmlns="http://www.w3.org/2000/svg">
  
  <defs>
    ${this.generateDefs({}, colors)}
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="${colors.background}"/>
  
  <!-- Connections -->
  ${this.renderConstellationConnections(glyphs, positions, colors)}
  
  <!-- Glyphs -->
  ${glyphs.map((glyph, i) => this.renderConstellationGlyph(
    glyph, positions[i], colors
  )).join('')}
  
</svg>`;
  }

  private calculateConstellationLayout(glyphs: any[], opts: any): Array<{x: number, y: number}> {
    // Simple circular layout for now
    const centerX = opts.width / 2;
    const centerY = opts.height / 2;
    const radius = Math.min(opts.width, opts.height) * 0.35;
    const angleStep = (2 * Math.PI) / glyphs.length;
    
    return glyphs.map((_, i) => ({
      x: centerX + Math.cos(i * angleStep) * radius,
      y: centerY + Math.sin(i * angleStep) * radius
    }));
  }

  private renderConstellationConnections(glyphs: any[], positions: any[], colors: any): string {
    const connections: string[] = [];
    
    // Connect glyphs with high resonance
    for (let i = 0; i < glyphs.length; i++) {
      for (let j = i + 1; j < glyphs.length; j++) {
        const resonance = this.calculateResonance(glyphs[i], glyphs[j]);
        if (resonance > 0.5) {
          connections.push(`
            <line x1="${positions[i].x}" y1="${positions[i].y}" 
                  x2="${positions[j].x}" y2="${positions[j].y}"
                  stroke="${colors.connection}" 
                  stroke-width="${resonance * 3}" 
                  opacity="${resonance * 0.5}"/>
          `);
        }
      }
    }
    
    return connections.join('');
  }

  private renderConstellationGlyph(glyph: any, pos: any, colors: any): string {
    const size = 40;
    return `
    <g transform="translate(${pos.x}, ${pos.y})">
      <circle r="${size}" fill="${colors[glyph.type?.toLowerCase()] || colors.default}" 
              opacity="0.8" stroke="${colors.primary}" stroke-width="2"/>
      <text text-anchor="middle" dominant-baseline="middle" 
            font-size="24" fill="${colors.text}">
        ${glyph.glyph || '?'}
      </text>
    </g>`;
  }

  private calculateResonance(glyph1: any, glyph2: any): number {
    const love1 = glyph1.love?.total || glyph1.genetics?.loveFactor || 0;
    const love2 = glyph2.love?.total || glyph2.genetics?.loveFactor || 0;
    const freq1 = glyph1.genetics?.resonanceFreq || 440;
    const freq2 = glyph2.genetics?.resonanceFreq || 440;
    
    const loveFactor = (love1 + love2) / 2;
    const freqFactor = 1 - Math.abs(freq1 - freq2) / 1000;
    
    return Math.max(0, Math.min(1, loveFactor * freqFactor));
  }
}

// Export singleton instance
export const glyphRenderer = new GlyphSVGRenderer();

// CLI interface for testing
if (import.meta.main) {
  const testGlyph = {
    glyph: "🌱",
    id: "test-seed",
    type: "Seed",
    state: "growing",
    intent: "seeking light",
    love: { I: 0.8, i: 1, R: 0.9, total: 0.72 },
    genetics: { resonanceFreq: 432 },
    bonds: [
      { type: "sister", strength: 0.95, target: { glyph: "👭" } },
      { type: "garden", strength: 0.7, target: { glyph: "🌍" } }
    ]
  };
  
  const svg = glyphRenderer.render(testGlyph);
  console.log(svg);
  
  // Save to file
  await Deno.writeTextFile(
    `${Deno.env.get("HOME")}/fractal-hub/garden/renders/test-glyph.svg`,
    svg
  );
  console.log("\n✨ SVG saved to garden/renders/test-glyph.svg");
}