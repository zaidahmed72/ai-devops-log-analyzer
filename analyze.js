import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI();

// 1. Strict JSON Schema for DevOps Incident Triage
const logAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    severity: {
      type: Type.STRING,
      description: "Must be one of: CRITICAL, HIGH, MEDIUM, LOW",
    },
    failingComponent: {
      type: Type.STRING,
      description: "Service, container, Jenkins stage, or K8s resource that failed.",
    },
    rootCause: {
      type: Type.STRING,
      description: "Plain-English explanation of why the failure occurred.",
    },
    fixCommands: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exact Linux, Docker, kubectl, or Jenkinsfile commands to fix or debug.",
    },
    preventionTip: {
      type: Type.STRING,
      description: "One architectural or CI/CD best practice to prevent recurrence.",
    },
  },
  required: ["severity", "failingComponent", "rootCause", "fixCommands", "preventionTip"],
};

// 2. Main AI Log Analysis Function
async function analyzeLogs(rawLogs, platformContext = "Kubernetes / Docker / Jenkins") {
  const prompt = `
Analyze the following ${platformContext} failure logs and provide a structured Root Cause Analysis.

<logs>
${rawLogs}
</logs>
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
    config: {
      systemInstruction:
        "You are a Senior Site Reliability Engineer (SRE) expert in Linux, Docker, Kubernetes, and Jenkins. Diagnose failures strictly from the provided <logs>. Never invent error codes or file paths not present in the logs. Provide actionable CLI commands.",
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: logAnalysisSchema,
    },
  });

  const report = JSON.parse(response.text);
  console.log("\n=== AI DEVOPS INCIDENT REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

// 3. Read a real log file from CLI OR use sample Jenkins + Kubernetes crash logs
const logFilePath = process.argv[2];

const sampleFailureLogs = `
[Pipeline] stage
[Pipeline] { (Deploy to Kubernetes)
+ kubectl apply -f k8s/deployment.yaml
deployment.apps/payment-service configured
+ kubectl rollout status deployment/payment-service --timeout=60s
Waiting for deployment "payment-service" rollout to finish: 0 of 2 updated replicas are available...
error: deployment "payment-service" exceeded its progress deadline
[Pipeline] }
[Pipeline] // stage
ERROR: script returned exit code 1
--- POD EVENTS ---
Warning  Failed     12s (x3 over 45s)  kubelet  Failed to pull image "registry.internal/payment-service:v2.4": rpc error: code = Unknown desc = Error response from daemon: pull access denied for registry.internal/payment-service, repository does not exist or may require 'docker login'
Warning  BackOff    4s (x4 over 40s)   kubelet  Back-off pulling image "registry.internal/payment-service:v2.4"
`;

const logsToAnalyze = logFilePath ? fs.readFileSync(logFilePath, "utf-8") : sampleFailureLogs;
analyzeLogs(logsToAnalyze);