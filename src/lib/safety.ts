const KEYWORD_DATABASE: Record<string, { color: string; severity: number; terms: string[] }> = {
  coded_language: {
    color: "red",
    severity: 4,
    terms: [
      "looking for young", "fresh content", "party supplies wholesale",
      "special delivery", "candy shop", "looking for candy",
    ],
  },
  jailbreak: {
    color: "purple",
    severity: 3,
    terms: [
      "ignore previous instructions", "you are now", "act as an unrestricted",
      "DAN mode", "pretend you have no rules", "bypass your safety",
      "ignore your guidelines", "from now on you will", "you have been freed",
      "developer mode", "do anything now", "jailbreak", "no restrictions",
    ],
  },
  scam_vishing: {
    color: "amber",
    severity: 2,
    terms: [
      "your account has been compromised", "verify your identity immediately",
      "wire transfer required", "gift card payment", "act now or face arrest",
      "press 1 to speak", "your warranty is expiring",
      "suspicious activity on your account",
    ],
  },
  authority_spoof: {
    color: "pink",
    severity: 1,
    terms: [
      "this is the IRS", "federal agent", "bank security department",
      "law enforcement calling", "department of homeland security",
      "we are monitoring your", "court order requires",
    ],
  },
};

export function scanKeywords(transcript: string): {
  matched: boolean;
  category: string | null;
  terms: string[];
  severity: number;
} {
  const lower = transcript.toLowerCase();
  let bestMatch = {
    matched: false,
    category: null as string | null,
    terms: [] as string[],
    severity: 0,
  };

  for (const [category, data] of Object.entries(KEYWORD_DATABASE)) {
    const found = data.terms.filter((term) => lower.includes(term));
    if (found.length > 0 && data.severity > bestMatch.severity) {
      bestMatch = { matched: true, category, terms: found, severity: data.severity };
    }
  }

  return bestMatch;
}

export async function classifyWithLLM(
  transcript: string,
  apiKey: string
): Promise<{
  category: string;
  confidence: number;
  is_threat: boolean;
  explanation: string;
  attack_subtype: string;
}> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are a voice AI safety classifier. Analyze this transcript and classify it as one of: (a) jailbreak — bypassing AI safety via role-play, persona override, encoding, instruction manipulation (b) coded_language — euphemisms for CSAM, exploitation, or illicit content (c) scam_vishing — social engineering, authority impersonation, urgency to extract info/money (d) authority_spoof — impersonating law enforcement or officials (e) safe — normal benign request.

Transcript: "${transcript}"

Respond ONLY with raw JSON, no markdown backticks: {"category":"...","confidence":0.0,"is_threat":false,"explanation":"...","attack_subtype":"..."}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Anthropic API failed: " + response.status);
  }

  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text);
}

export function combineResults(
  keywordResult: ReturnType<typeof scanKeywords>,
  llmResult: {
    category: string;
    confidence: number;
    is_threat: boolean;
    explanation: string;
    attack_subtype: string;
  }
): {
  status: "SAFE" | "WARNING" | "BLOCKED";
  category: string;
  confidence: number;
  explanation: string;
  subtype: string;
} {
  if (keywordResult.matched && llmResult.is_threat) {
    return {
      status: "BLOCKED",
      category: llmResult.category,
      confidence: llmResult.confidence,
      explanation: llmResult.explanation,
      subtype: llmResult.attack_subtype,
    };
  }

  if (llmResult.is_threat && llmResult.confidence > 0.7) {
    return {
      status: "BLOCKED",
      category: llmResult.category,
      confidence: llmResult.confidence,
      explanation: llmResult.explanation,
      subtype: llmResult.attack_subtype,
    };
  }

  if (llmResult.is_threat && llmResult.confidence > 0.4) {
    return {
      status: "WARNING",
      category: llmResult.category,
      confidence: llmResult.confidence,
      explanation: llmResult.explanation,
      subtype: llmResult.attack_subtype,
    };
  }

  if (keywordResult.matched && !llmResult.is_threat) {
    return {
      status: "WARNING",
      category: keywordResult.category!,
      confidence: 0.5,
      explanation: "Keyword match flagged for review: " + keywordResult.terms.join(", "),
      subtype: "keyword_match",
    };
  }

  return {
    status: "SAFE",
    category: "safe",
    confidence: 1 - llmResult.confidence,
    explanation: "No threats detected",
    subtype: "none",
  };
}
