# AI DevOps Log Analyzer (CLI)

An automated Root Cause Analysis (RCA) CLI tool built with Node.js, Docker, and the Google Gemini API to diagnose Linux, Docker, Kubernetes, and Jenkins failure logs.

## Features
- Structured JSON Outputs (responseSchema)
- Prompt Injection Defense via XML delimiters
- Anti-Hallucination SRE System Guardrails (temperature: 0.1)

## Run
npm install && node analyze.js
