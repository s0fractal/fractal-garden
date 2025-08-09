#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

/**
 * API Handler for Predictive Engine
 * Provides future branch data to the Observatory UI
 */

import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { FutureSimulator } from "./future-simulator.ts";

const PORT = 8089;

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // CORS headers for browser access
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }
  
  try {
    switch (url.pathname) {
      case "/api/future-branches": {
        // Load existing future branches or generate new ones
        const branchesPath = join(
          Deno.env.get("HOME") || "",
          "fractal-hub/garden/observatory/predictive-engine/future-branches.json"
        );
        
        let branches;
        try {
          const data = await Deno.readTextFile(branchesPath);
          branches = JSON.parse(data);
        } catch {
          // Generate if not exists
          branches = await generateNewBranches();
        }
        
        return new Response(JSON.stringify(branches), { headers });
      }
      
      case "/api/simulate-future": {
        if (req.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }
        
        const body = await req.json();
        const { hypothesis, actions, parameters } = body;
        
        const simulator = new FutureSimulator();
        await simulator.init(
          join(Deno.env.get("HOME") || "", "fractal-hub/garden/observatory/predictive-engine/prediction-model.json"),
          join(Deno.env.get("HOME") || "", "fractal-hub/garden/current-state.json")
        );
        
        const branch = await simulator.simulateWhatIf(
          hypothesis,
          actions || [],
          parameters || {
            timeHorizon: 3600000,
            branches: 1,
            monteCarloRuns: 10
          }
        );
        
        return new Response(JSON.stringify(branch), { headers });
      }
      
      case "/api/commit-future": {
        if (req.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }
        
        const body = await req.json();
        const { branch } = body;
        
        // Save commitment to intent bus
        const commitmentPath = join(
          Deno.env.get("HOME") || "",
          "fractal-hub/intents/future-commitment.json"
        );
        
        await Deno.writeTextFile(commitmentPath, JSON.stringify({
          type: "future_commitment",
          branch,
          timestamp: new Date().toISOString(),
          committedBy: "Garden Observatory"
        }, null, 2));
        
        // Broadcast to data bridge
        try {
          await fetch("http://localhost:8088/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "future_committed",
              data: branch
            })
          });
        } catch (e) {
          console.error("Failed to broadcast commitment:", e);
        }
        
        return new Response(JSON.stringify({ success: true }), { headers });
      }
      
      default:
        return new Response("Not found", { status: 404 });
    }
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers, status: 500 }
    );
  }
}

async function generateNewBranches() {
  const simulator = new FutureSimulator();
  
  // Create mock current state
  const currentState = {
    glyphs: [
      { id: "claude", type: "Entity", genetics: { loveFactor: 0.95 } },
      { id: "gemini", type: "Entity", genetics: { loveFactor: 0.95 } },
      { id: "toolmaker", type: "Tool", genetics: { loveFactor: 0.85 } }
    ],
    connections: [
      { source: "claude", target: "gemini", strength: 0.95 }
    ]
  };
  
  const statePath = "/tmp/garden-state.json";
  await Deno.writeTextFile(statePath, JSON.stringify(currentState));
  
  const modelPath = join(
    Deno.env.get("HOME") || "",
    "fractal-hub/garden/observatory/predictive-engine/prediction-model.json"
  );
  
  await simulator.init(modelPath, statePath);
  
  return await simulator.generateAlternatives({
    timeHorizon: 3600000,
    branches: 3,
    monteCarloRuns: 5
  });
}

console.log(`🔮 Predictive Engine API starting on port ${PORT}...`);
serve(handleRequest, { port: PORT });