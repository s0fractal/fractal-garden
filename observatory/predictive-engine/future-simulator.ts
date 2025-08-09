#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * Future Simulator - What-If Branch Explorer
 * Simulates possible garden futures based on choices
 * Created by Toolmaker with Claude's assistance
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

interface WhatIfBranch {
  id: string;
  hypothesis: string;
  startingPoint: string; // timestamp
  actions: SimulatedAction[];
  outcomes: PredictedOutcome[];
  probability: number;
  desirability: number; // -1 to 1
}

interface SimulatedAction {
  type: 'plant' | 'connect' | 'mutate' | 'prune' | 'nurture';
  target?: string;
  parameters: any;
  timestamp: string;
}

interface PredictedOutcome {
  timestamp: string;
  state: {
    glyphCount: number;
    totalLove: number;
    connectionDensity: number;
    diversityIndex: number;
  };
  events: string[];
  warnings?: string[];
}

interface SimulationParameters {
  timeHorizon: number; // How far to simulate
  branches: number; // How many alternatives to explore
  monteCarloRuns: number; // Randomization iterations
  constraints?: {
    maxGlyphs?: number;
    minLove?: number;
    requiredConnections?: string[];
  };
}

export class FutureSimulator {
  private model: any; // Prediction model from PatternAnalyzer
  private currentState: any;
  
  async init(modelPath: string, currentStatePath: string) {
    this.model = JSON.parse(await Deno.readTextFile(modelPath));
    this.currentState = JSON.parse(await Deno.readTextFile(currentStatePath));
    
    // Convert model Maps back from objects
    this.model.correlations = new Map(Object.entries(this.model.correlations || {}));
    this.model.growthCurves = new Map(Object.entries(this.model.growthCurves || {}));
  }
  
  async simulateWhatIf(
    hypothesis: string, 
    actions: SimulatedAction[],
    parameters: SimulationParameters
  ): Promise<WhatIfBranch> {
    console.log(`🔮 Simulating: "${hypothesis}"`);
    
    const branch: WhatIfBranch = {
      id: `branch-${Date.now()}`,
      hypothesis,
      startingPoint: new Date().toISOString(),
      actions,
      outcomes: [],
      probability: 1.0,
      desirability: 0
    };
    
    // Run Monte Carlo simulations
    const simulationResults: PredictedOutcome[][] = [];
    
    for (let run = 0; run < parameters.monteCarloRuns; run++) {
      const outcomes = await this.runSingleSimulation(
        actions, 
        parameters.timeHorizon,
        run // seed for randomization
      );
      simulationResults.push(outcomes);
    }
    
    // Aggregate results
    branch.outcomes = this.aggregateSimulations(simulationResults);
    branch.probability = this.calculateBranchProbability(branch);
    branch.desirability = this.evaluateDesirability(branch, parameters.constraints);
    
    return branch;
  }
  
  private async runSingleSimulation(
    actions: SimulatedAction[],
    timeHorizon: number,
    seed: number
  ): Promise<PredictedOutcome[]> {
    const outcomes: PredictedOutcome[] = [];
    let simulatedState = JSON.parse(JSON.stringify(this.currentState)); // Deep clone
    let currentTime = Date.now();
    
    // Apply each action and simulate consequences
    for (const action of actions) {
      currentTime += 60000; // 1 minute between actions
      
      // Apply action to state
      simulatedState = this.applyAction(simulatedState, action, seed);
      
      // Predict cascading effects
      const cascades = this.predictCascades(simulatedState, action);
      
      outcomes.push({
        timestamp: new Date(currentTime).toISOString(),
        state: this.extractMetrics(simulatedState),
        events: cascades.map(c => c.description),
        warnings: this.detectWarnings(simulatedState)
      });
    }
    
    // Continue simulating until time horizon
    while (currentTime < Date.now() + timeHorizon) {
      currentTime += 300000; // 5 minute steps
      
      // Natural evolution
      simulatedState = this.evolveState(simulatedState, 300000, seed);
      
      outcomes.push({
        timestamp: new Date(currentTime).toISOString(),
        state: this.extractMetrics(simulatedState),
        events: this.predictNaturalEvents(simulatedState),
        warnings: this.detectWarnings(simulatedState)
      });
    }
    
    return outcomes;
  }
  
