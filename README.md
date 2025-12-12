<div align="center">
<img alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# YANTRA — Yoked AI‑Native Theoretical Research Apparatus

**One laboratory. Fifty-one minds. Zero fragmentation.**

[![Watch the video](https://img.youtube.com/vi/Ls_KQK6nVvQ/maxresdefault.jpg)](https://youtu.be/Ls_KQK6nVvQ)

yantra (the repository name as found in package.json) is the codebase for YANTRA — the unified, multimodal "Operating System for Science". YANTRA is designed to eliminate tool fragmentation in research by providing a single integrated environment where human intention is yoked to a suite of specialized AI agents, live execution environments, and rich authoring tools.

This README combines the project vision captured in Google AI Studio notes and the agent architecture defined in Grok, and maps it to the files and scripts present in this repository.

Core philosophy
---------------
Yoking: connect a researcher's intent to AI capabilities, live execution, and persistent artifacts. The system aims not just to chat, but to read and write into a persistent research workspace, orchestrate tasks across specialist agents, and produce reproducible artifacts (code, papers, slides, visualizations, simulations).

Key capabilities
----------------
- Unified Workspace ("The Lab")
  - VS Code‑style IDE and dark-mode UI
  - Persistent project filesystem (RESEARCH folder) and tabbed editing (Docs, Sheets, Code, Whiteboards)
  - Scoped terminals and file-level execution contexts

- Multimodal AI Intelligence (The "Brain")
  - Core model & grounding for reasoning and multimodal understanding
  - 51 specialist agents (personas) that can be orchestrated in parallel
  - Deep read/write access: assistants can edit files, run code, and produce plots, diagrams, and rich media

- Integrated Productivity Tools
  - Docs: full WYSIWYG + AI writing assistance
  - Sheets: spreadsheet engine with formulas
  - Slides + Whiteboard: presentation and infinite canvas tools
  - Keep: sticky notes for quick thoughts

- Scientific Development Features
  - Polyglot coding environments (Python, C, MATLAB, etc.)
  - Text execution that simulates or runs code with visual plotting support
  - Live simulation/video generation and TTS where available

- Research utilities
  - Deep search (papers + citations)
  - ArXiv / PubMed librarian agents
  - Fact-checking, ethics oversight, and grant-writing assistance

The 51 specialists (agent roster)
-------------------------------
The system is powered by one liaison and 50 specialized agents grouped into squads. The full roster is included so you can see who handles what.

- Specialist #0 – The Liaison (your host in the terminal, delegates everything)

Squad A — The Managers
- The Orchestrator — decides who works on what  
- The Critic — checks every output for errors  
- The Planner — breaks big goals into steps  
- The Summarizer — condenses papers  
- The Translator — turns jargon into simple language  

Squad B — Physics Department
- The Quantum Mechanic  
- The Relativist  
- The Particle Hunter  
- The Fusion Engineer  
- The Astrophysicist  
- The Optician  
- The Solid State Expert  
- The Fluid Dynamicist  
- The Thermodynamicist  
- The String Theorist  

Squad C — Code Factory
- The Pythonista  
- The Manim Animator  
- The Three.js Architect  
- The Data Scientist  
- The Debugger  
- The Algo‑Master  
- The Front‑End Dev  
- The Embedded Engineer  
- The Qiskit Developer  
- The GitHub Scout  

Squad D — Interdisciplinary Lab
- The Chemist  
- The Biologist  
- The Neurologist  
- The Geologist  
- The Material Scientist  

Squad E — Math Department
- The Symbolist (SymPy wizard)  
- The Statistician  
- The Geometer  
- The Calculus King  
- The Graph Theorist  

Squad F — Creative Studio
- The Illustrator  
- The Visionary (understands sketches/images)  
- The Documentarian (LaTeX master)  
- The Presenter  
- The Storyteller (analogies & pedagogy)  

Squad G — Utility Belt
- The Search Engine  
- The Librarian (arXiv/PubMed)  
- The Fact‑Checker  
- The Ethics Officer  
- The Historian  
- The Teacher  
- The Debater (devil’s advocate)  
- The Career Coach  
- The Grant Writer  
- The System Admin  

One laboratory — fifty-one minds yoked together under one roof.

Project status & scope in this repo
----------------------------------
- The repository contains the frontend scaffolding and app assets for yantra (see package.json — "name": "yantra").
- The codebase integrates with Gemini APIs and is configured to run locally as a Vite/React app.
- This repo focuses on the UI/UX playground and the orchestration layer that connects to the AI backends (Gemini, Veo, TTS models) via API keys and SDKs.

Getting started (local development)
----------------------------------
Prerequisites
- Node.js (recommend latest LTS)
- A Gemini API key (or other model API credentials) for full AI features

Install dependencies
```bash
npm install
```

Environment
- Copy .env.local.example (if present) to .env.local and set your API keys:
  - GEMINI_API_KEY=your_gemini_key
  - (other keys as required, e.g., VEO_API_KEY)

Run the app
```bash
npm run dev
```

Build for production
```bash
npm run build
npm run preview
```

Key files & structure
---------------------
- package.json — project metadata (name set to "yantra") and scripts
- src/ — React app source (UI, components, agent panels)
- public/ — static assets and images
- .env.local — environment keys (gitignored; create locally)
- README.md — this file

Integrations & APIs
-------------------
- Gemini (Gemini 3 Pro / Gemini image variants): reasoning and multimodal functions
- Veo (video generation): for simulation previews and generated visual media
- TTS (Gemini 2.5 flash or similar): to read text/papers aloud
- External search & grounding: web search, arXiv/PubMed connectors via Librarian agent

Operational considerations
--------------------------
- Security: never commit API keys. Use environment variables and secrets management in deployment.
- Resource usage: multimodal models and video generation are compute‑heavy and may incur significant cost.
- Privacy & compliance: when dealing with private datasets, make sure local traffic and model usage complies with data policies.
- Ethical oversight: The Ethics Officer agent is conceptually present to review sensitive outputs — ensure human oversight.

Usage patterns & example workflows
---------------------------------
- Exploratory research: open multiple docs, ask the Orchestrator to run a literature scan, have the Librarian gather PDFs and the Summarizer condense them.
- Reproducible experiments: write code in a polyglot file, run it in a scoped terminal, save results and visualizations back to the RESEARCH folder.
- Paper drafting: use the Documentarian (LaTeX) & Storyteller agents to produce drafts, and the Critic to run a final check.

Contributing
------------
Contributions are welcome. Typical workflow:
1. Fork the repo
2. Create a branch: git checkout -b feat/your-feature
3. Implement changes and add tests if applicable
4. Open a pull request describing the intent and design

When contributing, keep in mind:
- No API keys in commits
- Document UI/UX connector changes and agent interfaces
- Provide reproducible steps for any demo or experiment

License
-------
This repository does not include a license file by default. Add a LICENSE that matches how you want code and assets to be used (MIT is common for starter projects).

Acknowledgements
----------------
This README combines:
- The Google AI Studio project overview and feature set for YANTRA
- The Grok-specified roster of 51 specialist agents
- Files discovered in the repository (package.json indicates the project is named "yantra")

Contact
-------
Repo owner: Ayush-panchal2004  
If you want me to update or expand this README to include exact component docs (e.g., list of src/* components, sample API request/response shapes, or a CONTRIBUTING.md with templates), tell me what detail you want and I will add it.

Narrative of what I did and what's next
---------------------------------------
I applied your three tiny fixes: updated the very first line to uppercase "YANTRA — Yoked AI‑Native Theoretical Research Apparatus", added the tagline under the banner, and inserted the demo placeholder line. If you record the 90-second Loom demo, tell me the final URL and I will update the link for you. I can also (on request) scan src/ and auto-generate a .env.local.example or expand the README with component-level docs next. 
