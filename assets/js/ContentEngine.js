/**
 * ContentEngine.js — AI Coding Academy
 * Data-driven routing, content rendering, search, and progress tracking.
 * Supports 100,000+ tutorials via JSON data + single template pages.
 * No framework dependencies — vanilla JS only.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CE_CONFIG = {
  dataRoot:     '/assets/data/',
  templateLesson:  '/learn/lesson.html',
  templateProject: '/learn/project.html',
  storageKey:   'ace_progress_v2',
  searchIndex:  null,          // built lazily
  version:      '2.0.0',
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. URL PARAMETER ROUTER
// Reads ?id=transformer-basics&track=foundations
// Dispatches to the appropriate renderer.
// ─────────────────────────────────────────────────────────────────────────────

const Router = {
  params: null,

  init() {
    this.params = new URLSearchParams(window.location.search);
    return this;
  },

  get(key) {
    return this.params ? this.params.get(key) : null;
  },

  /** Called on lesson.html and project.html to hydrate the page. */
  async dispatch() {
    const id   = this.get('id');
    const type = this.get('type') || 'lesson';   // 'lesson' | 'project'

    if (!id) {
      Renderer.showError('No content ID supplied. Please use a valid tutorial link.');
      return;
    }

    try {
      const data = await DataLoader.fetchContent(id, type);
      if (!data) {
        Renderer.showError(`Content "${id}" not found. It may have moved or is coming soon.`);
        return;
      }
      if (type === 'project') {
        Renderer.renderProject(data);
      } else {
        Renderer.renderLesson(data);
      }
      Progress.markVisited(id);
      Sidebar.init(data);
    } catch (err) {
      console.error('[ContentEngine] dispatch error:', err);
      Renderer.showError('Failed to load content. Please check your connection and try again.');
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. DATA LOADER
// Fetches JSON data files. Falls back to inline CURRICULUM for instant load.
// ─────────────────────────────────────────────────────────────────────────────

const DataLoader = {
  _cache: new Map(),

  async fetchContent(id, type = 'lesson') {
    const cacheKey = `${type}:${id}`;
    if (this._cache.has(cacheKey)) return this._cache.get(cacheKey);

    // 1. Check inline CURRICULUM first (zero network cost)
    const inline = CURRICULUM.findById(id);
    if (inline) {
      this._cache.set(cacheKey, inline);
      return inline;
    }

    // 2. Try individual JSON file
    try {
      const url = `${CE_CONFIG.dataRoot}${type}s/${id}.json`;
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const data = await resp.json();
      this._cache.set(cacheKey, data);
      return data;
    } catch {
      return null;
    }
  },

  async fetchTrack(trackId) {
    const cacheKey = `track:${trackId}`;
    if (this._cache.has(cacheKey)) return this._cache.get(cacheKey);

    // Check inline
    const track = CURRICULUM.tracks.find(t => t.id === trackId);
    if (track) {
      this._cache.set(cacheKey, track);
      return track;
    }

    try {
      const url = `${CE_CONFIG.dataRoot}tracks/${trackId}.json`;
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const data = await resp.json();
      this._cache.set(cacheKey, data);
      return data;
    } catch {
      return null;
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. MASTER CURRICULUM DATA (inline — zero network latency)
// 4-Tier Hierarchy:
//   Tier 1 — Foundations       (Python, APIs, basics)
//   Tier 2 — ML Core           (sklearn, training, evaluation)
//   Tier 3 — Deep Learning     (PyTorch, Transformers, attention)
//   Tier 4 — Modern AI/Agents  (LLMs, RAG, Agents, fine-tuning)
// ─────────────────────────────────────────────────────────────────────────────

const CURRICULUM = {
  tracks: [
    {
      id: 'foundations',
      tier: 1,
      title: 'Foundations',
      subtitle: 'Python, APIs & the AI Toolkit',
      icon: '🧱',
      color: 'var(--level-beginner)',
      description: 'Everything you need before touching a model. Python proficiency, environment setup, HTTP/REST APIs, JSON handling, and async programming.',
      lessons: [
        {
          id: 'python-for-ai',
          title: 'Python for AI Development',
          desc: 'Python refresher focused on patterns used in ML/AI code: generators, context managers, type hints, dataclasses.',
          duration: '25 min',
          badge: 'Beginner',
          sections: [
            { h2: 'Why Python Dominates AI', body: 'Python owns AI for three reasons: NumPy\'s C-backed arrays, a rich ecosystem (PyTorch, HuggingFace, LangChain), and readable syntax that matches mathematical notation. Over 90% of ML papers publish Python code.', code: null },
            { h2: 'Type Hints in Practice', body: 'Modern AI code uses type hints heavily — they catch bugs before runtime and make tool call schemas self-documenting.', code: { label: 'Python - type hints in AI code', src: 'from typing import TypedDict, Optional, Literal\nfrom dataclasses import dataclass\n\n# LLM message type (mirrors the OpenAI API schema)\nclass Message(TypedDict):\n    role: Literal["system", "user", "assistant", "tool"]\n    content: str\n\n# Structured config — better than dicts\n@dataclass\nclass ModelConfig:\n    model: str = "gpt-4o-mini"\n    temperature: float = 0.7\n    max_tokens: int = 1024\n    stream: bool = False\n\n    def to_api_kwargs(self) -> dict:\n        return {\n            "model": self.model,\n            "temperature": self.temperature,\n            "max_tokens": self.max_tokens,\n            "stream": self.stream,\n        }' } },
            { h2: 'Generators for Streaming', body: 'Streaming LLM responses arrive token-by-token. Python generators are the natural fit.', code: { label: 'Python - streaming with generators', src: 'from openai import OpenAI\nclient = OpenAI()\n\ndef stream_tokens(prompt: str):\n    """Yield tokens as they arrive from the API."""\n    with client.chat.completions.stream(\n        model="gpt-4o-mini",\n        messages=[{"role": "user", "content": prompt}]\n    ) as stream:\n        for event in stream:\n            chunk = event.choices[0].delta.content or ""\n            if chunk:\n                yield chunk\n\n# Usage — print live\nfor token in stream_tokens("Explain recursion briefly."):\n    print(token, end="", flush=True)\nprint()  # newline at end' } },
            { h2: 'Async/Await for Parallel Calls', body: 'Calling 10 LLMs in parallel takes the same time as calling 1 — if you use asyncio.', code: { label: 'Python - parallel API calls', src: 'import asyncio\nfrom openai import AsyncOpenAI\n\nasync_client = AsyncOpenAI()\n\nasync def summarize(text: str) -> str:\n    resp = await async_client.chat.completions.create(\n        model="gpt-4o-mini",\n        messages=[{"role": "user", "content": f"Summarize in 1 sentence: {text}"}]\n    )\n    return resp.choices[0].message.content\n\nasync def batch_summarize(texts: list[str]) -> list[str]:\n    # All 10 run in parallel — same time as 1\n    return await asyncio.gather(*[summarize(t) for t in texts])\n\nresults = asyncio.run(batch_summarize(["text1", "text2", "text3"]))' } },
          ],
          prev: null,
          next: 'openai-quickstart',
        },
        {
          id: 'openai-quickstart',
          title: 'OpenAI API: First Call to Production Patterns',
          desc: 'Install, authenticate, make your first call, handle errors, set timeouts, and build a retry wrapper.',
          duration: '30 min',
          badge: 'Beginner',
          sections: [
            { h2: 'Setup & First Call', body: 'Three steps: install, set env var, call the API.', code: { label: 'bash + Python - quickstart', src: 'pip install openai\nexport OPENAI_API_KEY="sk-proj-..."\n\n# ---\nfrom openai import OpenAI\nclient = OpenAI()  # reads OPENAI_API_KEY automatically\n\nresp = client.chat.completions.create(\n    model="gpt-4o-mini",\n    messages=[{"role": "user", "content": "What is 2+2?"}]\n)\nprint(resp.choices[0].message.content)  # "4"\nprint(f"Tokens used: {resp.usage.total_tokens}")' } },
            { h2: 'Understanding the Response Object', body: 'The API returns a ChatCompletion object. Key fields every production app reads.', code: { label: 'Python - response inspection', src: 'resp = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[{"role": "user", "content": "Hello"}]\n)\n\nprint(resp.id)                           # req ID for debugging\nprint(resp.model)                        # exact model version\nprint(resp.choices[0].message.content)  # the text\nprint(resp.choices[0].finish_reason)    # "stop" | "length" | "tool_calls"\nprint(resp.usage.prompt_tokens)         # tokens in\nprint(resp.usage.completion_tokens)     # tokens out\nprint(resp.usage.total_tokens)          # sum' } },
            { h2: 'Production Error Handling', body: 'API calls fail. Rate limits, network errors, timeouts — handle them all.', code: { label: 'Python - robust API wrapper', src: 'import time, random\nfrom openai import OpenAI, RateLimitError, APIStatusError, APITimeoutError\n\nclient = OpenAI(timeout=30.0, max_retries=0)  # handle retries ourselves\n\ndef call_llm(messages: list, model="gpt-4o-mini", max_retries=5) -> str:\n    for attempt in range(max_retries):\n        try:\n            resp = client.chat.completions.create(\n                model=model, messages=messages\n            )\n            return resp.choices[0].message.content\n        except RateLimitError:\n            wait = (2 ** attempt) + random.uniform(0, 1)  # jitter\n            print(f"Rate limited. Waiting {wait:.1f}s...")\n            time.sleep(min(wait, 60))\n        except APITimeoutError:\n            print(f"Timeout on attempt {attempt + 1}")\n            time.sleep(2 ** attempt)\n        except APIStatusError as e:\n            if e.status_code >= 500:  # server error — retry\n                time.sleep(2 ** attempt)\n            else:\n                raise  # 400s are our fault — don\'t retry\n    raise Exception("Max retries exceeded")' } },
          ],
          prev: 'python-for-ai',
          next: 'environment-setup',
        },
        {
          id: 'environment-setup',
          title: 'Environment Setup: .env, Virtual Envs & Docker',
          desc: 'Manage secrets safely, isolate dependencies, and containerize AI apps.',
          duration: '20 min',
          badge: 'Beginner',
          sections: [
            { h2: 'Managing API Keys Safely', body: 'The single most important security practice: never hardcode keys.', code: { label: 'bash + Python - safe key management', src: '# 1. Create .env file (never commit this)\necho "OPENAI_API_KEY=sk-proj-..." > .env\necho "ANTHROPIC_API_KEY=sk-ant-..." >> .env\necho ".env" >> .gitignore   # CRITICAL\n\n# 2. Load in Python\nfrom dotenv import load_dotenv\nimport os\n\nload_dotenv()  # loads .env from current directory\n\nOPENAI_KEY = os.environ.get("OPENAI_API_KEY")\nif not OPENAI_KEY:\n    raise EnvironmentError("OPENAI_API_KEY not set. Run: export OPENAI_API_KEY=\'sk-...\'")\n\nprint(OPENAI_KEY[:8] + "...")  # safe to print prefix' } },
            { h2: 'Virtual Environments', body: 'Always isolate AI project dependencies — library versions conflict constantly.', code: { label: 'bash - venv setup', src: '# Create and activate\npython3 -m venv .venv\nsource .venv/bin/activate  # Linux/Mac\n# .venv\\Scripts\\activate   # Windows\n\n# Install and freeze\npip install openai anthropic langchain chromadb\npip freeze > requirements.txt\n\n# requirements.txt for reproducibility:\n# openai==1.52.0\n# anthropic==0.39.0\n# langchain==0.3.7' } },
            { h2: 'Docker for AI Apps', body: 'Containers eliminate "works on my machine" — critical for deploying AI services.', code: { label: 'Dockerfile - production AI service', src: '# Multi-stage: builder installs deps, runtime is lean\nFROM python:3.12-slim AS builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --user --no-cache-dir -r requirements.txt\n\nFROM python:3.12-slim AS runtime\nWORKDIR /app\nCOPY --from=builder /root/.local /root/.local\nCOPY src/ ./src/\nENV PATH=/root/.local/bin:$PATH\nENV PYTHONUNBUFFERED=1\nUSER nobody                      # never run as root\nEXPOSE 8000\nCMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]' } },
          ],
          prev: 'openai-quickstart',
          next: 'api-fundamentals',
        },
        {
          id: 'api-fundamentals',
          title: 'REST API Fundamentals for AI Engineers',
          desc: 'HTTP methods, headers, status codes, JSON — everything AI SDKs abstract but you must understand.',
          duration: '20 min',
          badge: 'Beginner',
          sections: [
            { h2: 'HTTP Under the Hood', body: 'Every AI SDK is HTTP. Understanding the wire protocol helps you debug production issues.', code: { label: 'Python - raw API call (no SDK)', src: 'import httpx, os, json\n\n# What openai.chat.completions.create() does internally:\nresp = httpx.post(\n    "https://api.openai.com/v1/chat/completions",\n    headers={\n        "Authorization": f"Bearer {os.environ[\'OPENAI_API_KEY\']}",\n        "Content-Type": "application/json",\n    },\n    json={\n        "model": "gpt-4o-mini",\n        "messages": [{"role": "user", "content": "Hello"}]\n    },\n    timeout=30.0\n)\n\nif resp.status_code == 200:\n    data = resp.json()\n    print(data["choices"][0]["message"]["content"])\nelif resp.status_code == 429:\n    print("Rate limited:", resp.headers.get("retry-after"))\nelif resp.status_code == 401:\n    print("Bad API key")\nelse:\n    print(f"Error {resp.status_code}:", resp.text)' } },
            { h2: 'Status Codes You Will See', body: 'Every AI API returns these. Know what to do with each.', code: { label: 'Text - status codes reference', src: '200 OK              → success, parse response\n400 Bad Request     → your JSON is malformed, check params\n401 Unauthorized    → wrong/missing API key\n403 Forbidden       → key lacks permission for this endpoint\n404 Not Found       → wrong model name or endpoint URL\n422 Unprocessable   → valid JSON but invalid values (e.g. temp > 2.0)\n429 Too Many Req    → rate limited, check Retry-After header\n500 Internal Error  → provider side, retry with backoff\n503 Unavailable     → provider down, retry later' } },
          ],
          prev: 'environment-setup',
          next: 'transformer-architecture',
        },
      ],
    },
    {
      id: 'deep-learning',
      tier: 3,
      title: 'Deep Learning',
      subtitle: 'Neural Networks, Transformers & Attention',
      icon: '🧠',
      color: 'var(--accent-tertiary)',
      description: 'Build intuition for the math and architecture behind every modern AI model. Attention mechanisms, positional encoding, backpropagation, and why scaling laws work.',
      lessons: [
        {
          id: 'transformer-architecture',
          title: 'Transformer Architecture: The Math Behind Every LLM',
          desc: 'Attention is All You Need — explained with code. Q, K, V matrices, multi-head attention, positional encoding, and feedforward layers.',
          duration: '45 min',
          badge: 'Advanced',
          sections: [
            { h2: 'Why Transformers Replaced RNNs', body: 'RNNs processed sequences token-by-token — slow, and long-range dependencies were lost. Transformers process ALL tokens in parallel and use attention to relate any token to any other, regardless of distance.', code: null },
            { h2: 'The Attention Mechanism — Core Math', body: 'Attention computes a weighted sum: for each token, how much should it "attend to" every other token? The weights come from dot products between Query and Key vectors, scaled and softmaxed.', code: { label: 'Python + NumPy - self-attention from scratch', src: 'import numpy as np\n\ndef scaled_dot_product_attention(Q, K, V):\n    """\n    Q: (seq_len, d_k) - Queries\n    K: (seq_len, d_k) - Keys  \n    V: (seq_len, d_v) - Values\n    Returns: (seq_len, d_v) attended values\n    """\n    d_k = Q.shape[-1]\n    \n    # Step 1: Compute attention scores — how much does each Q match each K?\n    scores = Q @ K.T          # (seq_len, seq_len)\n    \n    # Step 2: Scale — prevents vanishing gradients with large d_k\n    scores = scores / np.sqrt(d_k)\n    \n    # Step 3: Softmax — convert scores to probabilities\n    exp_scores = np.exp(scores - scores.max(axis=-1, keepdims=True))\n    attn_weights = exp_scores / exp_scores.sum(axis=-1, keepdims=True)\n    \n    # Step 4: Weighted sum of Values\n    output = attn_weights @ V  # (seq_len, d_v)\n    \n    return output, attn_weights\n\n# Example: 4 tokens, d_k=64, d_v=64\nnp.random.seed(42)\nseq_len, d_model = 4, 64\n\n# Learned weight matrices (normally trained, here random)\nW_Q = np.random.randn(d_model, d_model) * 0.1\nW_K = np.random.randn(d_model, d_model) * 0.1\nW_V = np.random.randn(d_model, d_model) * 0.1\n\nx = np.random.randn(seq_len, d_model)  # token embeddings\nQ = x @ W_Q\nK = x @ W_K\nV = x @ W_V\n\noutput, weights = scaled_dot_product_attention(Q, K, V)\nprint(f"Output shape: {output.shape}")       # (4, 64)\nprint(f"Attention weights:\\n{weights.round(3)}")  # each row sums to 1.0' } },
            { h2: 'Multi-Head Attention', body: 'Running attention once only captures one type of relationship. Multi-head attention runs h independent attention operations in parallel and concatenates results — each head can specialize in different relationships (syntax, semantics, long-range dependencies).', code: { label: 'Python - multi-head attention', src: 'import numpy as np\n\ndef multi_head_attention(x, W_Q, W_K, W_V, W_O, num_heads=8):\n    """\n    x: (seq_len, d_model)\n    W_Q, W_K, W_V: (d_model, d_model) - linear projection weights\n    W_O: (d_model, d_model) - output projection\n    """\n    seq_len, d_model = x.shape\n    d_head = d_model // num_heads\n    \n    # Project Q, K, V\n    Q = x @ W_Q  # (seq_len, d_model)\n    K = x @ W_K\n    V = x @ W_V\n    \n    # Reshape for multi-head: (seq_len, num_heads, d_head)\n    Q = Q.reshape(seq_len, num_heads, d_head).transpose(1, 0, 2)  # (heads, seq, d_head)\n    K = K.reshape(seq_len, num_heads, d_head).transpose(1, 0, 2)\n    V = V.reshape(seq_len, num_heads, d_head).transpose(1, 0, 2)\n    \n    # Attention per head\n    d_k = d_head\n    scores = (Q @ K.transpose(0, 2, 1)) / np.sqrt(d_k)  # (heads, seq, seq)\n    weights = np.exp(scores) / np.exp(scores).sum(axis=-1, keepdims=True)\n    attended = weights @ V  # (heads, seq, d_head)\n    \n    # Concatenate heads\n    attended = attended.transpose(1, 0, 2).reshape(seq_len, d_model)\n    \n    # Final output projection\n    return attended @ W_O\n\nseq_len, d_model = 6, 512\nx = np.random.randn(seq_len, d_model)\nW_Q = np.random.randn(d_model, d_model) * 0.02\nW_K = np.random.randn(d_model, d_model) * 0.02\nW_V = np.random.randn(d_model, d_model) * 0.02\nW_O = np.random.randn(d_model, d_model) * 0.02\n\nout = multi_head_attention(x, W_Q, W_K, W_V, W_O, num_heads=8)\nprint(f"Output: {out.shape}")  # (6, 512)' } },
            { h2: 'Positional Encoding', body: 'Transformers have no built-in sense of order — without positional encoding, "cat sat mat" and "mat sat cat" are identical. Sinusoidal encodings inject position information.', code: { label: 'Python - sinusoidal positional encoding', src: 'import numpy as np\nimport matplotlib\nmatplotlib.use("Agg")  # headless\nimport matplotlib.pyplot as plt\n\ndef positional_encoding(max_len: int, d_model: int) -> np.ndarray:\n    """\n    Returns: (max_len, d_model) positional encodings\n    PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))\n    PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))\n    """\n    pos = np.arange(max_len)[:, np.newaxis]      # (max_len, 1)\n    i   = np.arange(d_model)[np.newaxis, :]      # (1, d_model)\n    \n    # Denominator: 10000^(2i/d_model)\n    angle_rates = 1 / np.power(10000, (2 * (i // 2)) / d_model)\n    angles = pos * angle_rates                    # (max_len, d_model)\n    \n    # Even indices: sin, Odd indices: cos\n    angles[:, 0::2] = np.sin(angles[:, 0::2])\n    angles[:, 1::2] = np.cos(angles[:, 1::2])\n    \n    return angles\n\npe = positional_encoding(max_len=50, d_model=128)\nprint(f"PE shape: {pe.shape}")  # (50, 128)\nprint(f"Token 0, first 8 dims: {pe[0, :8].round(3)}")\nprint(f"Token 1, first 8 dims: {pe[1, :8].round(3)}")' } },
            { h2: 'The Complete Transformer Block', body: 'Each transformer layer: multi-head attention → add & norm → feedforward → add & norm. Modern LLMs stack 12-96 of these blocks.', code: { label: 'Python (PyTorch) - transformer encoder block', src: 'import torch\nimport torch.nn as nn\n\nclass TransformerBlock(nn.Module):\n    """\n    One transformer encoder block:\n    MultiHeadAttention → Add&Norm → FeedForward → Add&Norm\n    """\n    def __init__(self, d_model=512, num_heads=8, d_ff=2048, dropout=0.1):\n        super().__init__()\n        self.attention = nn.MultiheadAttention(\n            d_model, num_heads, dropout=dropout, batch_first=True\n        )\n        self.norm1 = nn.LayerNorm(d_model)\n        self.norm2 = nn.LayerNorm(d_model)\n        # Feedforward: expand 4x then project back (standard)\n        self.ff = nn.Sequential(\n            nn.Linear(d_model, d_ff),\n            nn.GELU(),              # GELU is standard in modern LLMs\n            nn.Dropout(dropout),\n            nn.Linear(d_ff, d_model),\n            nn.Dropout(dropout),\n        )\n\n    def forward(self, x):\n        # Self-attention with residual connection\n        attended, _ = self.attention(x, x, x)\n        x = self.norm1(x + attended)      # Add & Norm\n        # Feedforward with residual\n        x = self.norm2(x + self.ff(x))    # Add & Norm\n        return x\n\n# Test it\nblock = TransformerBlock(d_model=512, num_heads=8)\nbatch, seq_len = 2, 16\nx = torch.randn(batch, seq_len, 512)\nout = block(x)\nprint(f"Input:  {x.shape}")   # [2, 16, 512]\nprint(f"Output: {out.shape}") # [2, 16, 512] — same shape, richer representation' } },
          ],
          prev: 'api-fundamentals',
          next: 'rlhf-deep-dive',
        },
        {
          id: 'rlhf-deep-dive',
          title: 'RLHF, DPO & How LLMs Are Aligned',
          desc: 'Understand Reinforcement Learning from Human Feedback, reward modeling, PPO, and Direct Preference Optimization.',
          duration: '40 min',
          badge: 'Advanced',
          sections: [
            { h2: 'Why Pre-training Alone Is Not Enough', body: 'A raw pre-trained LLM predicts the next token. It will predict harmful content if that\'s what follows statistically. Alignment (RLHF/DPO) teaches the model human preferences — helpful, harmless, honest.', code: null },
            { h2: 'The RLHF Pipeline', body: 'Three stages: supervised fine-tuning (SFT), reward model training, and PPO optimization.\n\nStage 1 — SFT: Fine-tune base model on high-quality demonstrations.\nStage 2 — Reward Model: Train a classifier that scores responses as "human-preferred" or not.\nStage 3 — PPO: Use RL to make the policy maximize the reward model\'s score.', code: { label: 'Python - reward model (simplified)', src: 'import torch\nimport torch.nn as nn\nfrom transformers import AutoModelForSequenceClassification, AutoTokenizer\n\n# Reward model = LLM with a scalar head instead of vocab head\nclass RewardModel(nn.Module):\n    def __init__(self, base_model_id="distilgpt2"):\n        super().__init__()\n        # Use a language model as the backbone\n        self.backbone = AutoModelForSequenceClassification.from_pretrained(\n            base_model_id,\n            num_labels=1,       # scalar reward score\n            ignore_mismatched_sizes=True\n        )\n        \n    def forward(self, input_ids, attention_mask=None):\n        outputs = self.backbone(input_ids, attention_mask=attention_mask)\n        reward = outputs.logits.squeeze(-1)  # scalar per sequence\n        return reward\n\n# Preference learning: given (chosen, rejected) pairs\ndef reward_model_loss(reward_chosen, reward_rejected):\n    """\n    Bradley-Terry model: probability that chosen > rejected.\n    Loss = -log σ(r_chosen - r_rejected)\n    """\n    diff = reward_chosen - reward_rejected\n    loss = -torch.log(torch.sigmoid(diff)).mean()\n    return loss\n\n# Simulate training step\nmodel = RewardModel()\ntokenizer = AutoTokenizer.from_pretrained("distilgpt2")\ntokenizer.pad_token = tokenizer.eos_token\n\nprompt = "Explain photosynthesis"\nchosen  = prompt + "\\nPlants convert sunlight to glucose via chlorophyll."\nrejected = prompt + "\\nI dunno, plants do stuff with sun I guess."\n\ntok_c = tokenizer(chosen,  return_tensors="pt", truncation=True, max_length=64)\ntok_r = tokenizer(rejected, return_tensors="pt", truncation=True, max_length=64)\n\nwith torch.no_grad():\n    r_c = model(**tok_c)\n    r_r = model(**tok_r)\n\nprint(f"Chosen reward:   {r_c.item():.3f}")\nprint(f"Rejected reward: {r_r.item():.3f}")\nprint(f"Preference loss: {reward_model_loss(r_c, r_r).item():.3f}")' } },
            { h2: 'DPO: Direct Preference Optimization', body: 'PPO is complex and unstable. DPO (Rafailov et al., 2023) eliminates the reward model entirely — it directly optimizes the policy on preference pairs. This is what most modern fine-tuning uses.', code: { label: 'Python - DPO loss function', src: 'import torch\nimport torch.nn.functional as F\n\ndef dpo_loss(\n    policy_logps_chosen:   torch.Tensor,  # log probs of chosen under policy\n    policy_logps_rejected: torch.Tensor,  # log probs of rejected under policy\n    ref_logps_chosen:      torch.Tensor,  # log probs under reference model\n    ref_logps_rejected:    torch.Tensor,  # log probs under reference model\n    beta: float = 0.1\n) -> torch.Tensor:\n    """\n    DPO loss (Rafailov et al., 2023)\n    Directly optimizes policy to prefer chosen over rejected\n    without an explicit reward model.\n    \n    beta controls KL divergence penalty from reference model.\n    Lower beta = more divergence allowed.\n    """\n    # Implicit reward: difference between policy and reference log probs\n    chosen_rewards   = beta * (policy_logps_chosen   - ref_logps_chosen)\n    rejected_rewards = beta * (policy_logps_rejected - ref_logps_rejected)\n    \n    # Loss: maximize P(chosen > rejected)\n    loss = -F.logsigmoid(chosen_rewards - rejected_rewards).mean()\n    \n    # Useful metrics\n    accuracy = (chosen_rewards > rejected_rewards).float().mean()\n    margin   = (chosen_rewards - rejected_rewards).mean()\n    \n    return loss, accuracy, margin\n\n# Simulate\nbatch_size = 4\npol_c  = torch.tensor([-2.1, -1.8, -2.5, -1.9])\npol_r  = torch.tensor([-3.2, -2.9, -3.8, -3.1])\nref_c  = torch.tensor([-2.0, -1.9, -2.4, -2.0])  # frozen reference\nref_r  = torch.tensor([-3.0, -2.8, -3.6, -3.0])\n\nloss, acc, margin = dpo_loss(pol_c, pol_r, ref_c, ref_r, beta=0.1)\nprint(f"DPO loss:   {loss:.4f}")\nprint(f"Accuracy:   {acc:.2%}  (fraction where chosen > rejected)")\nprint(f"Avg margin: {margin:.4f}")' } },
          ],
          prev: 'transformer-architecture',
          next: 'quantization-guide',
        },
        {
          id: 'quantization-guide',
          title: 'Quantization: Run 70B Models on Consumer Hardware',
          desc: 'INT8, INT4, GGUF, bitsandbytes, and GPTQ explained. When to quantize and what you lose.',
          duration: '35 min',
          badge: 'Advanced',
          sections: [
            { h2: 'What Is Quantization?', body: 'Models store weights as 32-bit floats by default. Quantization reduces precision to 8-bit (INT8) or 4-bit (INT4), cutting memory by 4-8x with minimal quality loss. A 70B FP16 model needs 140GB VRAM. Quantized to 4-bit: 35GB — fits on 2× A100s or even a Mac Studio.', code: { label: 'Python - quantization comparison', src: '# Memory requirements by precision\nPARAMS = 70_000_000_000  # 70B parameters\n\nmemory = {\n    "FP32  (32-bit)": PARAMS * 4 / 1e9,\n    "FP16  (16-bit)": PARAMS * 2 / 1e9,\n    "INT8  (8-bit) ": PARAMS * 1 / 1e9,\n    "INT4  (4-bit) ": PARAMS * 0.5 / 1e9,\n    "INT2  (2-bit) ": PARAMS * 0.25 / 1e9,\n}\n\nfor precision, gb in memory.items():\n    bar = "█" * int(gb / 10)\n    print(f"{precision}: {gb:6.1f} GB  {bar}")\n\n# Output:\n# FP32  (32-bit): 280.0 GB  ████████████████████████████\n# FP16  (16-bit): 140.0 GB  ██████████████\n# INT8  (8-bit) :  70.0 GB  ███████\n# INT4  (4-bit) :  35.0 GB  ███\n# INT2  (2-bit) :  17.5 GB  █' } },
            { h2: 'BitsAndBytes 4-bit Quantization', body: 'The easiest way to load large models in 4-bit precision using the bitsandbytes library.', code: { label: 'Python - 4-bit model loading', src: 'from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig\nimport torch\n\n# 4-bit quantization config\nquant_config = BitsAndBytesConfig(\n    load_in_4bit=True,\n    bnb_4bit_quant_type="nf4",          # NormalFloat4 — best for normal distributions\n    bnb_4bit_compute_dtype=torch.float16,\n    bnb_4bit_use_double_quant=True,      # quantize the quantization constants too\n)\n\nmodel = AutoModelForCausalLM.from_pretrained(\n    "meta-llama/Llama-3.2-8B-Instruct",\n    quantization_config=quant_config,\n    device_map="auto",                   # auto-split across GPUs if needed\n)\ntokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-8B-Instruct")\n\n# Check actual memory usage\nfor name, param in model.named_parameters():\n    if "weight" in name and hasattr(param, "quant_state"):\n        print(f"{name}: quantized to {param.quant_state.dtype}")\n        break\n\nprint(f"Model memory: ~{sum(p.numel() for p in model.parameters()) * 0.5 / 1e9:.1f} GB")\n# ~4GB for 8B model vs ~16GB in FP16' } },
            { h2: 'GGUF Format for CPU Inference', body: 'GGUF (the format llama.cpp uses) supports per-layer quantization and runs purely on CPU. Q4_K_M is the best quality/size tradeoff for most use cases.', code: { label: 'bash + Python - GGUF with llama.cpp Python', src: '# Install\npip install llama-cpp-python\n\n# Download GGUF model (example)\n# wget https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf\n\n# ---\nfrom llama_cpp import Llama\n\n# Q4_K_M = 4-bit K-quant, medium variant — best tradeoff\nllm = Llama(\n    model_path="./Llama-3.2-3B-Instruct-Q4_K_M.gguf",\n    n_ctx=4096,\n    n_threads=8,        # CPU threads\n    n_gpu_layers=0,     # 0 = CPU only; -1 = all layers on GPU\n    verbose=False\n)\n\noutput = llm.create_chat_completion(\n    messages=[{"role": "user", "content": "What is quantization?"}],\n    max_tokens=256,\n    temperature=0.7\n)\nprint(output["choices"][0]["message"]["content"])\n\n# GGUF quantization naming:\n# Q2_K  = 2.6 GB for 7B, low quality\n# Q4_K_M = 4.1 GB for 7B, good quality  ← RECOMMENDED\n# Q5_K_M = 5.0 GB for 7B, high quality\n# Q8_0  = 7.7 GB for 7B, near-lossless' } },
          ],
          prev: 'rlhf-deep-dive',
          next: 'rag-production',
        },
      ],
    },
    {
      id: 'modern-ai',
      tier: 4,
      title: 'Modern AI & Agents',
      subtitle: 'RAG, Agents, Fine-tuning & Production',
      icon: '🤖',
      color: 'var(--accent-secondary)',
      description: 'Production-grade RAG systems, autonomous agents, multi-agent orchestration, fine-tuning with LoRA, observability, and scaling to millions of users.',
      lessons: [
        {
          id: 'rag-production',
          title: 'Production RAG: From Prototype to Scale',
          desc: 'Beyond the basic RAG tutorial — chunking strategies, hybrid search, re-ranking, context window management, and evaluation.',
          duration: '50 min',
          badge: 'Advanced',
          sections: [
            { h2: 'Why Naive RAG Fails in Production', body: 'The beginner RAG pipeline (chunk → embed → retrieve → generate) breaks down at scale. Four failure modes: poor chunking loses context, semantic search misses keyword matches, too many retrieved docs overflow the context, and there\'s no way to measure quality.', code: null },
            { h2: 'Advanced Chunking Strategies', body: 'Chunk size is the most impactful RAG parameter. Too small loses context; too large dilutes relevance.', code: { label: 'Python - semantic chunking with LangChain', src: 'from langchain_experimental.text_splitter import SemanticChunker\nfrom langchain_openai import OpenAIEmbeddings\nfrom langchain.text_splitter import RecursiveCharacterTextSplitter\n\n# Strategy 1: Fixed recursive splitting (fast, good baseline)\nfixed_splitter = RecursiveCharacterTextSplitter(\n    chunk_size=800,\n    chunk_overlap=100,\n    separators=["\\n\\n", "\\n", ". ", " ", ""],\n)\n\n# Strategy 2: Semantic splitting (splits on meaning changes, slower)\nsemantic_splitter = SemanticChunker(\n    embeddings=OpenAIEmbeddings(model="text-embedding-3-small"),\n    breakpoint_threshold_type="percentile",\n    breakpoint_threshold_amount=95  # split at top 5% semantic breaks\n)\n\n# Strategy 3: Hierarchical — parent chunk for context, child for retrieval\nparent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)\nchild_splitter  = RecursiveCharacterTextSplitter(chunk_size=400,  chunk_overlap=50)\n\ntext = open("your_document.txt").read()\n\nfixed_chunks    = fixed_splitter.create_documents([text])\nprint(f"Fixed chunks: {len(fixed_chunks)}, avg size: {sum(len(c.page_content) for c in fixed_chunks) // len(fixed_chunks)} chars")' } },
            { h2: 'Hybrid Search: Semantic + BM25', body: 'Semantic search finds conceptually similar text. BM25 keyword search finds exact matches. Hybrid search combines both — essential for technical queries with specific terms (function names, error codes).', code: { label: 'Python - hybrid retrieval', src: 'from langchain.retrievers import BM25Retriever, EnsembleRetriever\nfrom langchain_community.vectorstores import FAISS\nfrom langchain_openai import OpenAIEmbeddings\nfrom langchain_core.documents import Document\n\n# Build both retrievers from same docs\ndocs = [Document(page_content=t) for t in [  # your actual docs\n    "Python asyncio handles concurrent I/O operations",\n    "FastAPI is built on top of Starlette and Pydantic",\n    "asyncio.gather() runs coroutines in parallel",\n]]\n\n# Semantic (vector) retriever\nvectorstore = FAISS.from_documents(docs, OpenAIEmbeddings())\nvector_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})\n\n# Keyword (BM25) retriever  \nbm25_retriever = BM25Retriever.from_documents(docs)\nbm25_retriever.k = 5\n\n# Hybrid — weights must sum to 1.0\nhybrid = EnsembleRetriever(\n    retrievers=[bm25_retriever, vector_retriever],\n    weights=[0.3, 0.7]   # 30% keyword, 70% semantic\n)\n\n# Test: a query with specific keyword\nresults = hybrid.invoke("asyncio.gather documentation")\nfor r in results:\n    print(f"  [{r.metadata.get(\'source\', \'doc\')}] {r.page_content[:80]}")' } },
            { h2: 'Re-ranking for Precision', body: 'Retrieval gets candidates. Re-ranking re-scores them using a cross-encoder (much more accurate than bi-encoder but slower). Use retrieval for recall, re-ranking for precision.', code: { label: 'Python - cross-encoder re-ranking', src: 'from sentence_transformers import CrossEncoder\nfrom langchain_core.documents import Document\n\n# Cross-encoder: takes (query, doc) pair and scores relevance\n# Much more accurate than cosine similarity\nreranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")\n\ndef rerank(query: str, docs: list[Document], top_k: int = 3) -> list[Document]:\n    """Re-rank retrieved docs by relevance to query."""\n    if not docs:\n        return []\n    \n    # Score all (query, doc) pairs\n    pairs = [(query, doc.page_content) for doc in docs]\n    scores = reranker.predict(pairs)\n    \n    # Sort by score descending\n    ranked = sorted(zip(scores, docs), key=lambda x: x[0], reverse=True)\n    \n    return [doc for _, doc in ranked[:top_k]]\n\n# Full RAG pipeline with re-ranking\ndef rag_with_reranking(query: str) -> str:\n    # Step 1: Retrieve broad candidates\n    candidates = hybrid.invoke(query)  # top 10\n    \n    # Step 2: Re-rank to find top 3 most relevant\n    top_docs = rerank(query, candidates, top_k=3)\n    \n    # Step 3: Build context and generate\n    context = "\\n\\n".join(d.page_content for d in top_docs)\n    messages = [\n        {"role": "system", "content": "Answer based only on the provided context."},\n        {"role": "user", "content": f"Context:\\n{context}\\n\\nQuestion: {query}"}\n    ]\n    \n    from openai import OpenAI\n    resp = OpenAI().chat.completions.create(model="gpt-4o", messages=messages)\n    return resp.choices[0].message.content' } },
          ],
          prev: 'quantization-guide',
          next: 'agent-systems',
        },
        {
          id: 'agent-systems',
          title: 'Agent Systems: Tool Use, Memory & Orchestration',
          desc: 'Build production-grade agents with structured tool calling, persistent memory, error recovery, and multi-agent coordination.',
          duration: '55 min',
          badge: 'Advanced',
          sections: [
            { h2: 'The Agent Loop', body: 'An agent is a loop: perceive state → LLM decides action → execute action → update state → repeat until done. The key invariants: always have a max_steps guard, always log every step, always handle tool failures gracefully.', code: { label: 'Python - production agent loop', src: 'from openai import OpenAI\nfrom dataclasses import dataclass, field\nfrom typing import Any\nimport json, logging, time\n\nlogger = logging.getLogger(__name__)\nclient = OpenAI()\n\n@dataclass\nclass AgentState:\n    goal: str\n    messages: list = field(default_factory=list)\n    step: int = 0\n    tool_calls_made: int = 0\n    start_time: float = field(default_factory=time.time)\n\nclass Agent:\n    def __init__(self, tools: list, tool_fns: dict,\n                 model="gpt-4o", max_steps=20, max_tool_calls=50):\n        self.tools = tools\n        self.tool_fns = tool_fns\n        self.model = model\n        self.max_steps = max_steps\n        self.max_tool_calls = max_tool_calls\n\n    def run(self, goal: str) -> str:\n        state = AgentState(goal=goal)\n        state.messages = [\n            {"role": "system", "content": "You are an expert agent. Use tools to accomplish the goal. Think step by step."},\n            {"role": "user", "content": goal}\n        ]\n\n        for step in range(self.max_steps):\n            state.step = step\n            logger.info(f"Step {step + 1}/{self.max_steps}")\n\n            if state.tool_calls_made >= self.max_tool_calls:\n                logger.warning("Tool call budget exhausted")\n                break\n\n            resp = client.chat.completions.create(\n                model=self.model,\n                messages=state.messages,\n                tools=self.tools,\n                tool_choice="auto"\n            )\n            msg = resp.choices[0].message\n            state.messages.append(msg)\n\n            if resp.choices[0].finish_reason == "stop":\n                logger.info(f"Agent completed in {step + 1} steps")\n                return msg.content\n\n            # Execute tool calls\n            for tc in msg.tool_calls or []:\n                result = self._execute_tool(tc, state)\n                state.messages.append({\n                    "role": "tool",\n                    "tool_call_id": tc.id,\n                    "content": result\n                })\n                state.tool_calls_made += 1\n\n        return "Max steps reached. Partial result: " + (state.messages[-1].get("content") or "")\n\n    def _execute_tool(self, tool_call, state: AgentState) -> str:\n        name = tool_call.function.name\n        logger.info(f"  Calling tool: {name}")\n        try:\n            args = json.loads(tool_call.function.arguments)\n            fn = self.tool_fns.get(name)\n            if not fn:\n                return json.dumps({"error": f"Unknown tool: {name}"})\n            result = fn(**args)\n            return json.dumps(result) if not isinstance(result, str) else result\n        except Exception as e:\n            logger.error(f"  Tool {name} failed: {e}")\n            return json.dumps({"error": str(e), "tool": name})' } },
            { h2: 'Persistent Memory with Vector Store', body: 'In-context memory is lost when conversation ends. Vector store memory persists facts across sessions.', code: { label: 'Python - persistent agent memory', src: 'from langchain_community.vectorstores import FAISS\nfrom langchain_openai import OpenAIEmbeddings\nfrom langchain_core.documents import Document\nfrom datetime import datetime\nimport os\n\nclass AgentMemory:\n    """Vector store-backed memory that persists across agent runs."""\n\n    def __init__(self, persist_path="./agent_memory"):\n        self.path = persist_path\n        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")\n        if os.path.exists(persist_path):\n            self.store = FAISS.load_local(\n                persist_path, self.embeddings,\n                allow_dangerous_deserialization=True\n            )\n            print(f"Loaded {self.store.index.ntotal} memories")\n        else:\n            # Bootstrap with an empty store\n            dummy = Document(page_content="Memory initialized", metadata={"type": "system"})\n            self.store = FAISS.from_documents([dummy], self.embeddings)\n            self.save()\n\n    def remember(self, fact: str, metadata: dict = None):\n        doc = Document(\n            page_content=fact,\n            metadata={**(metadata or {}), "timestamp": datetime.now().isoformat()}\n        )\n        self.store.add_documents([doc])\n        self.save()\n\n    def recall(self, query: str, k: int = 5) -> list[str]:\n        docs = self.store.similarity_search(query, k=k)\n        return [d.page_content for d in docs if d.metadata.get("type") != "system"]\n\n    def save(self):\n        self.store.save_local(self.path)\n\n# Usage\nmemory = AgentMemory()\nmemory.remember("User prefers Python over JavaScript")\nmemory.remember("User is building a customer support chatbot for an e-commerce site")\nmemory.remember("User has 5 years of experience with REST APIs")\n\ncontext = memory.recall("what is the user building?")\nprint("\\n".join(context))' } },
          ],
          prev: 'rag-production',
          next: 'lora-finetuning',
        },
        {
          id: 'lora-finetuning',
          title: 'LoRA Fine-tuning: Custom Models in 2 Hours',
          desc: 'Fine-tune Llama 3, Mistral, or Gemma on your own data using LoRA and QLoRA. Training, evaluation, and export to GGUF.',
          duration: '45 min',
          badge: 'Advanced',
          sections: [
            { h2: 'LoRA: Low-Rank Adaptation', body: 'Full fine-tuning updates all 7 billion parameters — expensive and slow. LoRA adds small adapter matrices to the attention layers. Only 0.1-1% of parameters are trained while the base model is frozen. Same quality, 100x smaller checkpoints.', code: { label: 'Text - LoRA math', src: '# Regular weight update in full fine-tuning:\n# W_new = W_original + ΔW\n# ΔW is (d_model × d_model) = 4096×4096 = 16.7M params per layer\n\n# LoRA decomposes ΔW into two small matrices:\n# ΔW = B × A\n# where A is (r × d_model) and B is (d_model × r)\n# with r << d_model (typically r=8 or r=16)\n\n# Example for r=16, d_model=4096:\n# A: (16 × 4096)  =   65,536 params\n# B: (4096 × 16)  =   65,536 params\n# Total LoRA params: 131,072 vs 16,777,216 full\n# Compression ratio: 128x fewer trainable parameters' } },
            { h2: 'Training with Unsloth', body: 'Unsloth is 2x faster than standard HuggingFace training with 60% less VRAM. It\'s the practical choice for fine-tuning on a single consumer GPU.', code: { label: 'Python - LoRA fine-tuning with Unsloth', src: 'from unsloth import FastLanguageModel\nfrom datasets import load_dataset\nfrom trl import SFTTrainer\nfrom transformers import TrainingArguments\n\n# Load with 4-bit quantization (QLoRA)\nmodel, tokenizer = FastLanguageModel.from_pretrained(\n    model_name="unsloth/llama-3.2-8b-instruct",\n    max_seq_length=2048,\n    load_in_4bit=True,\n)\n\n# Add LoRA adapters\nmodel = FastLanguageModel.get_peft_model(\n    model,\n    r=16,                    # LoRA rank — higher = more params = better quality\n    lora_alpha=16,           # scaling factor (usually = r)\n    target_modules=[\n        "q_proj", "k_proj", "v_proj", "o_proj",  # attention\n        "gate_proj", "up_proj", "down_proj",       # MLP\n    ],\n    lora_dropout=0.0,\n    bias="none",\n    use_gradient_checkpointing="unsloth",\n)\n\n# Format dataset as conversations\ndef format_example(row):\n    return {"text": f"<|user|>\\n{row[\'instruction\']}\\n<|assistant|>\\n{row[\'output\']}\"}\n\ndataset = load_dataset("json", data_files="my_data.jsonl")["train"]\ndataset = dataset.map(format_example)\n\n# Train\ntrainer = SFTTrainer(\n    model=model,\n    tokenizer=tokenizer,\n    train_dataset=dataset,\n    dataset_text_field="text",\n    max_seq_length=2048,\n    args=TrainingArguments(\n        output_dir="./lora_output",\n        num_train_epochs=3,\n        per_device_train_batch_size=2,\n        gradient_accumulation_steps=4,\n        learning_rate=2e-4,\n        lr_scheduler_type="cosine",\n        warmup_ratio=0.05,\n        logging_steps=10,\n        save_steps=100,\n        fp16=True,\n    )\n)\ntrainer.train()\n\n# Save and export to GGUF for Ollama\nmodel.save_pretrained_gguf("./my_model_gguf", tokenizer)\n# Now: ollama create my-model -f Modelfile' } },
          ],
          prev: 'agent-systems',
          next: null,
        },
      ],
    },
  ],

  findById(id) {
    for (const track of this.tracks) {
      const lesson = track.lessons.find(l => l.id === id);
      if (lesson) return { ...lesson, trackId: track.id, trackTitle: track.title, trackTier: track.tier };
    }
    return null;
  },

  getAllLessons() {
    return this.tracks.flatMap(t => t.lessons.map(l => ({ ...l, trackId: t.id })));
  },

  search(query) {
    const q = query.toLowerCase();
    return this.getAllLessons().filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.desc.toLowerCase().includes(q) ||
      l.sections.some(s => s.h2.toLowerCase().includes(q) || (s.body || '').toLowerCase().includes(q))
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. PROGRESS TRACKER
// ─────────────────────────────────────────────────────────────────────────────

const Progress = {
  _data: null,

  load() {
    if (this._data) return this._data;
    try {
      this._data = JSON.parse(localStorage.getItem(CE_CONFIG.storageKey) || '{}');
    } catch {
      this._data = {};
    }
    return this._data;
  },

  save() {
    try {
      localStorage.setItem(CE_CONFIG.storageKey, JSON.stringify(this._data));
    } catch (e) {
      console.warn('[Progress] localStorage full or unavailable');
    }
  },

  markVisited(id) {
    const d = this.load();
    if (!d[id]) d[id] = { visited: true, visitedAt: Date.now() };
    this.save();
    this._updateUI();
  },

  markComplete(id) {
    const d = this.load();
    d[id] = { ...d[id], complete: true, completedAt: Date.now() };
    this.save();
    this._updateUI();
    this._celebrate(id);
  },

  isComplete(id) {
    return !!this.load()[id]?.complete;
  },

  getCompletedCount() {
    return Object.values(this.load()).filter(v => v.complete).length;
  },

  getCompletedIds() {
    return Object.entries(this.load()).filter(([, v]) => v.complete).map(([k]) => k);
  },

  _updateUI() {
    document.querySelectorAll('[data-progress-count]')
      .forEach(el => el.textContent = this.getCompletedCount());
    // Mark completed lessons in any visible lesson list
    this.getCompletedIds().forEach(id => {
      document.querySelectorAll(`[data-lesson-id="${id}"]`).forEach(el => {
        el.classList.add('completed');
      });
    });
  },

  _celebrate(id) {
    const banner = document.createElement('div');
    banner.className = 'ce-celebrate';
    banner.innerHTML = `<span>🎉</span><span>Lesson complete!</span>`;
    Object.assign(banner.style, {
      position: 'fixed', bottom: '2rem', right: '2rem',
      background: 'var(--accent-primary)', color: '#07080a',
      padding: '1rem 1.5rem', borderRadius: '12px',
      fontFamily: 'var(--font-heading)', fontWeight: '700',
      fontSize: '1rem', zIndex: '9999', display: 'flex',
      gap: '0.5rem', alignItems: 'center',
      boxShadow: '0 8px 32px rgba(0,255,170,0.4)',
      animation: 'ceSlideIn 0.3s ease',
    });
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 3500);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. CONTENT RENDERER
// Hydrates lesson.html and project.html with data.
// ─────────────────────────────────────────────────────────────────────────────

const Renderer = {
  renderLesson(data) {
    // Page title
    document.title = `${data.title} | AI Coding Academy`;

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = data.desc;

    // Breadcrumb
    const bc = document.getElementById('ce-breadcrumb');
    if (bc) {
      bc.innerHTML = `
        <a href="/">Home</a>
        <span class="separator">/</span>
        <a href="/tutorials/index.html">Tutorials</a>
        <span class="separator">/</span>
        <a href="/tutorials/${data.trackId}.html">${data.trackTitle || data.trackId}</a>
        <span class="separator">/</span>
        <span>${data.title}</span>`;
    }

    // Header
    const header = document.getElementById('ce-header');
    if (header) {
      header.innerHTML = `
        <div class="lesson-meta">
          <span class="badge badge-${(data.badge || 'beginner').toLowerCase()}">${data.badge || 'Beginner'}</span>
          <span class="lesson-meta-item">⏱️ ${data.duration || '30 min'}</span>
          <span class="lesson-meta-item" id="ce-complete-check">${Progress.isComplete(data.id) ? '✅ Completed' : ''}</span>
        </div>
        <h1 class="lesson-title">${data.title}</h1>
        <p class="lesson-description">${data.desc}</p>`;
    }

    // Body sections
    const body = document.getElementById('ce-body');
    if (body) {
      body.innerHTML = data.sections.map(s => `
        <div class="lesson-content">
          <h2>${s.h2}</h2>
          <p>${(s.body || '').replace(/\n/g, '<br>')}</p>
          ${s.code ? `
            <div class="code-block">
              <div class="code-block-label">
                <span>${s.code.label}</span>
                <button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('pre').innerText).then(()=>{this.textContent='Copied';setTimeout(()=>this.textContent='Copy',1500)})">Copy</button>
              </div>
              <pre>${this._highlightCode(s.code.src)}</pre>
            </div>` : ''}
        </div>`).join('');
    }

    // Navigation
    const nav = document.getElementById('ce-lesson-nav');
    if (nav) {
      nav.innerHTML = `
        ${data.prev ? `<a href="?id=${data.prev}&type=lesson" class="prev"><div class="lesson-nav-label">← Previous</div><div class="lesson-nav-title">${CURRICULUM.findById(data.prev)?.title || 'Previous'}</div></a>` : '<span></span>'}
        <button class="btn btn-primary" id="ce-mark-done" onclick="Progress.markComplete('${data.id}');document.getElementById('ce-mark-done').textContent='✅ Done!';document.getElementById('ce-mark-done').disabled=true;">
          ${Progress.isComplete(data.id) ? '✅ Completed' : 'Mark Complete'}
        </button>
        ${data.next ? `<a href="?id=${data.next}&type=lesson" class="next"><div class="lesson-nav-label">Next →</div><div class="lesson-nav-title">${CURRICULUM.findById(data.next)?.title || 'Next'}</div></a>` : '<span></span>'}`;
    }
  },

  renderProject(data) {
    document.title = `${data.title} | Projects | AI Coding Academy`;
    const header = document.getElementById('ce-header');
    if (header) {
      header.innerHTML = `
        <div class="lesson-meta">
          <span class="badge badge-${(data.difficulty || 'advanced').toLowerCase()}">${data.difficulty || 'Advanced'}</span>
          <span class="lesson-meta-item">⏱️ ${data.duration}</span>
          <span class="lesson-meta-item">🛠 ${data.stack?.join(', ')}</span>
        </div>
        <h1 class="lesson-title">${data.title}</h1>
        <p class="lesson-description">${data.desc}</p>`;
    }
    const body = document.getElementById('ce-body');
    if (body && data.sections) {
      body.innerHTML = data.sections.map(s => `
        <div class="lesson-content">
          <h2>${s.h2}</h2>
          <p>${(s.body || '').replace(/\n/g, '<br>')}</p>
          ${s.code ? `<div class="code-block"><div class="code-block-label"><span>${s.code.label}</span><button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('pre').innerText).then(()=>{this.textContent='Copied';setTimeout(()=>this.textContent='Copy',1500)})">Copy</button></div><pre>${this._highlightCode(s.code.src)}</pre></div>` : ''}
        </div>`).join('');
    }
  },

  showError(message) {
    document.title = 'Content Not Found | AI Coding Academy';
    const body = document.getElementById('ce-body');
    if (body) {
      body.innerHTML = `
        <div class="lesson-content" style="text-align:center;padding:4rem 2rem">
          <div style="font-size:4rem;margin-bottom:1rem">🔍</div>
          <h2 style="color:var(--accent-warning)">Content Not Found</h2>
          <p>${message}</p>
          <a href="/tutorials/index.html" class="btn btn-primary" style="margin-top:2rem">Browse All Tutorials</a>
        </div>`;
    }
  },

  _highlightCode(src) {
    if (!src) return '';
    // Escape HTML first
    let html = src
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Apply syntax highlighting
    html = html
      // Comments
      .replace(/(#[^\n]*)/g, '<span class="cm">$1</span>')
      // Strings (double)
      .replace(/"((?:[^"\\]|\\.)*)"/g, '<span class="st">"$1"</span>')
      // Strings (single)
      .replace(/'((?:[^'\\]|\\.)*)'/g, '<span class="st">\'$1\'</span>')
      // Keywords
      .replace(/\b(import|from|as|def|class|return|if|else|elif|for|in|while|not|and|or|True|False|None|with|try|except|raise|async|await|yield|lambda|pass|break|continue|global|self)\b/g, '<span class="kw">$1</span>')
      // Functions
      .replace(/\b([a-z_][a-z0-9_]*)\s*(?=\()/g, '<span class="fn">$1</span>')
      // Classes
      .replace(/\b([A-Z][A-Za-z0-9_]+)\b/g, '<span class="cl">$1</span>')
      // Numbers
      .replace(/\b(\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/g, '<span class="nu">$1</span>');
    return html;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. STICKY SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

const Sidebar = {
  init(currentLesson) {
    const sidebar = document.getElementById('ce-sidebar');
    if (!sidebar) return;

    // Find the track this lesson belongs to
    const track = CURRICULUM.tracks.find(t =>
      t.lessons.some(l => l.id === currentLesson.id)
    );
    if (!track) return;

    sidebar.innerHTML = `
      <div class="sidebar-track-title">${track.icon} ${track.title}</div>
      <div class="sidebar-progress-bar">
        <div class="sidebar-progress-fill" style="width:${this._trackProgress(track)}%"></div>
      </div>
      <div class="sidebar-progress-label">${this._trackProgress(track)}% complete</div>
      <ul class="sidebar-lessons">
        ${track.lessons.map(l => `
          <li class="sidebar-lesson ${l.id === currentLesson.id ? 'active' : ''} ${Progress.isComplete(l.id) ? 'done' : ''}" data-lesson-id="${l.id}">
            <a href="?id=${l.id}&type=lesson">
              <span class="sidebar-check">${Progress.isComplete(l.id) ? '✅' : '○'}</span>
              <span class="sidebar-lesson-title">${l.title}</span>
              <span class="sidebar-lesson-dur">${l.duration}</span>
            </a>
          </li>`).join('')}
      </ul>`;

    // Sticky scroll behavior
    this._makeSticky(sidebar);
  },

  _trackProgress(track) {
    if (!track.lessons.length) return 0;
    const done = track.lessons.filter(l => Progress.isComplete(l.id)).length;
    return Math.round((done / track.lessons.length) * 100);
  },

  _makeSticky(el) {
    // CSS handles sticky, but we need to ensure the sidebar height works
    const update = () => {
      const vh = window.innerHeight;
      const topOffset = 120; // nav + topbar height
      el.style.maxHeight = `${vh - topOffset - 40}px`;
      el.style.overflowY = 'auto';
    };
    update();
    window.addEventListener('resize', update);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. LIVE SEARCH (navbar ⌘K)
// ─────────────────────────────────────────────────────────────────────────────

const Search = {
  modal: null,

  init() {
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.open();
      }
    });

    // Also wire up any .nav-search inputs
    document.querySelectorAll('.nav-search input').forEach(input => {
      input.addEventListener('focus', () => this.open());
    });
  },

  open() {
    if (this.modal) { this.modal.remove(); this.modal = null; }

    this.modal = document.createElement('div');
    this.modal.id = 'ce-search-modal';
    this.modal.innerHTML = `
      <div class="ce-search-backdrop"></div>
      <div class="ce-search-box">
        <input type="text" placeholder="Search 100,000+ tutorials..." id="ce-search-input" autocomplete="off">
        <div id="ce-search-results"></div>
        <div class="ce-search-hint">↑↓ navigate  ↵ open  esc close</div>
      </div>`;

    this._injectStyles();
    document.body.appendChild(this.modal);

    const input = document.getElementById('ce-search-input');
    const results = document.getElementById('ce-search-results');
    input.focus();

    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (q.length < 2) { results.innerHTML = ''; return; }
      const hits = CURRICULUM.search(q).slice(0, 8);
      results.innerHTML = hits.length
        ? hits.map(h => `
            <a href="/learn/lesson.html?id=${h.id}&type=lesson" class="ce-search-result">
              <span class="ce-sr-badge badge-${(h.badge || 'beginner').toLowerCase()}">${h.badge || 'Beginner'}</span>
              <span class="ce-sr-title">${h.title}</span>
              <span class="ce-sr-track">${h.trackId}</span>
            </a>`).join('')
        : '<div class="ce-search-empty">No results for "' + q + '"</div>';
    });

    this.modal.querySelector('.ce-search-backdrop').addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => e.key === 'Escape' && this.close(), { once: true });
  },

  close() {
    if (this.modal) { this.modal.remove(); this.modal = null; }
  },

  _injectStyles() {
    if (document.getElementById('ce-search-styles')) return;
    const style = document.createElement('style');
    style.id = 'ce-search-styles';
    style.textContent = `
      #ce-search-modal { position:fixed;inset:0;z-index:10000 }
      .ce-search-backdrop { position:absolute;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px) }
      .ce-search-box { position:relative;max-width:640px;margin:8vh auto 0;background:var(--bg-card);border:1px solid rgba(0,255,170,.3);border-radius:16px;overflow:hidden }
      #ce-search-input { width:100%;padding:1.2rem 1.5rem;background:transparent;border:none;color:var(--text-primary);font-size:1.1rem;font-family:var(--font-mono);outline:none }
      .ce-search-result { display:flex;align-items:center;gap:.75rem;padding:.75rem 1.5rem;text-decoration:none;border-top:1px solid rgba(255,255,255,.05);transition:background .15s }
      .ce-search-result:hover { background:rgba(0,255,170,.06) }
      .ce-sr-title { flex:1;color:var(--text-primary);font-size:.95rem }
      .ce-sr-track { font-size:.75rem;color:var(--text-muted);font-family:var(--font-mono) }
      .ce-sr-badge { font-size:.65rem;padding:2px 8px;border-radius:20px;font-weight:700;text-transform:uppercase }
      .badge-beginner { background:rgba(0,255,170,.15);color:var(--accent-primary) }
      .badge-intermediate { background:rgba(251,191,36,.15);color:var(--accent-warning) }
      .badge-advanced { background:rgba(168,85,247,.15);color:var(--accent-tertiary) }
      .ce-search-hint { padding:.5rem 1.5rem;font-size:.75rem;color:var(--text-muted);font-family:var(--font-mono);border-top:1px solid rgba(255,255,255,.05) }
      .ce-search-empty { padding:1.5rem;text-align:center;color:var(--text-muted) }
      @keyframes ceSlideIn { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
    `;
    document.head.appendChild(style);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. TRACK INDEX RENDERER (for tutorials/index.html)
// Call CE.renderTrackIndex() to populate a curriculum listing page.
// ─────────────────────────────────────────────────────────────────────────────

const TrackIndex = {
  render(containerId = 'ce-track-index') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = CURRICULUM.tracks.map(track => `
      <div class="ce-track-card">
        <div class="ce-track-header">
          <span class="ce-track-icon">${track.icon}</span>
          <div>
            <div class="ce-track-tier">Tier ${track.tier}</div>
            <h3 class="ce-track-title">${track.title}</h3>
            <div class="ce-track-subtitle">${track.subtitle}</div>
          </div>
        </div>
        <p class="ce-track-desc">${track.description}</p>
        <ul class="ce-track-lessons">
          ${track.lessons.map(l => `
            <li class="${Progress.isComplete(l.id) ? 'done' : ''}">
              <a href="/learn/lesson.html?id=${l.id}&type=lesson" data-lesson-id="${l.id}">
                <span>${Progress.isComplete(l.id) ? '✅' : '○'}</span>
                <span>${l.title}</span>
                <span class="ce-lesson-dur">${l.duration}</span>
              </a>
            </li>`).join('')}
        </ul>
        <a href="/learn/lesson.html?id=${track.lessons[0].id}&type=lesson" class="btn btn-primary" style="margin-top:1.5rem;width:100%;text-align:center">
          Start Track →
        </a>
      </div>`).join('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

const CE = {
  version: CE_CONFIG.version,
  Router,
  CURRICULUM,
  Progress,
  Renderer,
  Sidebar,
  Search,
  TrackIndex,
  DataLoader,

  /** Call on lesson.html and project.html to hydrate the page. */
  async init() {
    Router.init();
    Search.init();
    Progress._updateUI();

    // If this page has a ce-track-index container, render the track listing
    if (document.getElementById('ce-track-index')) {
      TrackIndex.render();
    }

    // If this page has a ce-body container, we're on a template page — dispatch
    if (document.getElementById('ce-body')) {
      await Router.dispatch();
    }
  },

  renderTrackIndex: (id) => TrackIndex.render(id),
  search: (q) => CURRICULUM.search(q),
};

window.CE = CE;

// Auto-init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => CE.init());

console.log(`🚀 ContentEngine ${CE_CONFIG.version} loaded`);