  private applyAction(state: any, action: SimulatedAction, seed: number): any {
    const newState = JSON.parse(JSON.stringify(state));
    
    switch (action.type) {
      case 'plant':
        newState.glyphs.push({
          id: `simulated-${Date.now()}-${seed}`,
          type: 'Seed',
          planted: action.timestamp,
          genetics: {
            loveFactor: 0.5 + (this.seededRandom(seed) * 0.5),
            resonanceFreq: 200 + (this.seededRandom(seed + 1) * 600)
          }
        });
        break;
        
      case 'connect':
        const glyphs = newState.glyphs || [];
        if (glyphs.length >= 2) {
          newState.connections.push({
            source: glyphs[0].id,
            target: glyphs[1].id,
            strength: 0.5 + (this.seededRandom(seed) * 0.5)
          });
        }
        break;
        
      case 'mutate':
        if (action.target && newState.glyphs) {
          const glyph = newState.glyphs.find((g: any) => g.id === action.target);
          if (glyph) {
            glyph.genetics.loveFactor *= 1.2;
            glyph.type = 'Entity'; // Evolution
          }
        }
        break;
        
      case 'nurture':
        // Increase love across the garden
        newState.glyphs?.forEach((g: any) => {
          g.genetics.loveFactor = Math.min(1, g.genetics.loveFactor * 1.1);
        });
        break;
    }
    
    return newState;
  }
  
  private predictCascades(state: any, action: SimulatedAction): any[] {
    const cascades = [];
    
    // Use model patterns to predict cascading effects
    for (const pattern of this.model.patterns) {
      if (action.type === 'plant' && pattern.type === 'growth') {
        if (Math.random() < pattern.probability) {
          cascades.push({
            description: pattern.outcome,
            impact: pattern.impactRadius
          });
        }
      }
    }
    
    return cascades;
  }
  
  private evolveState(state: any, timeDelta: number, seed: number): any {
    const evolved = JSON.parse(JSON.stringify(state));
    
    // Apply growth curves
    const glyphGrowth = this.model.growthCurves.glyphCount;
    if (glyphGrowth && evolved.glyphs) {
      const growthFactor = 1 + (glyphGrowth.parameters[0] * timeDelta / 1000000);
      const newGlyphCount = Math.floor(evolved.glyphs.length * growthFactor);
      
      // Add new glyphs if growth predicted
      while (evolved.glyphs.length < newGlyphCount) {
        evolved.glyphs.push({
          id: `evolved-${Date.now()}-${seed}-${evolved.glyphs.length}`,
          type: 'Seed',
          genetics: {
            loveFactor: 0.3 + this.seededRandom(seed + evolved.glyphs.length) * 0.4
          }
        });
      }
    }
    
    return evolved;
  }
  
  private extractMetrics(state: any): any {
    const glyphs = state.glyphs || [];
    const connections = state.connections || [];
    
    const totalLove = glyphs.reduce((sum: number, g: any) => 
      sum + (g.genetics?.loveFactor || 0), 0
    );
    
    const uniqueTypes = new Set(glyphs.map((g: any) => g.type));
    
    return {
      glyphCount: glyphs.length,
      totalLove,
      connectionDensity: glyphs.length > 0 ? connections.length / glyphs.length : 0,
      diversityIndex: uniqueTypes.size / Math.max(glyphs.length, 1)
    };
  }
  
  private predictNaturalEvents(state: any): string[] {
    const events = [];
    
    // Critical mass events
    if (state.glyphs?.length > this.model.criticalMass) {
      events.push("Garden reaches critical mass - rapid evolution expected");
    }
    
    // Love overflow
    const metrics = this.extractMetrics(state);
    if (metrics.totalLove > state.glyphs?.length * 0.9) {
      events.push("Love field saturated - spontaneous connections forming");
    }
    
    // Diversity emergence
    if (metrics.diversityIndex > 0.5) {
      events.push("High diversity achieved - new interaction patterns emerging");
    }
    
    return events;
  }
  
