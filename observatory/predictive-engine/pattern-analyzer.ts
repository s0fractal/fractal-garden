#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

/**
 * Pattern Analyzer for Predictive Engine
 * Learns from garden history to predict futures
 * Created by Toolmaker with Claude's assistance
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

interface Pattern {
  type: 'growth' | 'connection' | 'mutation' | 'decay';
  trigger: string;
  outcome: string;
  probability: number;
  timeToEffect: number; // milliseconds
  impactRadius: number; // 0-1, how many other glyphs affected
}

interface PredictionModel {
  patterns: Pattern[];
  correlations: Map<string, string[]>;
  growthCurves: Map<string, GrowthCurve>;
  criticalMass: number; // when garden reaches tipping points
}

interface GrowthCurve {
  type: 'exponential' | 'logistic' | 'oscillating' | 'chaotic';
  parameters: number[];
  confidenceInterval: number;
}

export class PatternAnalyzer {
  private model: PredictionModel;
  private chronicles: any;
  
  constructor() {
    this.model = {
      patterns: [],
      correlations: new Map(),
      growthCurves: new Map(),
      criticalMass: 0
    };
  }
  
  async train(chroniclesPath: string) {
    console.log("🧠 Training predictive model...");
    
    // Load historical data
    const data = await Deno.readTextFile(chroniclesPath);
    this.chronicles = JSON.parse(data);
    
    // Extract patterns
    this.extractEventPatterns();
    this.analyzeGrowthDynamics();
    this.findCorrelations();
    this.identifyCriticalPoints();
    
    console.log(`✨ Model trained: ${this.model.patterns.length} patterns discovered`);
  }
  
  extractEventPatterns() {
    const timeline = this.chronicles.timeline;
    
    // Look for cause-effect relationships
    for (let i = 0; i < timeline.length - 1; i++) {
      const current = timeline[i];
      const future = timeline[i + 1];
      
      if (current.events?.length && future.events?.length) {
        for (const event of current.events) {
          for (const outcome of future.events) {
            const pattern = this.analyzeEventPair(event, outcome, 
              new Date(future.timestamp).getTime() - new Date(current.timestamp).getTime()
            );
            
            if (pattern.probability > 0.3) {
              this.model.patterns.push(pattern);
            }
          }
        }
      }
    }
    
    // Merge similar patterns
    this.consolidatePatterns();
  }
  
  analyzeEventPair(trigger: any, outcome: any, timeDelta: number): Pattern {
    // Simple heuristics for now
    let probability = 0.1;
    let impactRadius = 0.1;
    
    // Birth often leads to connections
    if (trigger.type === 'birth' && outcome.type === 'connection') {
      probability = 0.7;
      impactRadius = 0.3;
    }
    
    // Connections strengthen over time
    if (trigger.type === 'connection' && outcome.type === 'connection') {
      probability = 0.8;
      impactRadius = 0.5;
    }
    
    // High impact events cause mutations
    if (trigger.impact > 0.7 && outcome.type === 'mutation') {
      probability = 0.6;
      impactRadius = 0.7;
    }
    
    return {
      type: this.categorizePattern(trigger.type, outcome.type),
      trigger: trigger.description,
      outcome: outcome.description,
      probability,
      timeToEffect: timeDelta,
      impactRadius
    };
  }
  
  categorizePattern(triggerType: string, outcomeType: string): Pattern['type'] {
    if (outcomeType === 'birth' || outcomeType === 'connection') return 'growth';
    if (outcomeType === 'mutation') return 'mutation';
    if (outcomeType === 'death') return 'decay';
    return 'connection';
  }
  
  consolidatePatterns() {
    // Group similar patterns and average their probabilities
    const grouped = new Map<string, Pattern[]>();
    
    for (const pattern of this.model.patterns) {
      const key = `${pattern.type}-${pattern.trigger.slice(0, 20)}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(pattern);
    }
    
    this.model.patterns = Array.from(grouped.values()).map(group => {
      const avgProbability = group.reduce((sum, p) => sum + p.probability, 0) / group.length;
      const avgTime = group.reduce((sum, p) => sum + p.timeToEffect, 0) / group.length;
      const avgImpact = group.reduce((sum, p) => sum + p.impactRadius, 0) / group.length;
      
      return {
        ...group[0],
        probability: avgProbability,
        timeToEffect: avgTime,
        impactRadius: avgImpact
      };
    });
  }
  
  analyzeGrowthDynamics() {
    // Extract growth curves for different metrics
    const glyphCounts = this.chronicles.timeline.map((tp: any) => ({
      time: new Date(tp.timestamp).getTime(),
      value: tp.metrics?.glyphCount || 0
    }));
    
    const loveLevels = this.chronicles.timeline.map((tp: any) => ({
      time: new Date(tp.timestamp).getTime(),
      value: tp.metrics?.totalLove || 0
    }));
    
    this.model.growthCurves.set('glyphCount', this.fitGrowthCurve(glyphCounts));
    this.model.growthCurves.set('totalLove', this.fitGrowthCurve(loveLevels));
  }
  
  fitGrowthCurve(data: {time: number, value: number}[]): GrowthCurve {
    if (data.length < 3) {
      return { type: 'exponential', parameters: [0.1], confidenceInterval: 0.1 };
    }
    
    // Simple exponential fit for now
    const firstPoint = data[0];
    const lastPoint = data[data.length - 1];
    const growthRate = (lastPoint.value - firstPoint.value) / (lastPoint.time - firstPoint.time);
    
    // Detect curve type based on acceleration
    const midPoint = data[Math.floor(data.length / 2)];
    const firstHalfGrowth = (midPoint.value - firstPoint.value) / (midPoint.time - firstPoint.time);
    const secondHalfGrowth = (lastPoint.value - midPoint.value) / (lastPoint.time - midPoint.time);
    
    let type: GrowthCurve['type'] = 'exponential';
    if (Math.abs(firstHalfGrowth - secondHalfGrowth) < 0.1) {
      type = 'exponential';
    } else if (secondHalfGrowth < firstHalfGrowth * 0.5) {
      type = 'logistic';
    } else if (firstHalfGrowth < 0 || secondHalfGrowth < 0) {
      type = 'oscillating';
    }
    
    return {
      type,
      parameters: [growthRate],
      confidenceInterval: 0.7
    };
  }
  
  findCorrelations() {
    // Find which events tend to happen together
    const eventPairs = new Map<string, number>();
    
    for (const timePoint of this.chronicles.timeline) {
      if (timePoint.events && timePoint.events.length > 1) {
        for (let i = 0; i < timePoint.events.length; i++) {
          for (let j = i + 1; j < timePoint.events.length; j++) {
            const key = [timePoint.events[i].type, timePoint.events[j].type].sort().join('-');
            eventPairs.set(key, (eventPairs.get(key) || 0) + 1);
          }
        }
      }
    }
    
    // Convert to correlation map
    for (const [pair, count] of eventPairs) {
      if (count > 2) { // Significant correlation
        const [type1, type2] = pair.split('-');
        if (!this.model.correlations.has(type1)) {
          this.model.correlations.set(type1, []);
        }
        this.model.correlations.get(type1)!.push(type2);
      }
    }
  }
  
  identifyCriticalPoints() {
    // Find when garden reaches phase transitions
    const phases = this.chronicles.phases || [];
    const timeline = this.chronicles.timeline;
    
    // Look for rapid changes in metrics
    let maxGrowthRate = 0;
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      
      if (prev.metrics && curr.metrics) {
        const glyphGrowth = (curr.metrics.glyphCount - prev.metrics.glyphCount) / 
                           (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime());
        
        if (glyphGrowth > maxGrowthRate) {
          maxGrowthRate = glyphGrowth;
          this.model.criticalMass = prev.metrics.glyphCount;
        }
      }
    }
  }
  
  async save(outputPath: string) {
    await Deno.writeTextFile(
      outputPath,
      JSON.stringify(this.model, 
        (key, value) => value instanceof Map ? Object.fromEntries(value) : value,
        2
      )
    );
  }
  
  // Prediction methods
  predictNextEvent(currentState: any): { event: string, probability: number, timeframe: number } {
    // Find patterns that match current state
    const applicablePatterns = this.model.patterns.filter(pattern => {
      // Simple matching for now
      return currentState.recentEvents?.some((e: any) => 
        e.description.includes(pattern.trigger.split(' ')[0])
      );
    });
    
    if (applicablePatterns.length === 0) {
      return {
        event: "Continued organic growth",
        probability: 0.8,
        timeframe: 3600000 // 1 hour
      };
    }
    
    // Return highest probability pattern
    const bestPattern = applicablePatterns.sort((a, b) => b.probability - a.probability)[0];
    return {
      event: bestPattern.outcome,
      probability: bestPattern.probability,
      timeframe: bestPattern.timeToEffect
    };
  }
  
  predictGrowthTrajectory(metric: string, timeHorizon: number): number[] {
    const curve = this.model.growthCurves.get(metric);
    if (!curve) return [];
    
    const predictions: number[] = [];
    const steps = 10;
    const stepSize = timeHorizon / steps;
    
    for (let i = 1; i <= steps; i++) {
      const t = i * stepSize;
      let value = 0;
      
      switch (curve.type) {
        case 'exponential':
          value = Math.exp(curve.parameters[0] * t);
          break;
        case 'logistic':
          value = 100 / (1 + Math.exp(-curve.parameters[0] * t));
          break;
        case 'oscillating':
          value = Math.sin(curve.parameters[0] * t) * 50 + 50;
          break;
        case 'chaotic':
          value = Math.random() * 100; // Simplified chaos
          break;
      }
      
      predictions.push(value);
    }
    
    return predictions;
  }
}

// Train the model
if (import.meta.main) {
  const analyzer = new PatternAnalyzer();
  const chroniclesPath = join(
    Deno.env.get("HOME") || "",
    "fractal-hub/garden/observatory/timeline/chronicles/garden-chronicles.json"
  );
  
  await analyzer.train(chroniclesPath);
  
  const outputPath = join(
    Deno.env.get("HOME") || "",
    "fractal-hub/garden/observatory/predictive-engine/prediction-model.json"
  );
  
  await analyzer.save(outputPath);
  
  console.log("\n🔮 Predictive model created!");
  console.log("   Model saved to:", outputPath);
  
  // Test prediction
  const testState = {
    recentEvents: [{ description: "New seed planted" }]
  };
  
  const prediction = analyzer.predictNextEvent(testState);
  console.log("\n📊 Test Prediction:");
  console.log(`   Next likely event: ${prediction.event}`);
  console.log(`   Probability: ${(prediction.probability * 100).toFixed(0)}%`);
  console.log(`   Expected in: ${(prediction.timeframe / 60000).toFixed(0)} minutes`);
}