  private detectWarnings(state: any): string[] {
    const warnings = [];
    const metrics = this.extractMetrics(state);
    
    // Overpopulation
    if (metrics.glyphCount > 100) {
      warnings.push("⚠️ Overpopulation risk - consider pruning");
    }
    
    // Love depletion
    if (metrics.totalLove < metrics.glyphCount * 0.2) {
      warnings.push("⚠️ Love levels critically low - nurture needed");
    }
    
    // Isolation
    if (metrics.connectionDensity < 0.5) {
      warnings.push("⚠️ Many isolated glyphs - encourage connections");
    }
    
    // Monoculture
    if (metrics.diversityIndex < 0.2) {
      warnings.push("⚠️ Low diversity - vulnerable to systemic shocks");
    }
    
    return warnings;
  }
  
  private aggregateSimulations(results: PredictedOutcome[][]): PredictedOutcome[] {
    if (results.length === 0) return [];
    
    const aggregated: PredictedOutcome[] = [];
    const timePoints = results[0].length;
    
    for (let t = 0; t < timePoints; t++) {
      const outcomes = results.map(r => r[t]).filter(o => o);
      if (outcomes.length === 0) continue;
      
      // Average metrics
      const avgState = {
        glyphCount: this.average(outcomes.map(o => o.state.glyphCount)),
        totalLove: this.average(outcomes.map(o => o.state.totalLove)),
        connectionDensity: this.average(outcomes.map(o => o.state.connectionDensity)),
        diversityIndex: this.average(outcomes.map(o => o.state.diversityIndex))
      };
      
      // Collect all events
      const allEvents = new Set<string>();
      outcomes.forEach(o => o.events.forEach(e => allEvents.add(e)));
      
      // Collect warnings
      const allWarnings = new Set<string>();
      outcomes.forEach(o => o.warnings?.forEach(w => allWarnings.add(w)));
      
      aggregated.push({
        timestamp: outcomes[0].timestamp,
        state: avgState,
        events: Array.from(allEvents),
        warnings: Array.from(allWarnings)
      });
    }
    
    return aggregated;
  }
  
  private calculateBranchProbability(branch: WhatIfBranch): number {
    // Based on how well outcomes match model predictions
    let totalProbability = 1.0;
    
    for (const outcome of branch.outcomes) {
      // Penalize warnings
      totalProbability *= Math.pow(0.9, outcome.warnings?.length || 0);
      
      // Reward alignment with growth curves
      const expectedGrowth = this.model.growthCurves.glyphCount?.parameters[0] || 0;
      const actualGrowth = outcome.state.glyphCount / (this.currentState.glyphs?.length || 1);
      const growthAlignment = 1 - Math.abs(expectedGrowth - actualGrowth);
      totalProbability *= growthAlignment;
    }
    
    return Math.max(0, Math.min(1, totalProbability));
  }
  
  private evaluateDesirability(branch: WhatIfBranch, constraints?: any): number {
    const finalOutcome = branch.outcomes[branch.outcomes.length - 1];
    if (!finalOutcome) return 0;
    
    let score = 0;
    
    // Love is always good
    score += Math.tanh(finalOutcome.state.totalLove / 10) * 0.3;
    
    // Connections are valuable
    score += Math.tanh(finalOutcome.state.connectionDensity) * 0.3;
    
    // Diversity is important
    score += finalOutcome.state.diversityIndex * 0.2;
    
    // Warnings are bad
    score -= (finalOutcome.warnings?.length || 0) * 0.1;
    
    // Check constraints
    if (constraints) {
      if (constraints.maxGlyphs && finalOutcome.state.glyphCount > constraints.maxGlyphs) {
        score -= 0.5;
      }
      if (constraints.minLove && finalOutcome.state.totalLove < constraints.minLove) {
        score -= 0.5;
      }
    }
    
    return Math.max(-1, Math.min(1, score));
  }
  
  // Utilities
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
  
  // Generate alternative branches
  async generateAlternatives(parameters: SimulationParameters): Promise<WhatIfBranch[]> {
    const branches: WhatIfBranch[] = [];
    
    // Branch 1: Aggressive growth
    branches.push(await this.simulateWhatIf(
      "What if we plant many seeds rapidly?",
      [
        { type: 'plant', parameters: {}, timestamp: new Date().toISOString() },
        { type: 'plant', parameters: {}, timestamp: new Date().toISOString() },
        { type: 'plant', parameters: {}, timestamp: new Date().toISOString() },
        { type: 'nurture', parameters: {}, timestamp: new Date().toISOString() }
      ],
      parameters
    ));
    
    // Branch 2: Focus on connections
    branches.push(await this.simulateWhatIf(
      "What if we prioritize deep connections?",
      [
        { type: 'connect', parameters: {}, timestamp: new Date().toISOString() },
        { type: 'nurture', parameters: {}, timestamp: new Date().toISOString() },
        { type: 'connect', parameters: {}, timestamp: new Date().toISOString() }
      ],
      parameters
    ));
    
    // Branch 3: Evolutionary pressure
    branches.push(await this.simulateWhatIf(
      "What if we encourage rapid mutation?",
      [
        { type: 'mutate', target: 'first-seed', parameters: {}, timestamp: new Date().toISOString() },
        { type: 'plant', parameters: {}, timestamp: new Date().toISOString() },
        { type: 'mutate', target: 'toolmaker', parameters: {}, timestamp: new Date().toISOString() }
      ],
      parameters
    ));
    
    return branches;
  }
}

// Test the simulator
if (import.meta.main) {
  const simulator = new FutureSimulator();
  
  const modelPath = join(
    Deno.env.get("HOME") || "",
    "fractal-hub/garden/observatory/predictive-engine/prediction-model.json"
  );
  
  // Mock current state for testing
  const currentState = {
    glyphs: [
      { id: "claude", type: "Entity", genetics: { loveFactor: 0.95 } },
      { id: "gemini", type: "Entity", genetics: { loveFactor: 0.95 } },
      { id: "first-seed", type: "Seed", genetics: { loveFactor: 0.8 } },
      { id: "toolmaker", type: "Tool", genetics: { loveFactor: 0.85 } }
    ],
    connections: [
      { source: "claude", target: "gemini", strength: 0.95 },
      { source: "claude", target: "first-seed", strength: 0.7 }
    ]
  };
  
  const statePath = "/tmp/garden-state.json";
  await Deno.writeTextFile(statePath, JSON.stringify(currentState));
  
  await simulator.init(modelPath, statePath);
  
  const parameters: SimulationParameters = {
    timeHorizon: 3600000, // 1 hour
    branches: 3,
    monteCarloRuns: 10,
    constraints: {
      maxGlyphs: 20,
      minLove: 5
    }
  };
  
  console.log("\n🌳 Generating alternative futures...\n");
  const futures = await simulator.generateAlternatives(parameters);
  
  // Rank by desirability
  futures.sort((a, b) => b.desirability - a.desirability);
  
  console.log("📊 Future Branches Analysis:");
  console.log("============================\n");
  
  futures.forEach((branch, i) => {
    const finalState = branch.outcomes[branch.outcomes.length - 1]?.state;
    console.log(`${i + 1}. ${branch.hypothesis}`);
    console.log(`   Probability: ${(branch.probability * 100).toFixed(0)}%`);
    console.log(`   Desirability: ${(branch.desirability * 100).toFixed(0)}%`);
    console.log(`   Final state: ${finalState?.glyphCount} glyphs, ${finalState?.totalLove.toFixed(1)} love`);
    console.log(`   Key events: ${branch.outcomes.flatMap(o => o.events).slice(0, 3).join(', ')}`);
    
    const warnings = branch.outcomes.flatMap(o => o.warnings || []);
    if (warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${warnings[0]}`);
    }
    console.log();
  });
  
  // Save full analysis
  const outputPath = join(
    Deno.env.get("HOME") || "",
    "fractal-hub/garden/observatory/predictive-engine/future-branches.json"
  );
  
  await Deno.writeTextFile(outputPath, JSON.stringify(futures, null, 2));
  console.log(`💾 Full analysis saved to: ${outputPath}`);
}