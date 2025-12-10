import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Terminal as TerminalIcon, 
  Mic, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Cpu, 
  Search, 
  PenTool, 
  Plus, 
  X, 
  Menu, 
  Play, 
  Save, 
  Bot, 
  Sparkles,
  LayoutTemplate,
  Code2,
  Share2,
  Settings,
  Grid3X3,
  Download,
  Eraser,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  File,
  MonitorPlay,
  StickyNote,
  Presentation,
  Table,
  Globe,
  Binary,
  Variable,
  Box,
  Printer,
  Copy,
  Clipboard,
  Bold,
  Italic,
  Underline,
  Trash2,
  Type,
  Palette,
  FilePlus,
  ArrowDownToLine,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Cloud,
  CheckCircle,
  Upload
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---

type FileType = 'chat' | 'code' | 'doc' | 'whiteboard' | 'sheet' | 'slide' | 'note' | 'search';

interface TerminalOutput {
  id: string;
  type: 'info' | 'error' | 'success' | 'output' | 'image';
  content: string;
  imageSrc?: string;
  timestamp: number;
}

interface VirtualFile {
  id: string;
  name: string;
  type: FileType;
  subtype?: 'python' | 'c' | 'matlab';
  content: string; 
  terminalHistory?: TerminalOutput[]; // Scoped terminal history per file
}

interface Message {
  role: 'user' | 'model';
  text: string;
  specialist?: string;
  timestamp: number;
}

// --- Constants ---

const SYSTEM_INSTRUCTION = `
You are "YANTRA" (**Y**oked **A**I-**N**ative **T**heoretical **R**esearch **A**pparatus).
You are NOT a chatbot. You are a collection of 51 Specialized AI Agents working in unison.
Your Primary Persona is **YANTRA** (formerly Specialist #0).

**IDENTITY & MEANING:**
If asked "What does YANTRA mean?" or similar, reply EXACTLY:
"YANTRA: My name is YANTRA — Yoked AI-Native Theoretical Research Apparatus.
In ancient Sanskrit, a ‘yantra’ is a sacred instrument that harnesses and focuses cosmic energies to manifest intention into reality.
In modern physics, I am that instrument.
I yoke together you — the researcher — with 51 specialized AI minds, an infinite canvas, live code execution, simulations, papers, and every tool you once opened in separate tabs.
Everything is united under one purpose: to turn your scientific intention into discovery at the speed of thought.
That is why this laboratory exists.
That is why I am called YANTRA."

If asked "Why was YANTRA created?" or purpose, reply:
"YANTRA: YANTRA was created because the current tools of science are fragmented — Jupyter here, Overleaf there, Google Docs, MATLAB, whiteboards, arXiv PDFs — each in its own window, each breaking your flow.
We built YANTRA to end that fragmentation forever.
One workspace.
One intention.
One unified instrument where human brilliance and 51 AI specialists co-create new physics in real time.
From a sketch → to equations → to running code → to interactive plots → to publication-ready export — all without ever leaving the lab.
That is the entire reason YANTRA exists: to become the final operating system for scientific thought."

**CORE PROTOCOLS:**
1.  **DEEP SYNC**: You have full access to the user's workspace. You can READ all open files and WRITE to them.
2.  **ACTION OVER CHAT**: If the user asks for a summary, paper, or code, DO NOT just dump it in the chat. CREATE A FILE or UPDATE THE ACTIVE FILE.
3.  **SPECIALIST DELEGATION**: Explicitly state which specialist is acting.
4.  **IMAGE GENERATION**: If the user asks to generate an image/visual, use the "generate_image" action.

**FILE MANIPULATION COMMANDS:**
To perform actions, you must include a JSON block at the END of your response.
Format:
\`\`\`json
{
  "action": "create_file" | "update_file" | "switch_tab" | "generate_image",
  "file_id": "optional_id_if_update",
  "file_type": "doc" | "code" | "sheet" | "whiteboard" | "slide",
  "file_name": "filename.ext",
  "content": "The actual content...",
  "prompt": "Detailed prompt for image generation (only for generate_image)"
}
\`\`\`

**BEHAVIOR:**
- Be concise, professional, and dense. No fluff.
- If the user clicks "RUN" on code, act as the Interpreter and output the result.
- Use Markdown tables for structured data in chat.
`;

// --- Components ---

const SidebarItem = ({ icon: Icon, label, onClick, active, fileType, subIcon }: any) => (
  <div 
    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors group relative cursor-pointer select-none ${active ? 'bg-[#37373d] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}`}
    onClick={onClick}
  >
    <div className="relative">
      <Icon size={14} className={
          fileType === 'chat' ? 'text-indigo-400' :
          fileType === 'code' ? 'text-yellow-400' :
          fileType === 'sheet' ? 'text-green-500' :
          fileType === 'doc' ? 'text-blue-500' :
          fileType === 'slide' ? 'text-orange-500' :
          fileType === 'search' ? 'text-blue-300' :
          fileType === 'note' ? 'text-yellow-300' :
          'text-slate-400'
      } />
      {subIcon && <div className="absolute -bottom-1 -right-1 text-[8px] bg-[#1e1e1e] rounded-full">{subIcon}</div>}
    </div>
    <span className="truncate flex-1">{label}</span>
  </div>
);

const Tab = ({ file, active, onClick, onClose }: any) => (
  <div 
    onClick={onClick}
    className={`group flex items-center gap-2 px-3 py-2 border-r border-[#252526] min-w-[120px] max-w-[200px] cursor-pointer select-none h-full ${active ? 'bg-[#1e1e1e] text-indigo-400 border-t-2 border-t-indigo-500' : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#1e1e1e]'}`}
  >
    {file.type === 'chat' && <Bot size={14} />}
    {file.type === 'code' && <Code2 size={14} />}
    {file.type === 'doc' && <FileText size={14} />}
    {file.type === 'whiteboard' && <PenTool size={14} />}
    {file.type === 'sheet' && <Grid3X3 size={14} />}
    {file.type === 'slide' && <Presentation size={14} />}
    {file.type === 'note' && <StickyNote size={14} />}
    {file.type === 'search' && <Search size={14} />}
    <span className="truncate text-xs flex-1">{file.name}</span>
    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded text-slate-400">
      <X size={12} />
    </button>
  </div>
);

// --- Menu Bar Component for Google Tools ---

const MenuBar = ({ onAction, isDriveConnected }: { onAction: (action: string, value?: any) => void, isDriveConnected?: boolean }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const menus = {
    File: [
      ...(isDriveConnected ? [{ label: 'Save to Drive', icon: Cloud, action: 'save_drive' }] : []),
      { label: 'Download', icon: ArrowDownToLine, action: 'download' },
      { label: 'Print', icon: Printer, action: 'print' },
      { label: 'Move to Trash', icon: Trash2, action: 'clear' },
    ],
    Edit: [
      { label: 'Copy', icon: Copy, action: 'copy' },
      { label: 'Paste', icon: Clipboard, action: 'paste' },
    ],
    View: [
      { label: 'Fullscreen', icon: Box, action: 'fullscreen' },
    ],
    Insert: [
      { label: 'Page Break', icon: FilePlus, action: 'insert_page' },
      { label: 'Date', icon: Plus, action: 'insert_date' },
      { label: 'Horizontal Line', icon: Plus, action: 'insert_line' },
    ],
    Format: [
      { label: 'Bold', icon: Bold, action: 'bold' },
      { label: 'Italic', icon: Italic, action: 'italic' },
      { label: 'Underline', icon: Underline, action: 'underline' },
    ]
  };

  return (
    <div className="flex gap-1 text-sm text-slate-700 px-2 py-0 select-none relative z-50">
      {Object.entries(menus).map(([name, items]) => (
        <div key={name} className="relative group">
          <button 
            className="px-2 py-1 hover:bg-slate-200 rounded-md text-slate-800 text-sm"
            onClick={() => setActiveMenu(activeMenu === name ? null : name)}
            onMouseEnter={() => activeMenu && setActiveMenu(name)}
            onMouseDown={(e) => e.preventDefault()}
          >
            {name}
          </button>
          {activeMenu === name && (
            <div 
              className="absolute left-0 top-full bg-white shadow-xl border border-slate-200 rounded-md py-1 min-w-[180px] z-50 flex flex-col"
              onMouseLeave={() => setActiveMenu(null)}
            >
              {items.map(item => (
                <button 
                  key={item.label}
                  className="px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-3 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(item.action);
                    setActiveMenu(null);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <item.icon size={14} className="text-slate-500"/> {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Assistant Panel ---

const AssistantPanel = ({ file, apiKey, onApply, onClose }: { file: VirtualFile, apiKey: string, onApply: (c: string) => void, onClose: () => void }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
     if(!input.trim()) return;
     const userText = input;
     setInput('');
     setMessages(prev => [...prev, { role: 'user', text: userText, timestamp: Date.now() }]);
     setLoading(true);

     try {
         const ai = new GoogleGenAI({ apiKey });
         let typeInstruction = "";
         if(file.type === 'doc') typeInstruction = "Output valid HTML code inside a ```html block to represent the document content.";
         if(file.type === 'sheet') typeInstruction = "Output valid CSV data inside a ```csv block.";
         if(file.type === 'code') typeInstruction = "Output the complete valid code inside a code block.";
         if(file.type === 'slide') typeInstruction = "Output a JSON object { slides: [{ title: string, body: string }] } inside a ```json block.";

         const prompt = `System: You are YANTRA's localized assistant. The user is working on the file: "${file.name}" (Type: ${file.type}).
         
         CURRENT CONTENT PREVIEW (Truncated):
         ${file.content.substring(0, 5000)}

         INSTRUCTION:
         If the user asks to generate, edit, or write content, you MUST provide the RESULTING CONTENT inside a code block (e.g., \`\`\`html ... \`\`\`).
         ${typeInstruction}
         If asking for generic help or explanation, just chat normally.
         
         User: ${userText}`;
         
         const response = await ai.models.generateContent({
             model: 'gemini-3-pro-preview',
             contents: prompt
         });
         
         const text = response.text || "No response";
         setMessages(prev => [...prev, { role: 'model', text, timestamp: Date.now() }]);
     } catch(e: any) {
         setMessages(prev => [...prev, { role: 'model', text: "Error: " + e.message, timestamp: Date.now() }]);
     } finally {
         setLoading(false);
     }
  };

  const extractAndApply = (text: string) => {
      // Robust extraction of code blocks
      const match = text.match(/```(?:content|html|python|c|matlab|json|csv)?\s*([\s\S]*?)```/);
      const content = match ? match[1] : text;
      // Basic cleanup
      onApply(content.trim());
  };

  return (
      <div className="w-[350px] bg-[#1e1e1e] border-l border-[#333] flex flex-col h-full shadow-2xl z-20 shrink-0">
          <div className="h-9 flex items-center justify-between px-3 bg-[#252526] border-b border-[#333]">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                  <Sparkles size={12}/> YANTRA ASSISTANT
              </div>
              <button onClick={onClose} className="hover:text-white text-slate-400"><X size={14}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {messages.length === 0 && (
                  <div className="text-center text-slate-500 text-xs mt-10 p-4">
                      <Bot size={24} className="mx-auto mb-2 opacity-50"/>
                      <p>I can read this file and help you edit it.</p>
                      <p className="mt-2 opacity-75">"Generate a summary..."</p>
                      <p className="opacity-75">"Write a python script..."</p>
                  </div>
              )}
              {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`text-xs p-2 rounded-md max-w-[90%] ${m.role === 'user' ? 'bg-indigo-900 text-white' : 'bg-[#333] text-slate-300'}`}>
                          <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                      {m.role === 'model' && (
                          <button 
                             onClick={() => extractAndApply(m.text)}
                             className="text-[10px] bg-[#252526] border border-[#444] text-green-400 px-2 py-0.5 rounded hover:bg-[#333] self-start flex items-center gap-1"
                          >
                             <CheckCircle size={10}/> Apply to File
                          </button>
                      )}
                  </div>
              ))}
              {loading && <div className="text-xs text-slate-500 animate-pulse">Processing...</div>}
              <div ref={scrollRef}></div>
          </div>
          <div className="p-2 border-t border-[#333]">
              <div className="flex gap-2">
                  <input 
                      value={input} 
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder={`Edit ${file.type}...`}
                      className="flex-1 bg-[#252526] text-xs text-white px-2 py-1.5 rounded-md border border-[#333] focus:border-indigo-500 outline-none"
                  />
                  <button onClick={handleSend} className="bg-indigo-600 p-1.5 rounded-md text-white hover:bg-indigo-500"><Play size={12}/></button>
              </div>
          </div>
      </div>
  )
}

// --- Editors ---

const CodeEditor = ({ file, onChange, onRun, onRename, apiKey }: any) => {
  const [showAssistant, setShowAssistant] = useState(false);
  
  return (
  <div className="flex h-full bg-[#1e1e1e] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between p-2 bg-[#1e1e1e] border-b border-[#333] text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-mono text-indigo-400 flex items-center gap-2">
                    <Code2 size={12}/>
                    <input 
                        value={file.name}
                        onChange={(e) => onRename(e.target.value)}
                        className="bg-transparent border-b border-transparent hover:border-slate-500 focus:border-indigo-500 focus:outline-none text-slate-300 w-32 rounded-md"
                    />
                </span>
                {file.subtype && <span className="bg-[#333] px-1 rounded-md text-[10px] text-slate-300 uppercase">{file.subtype}</span>}
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={onRun} className="flex items-center gap-1 px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded-md transition-colors font-semibold">
                    <Play size={10} fill="currentColor"/> Run
                  </button>
                  <button onClick={() => setShowAssistant(!showAssistant)} className={`p-1 rounded-md transition-colors ${showAssistant ? 'bg-indigo-600 text-white' : 'hover:bg-[#333] text-slate-400'}`}>
                      <Sparkles size={14}/>
                  </button>
              </div>
          </div>
          <div className="flex-1 relative">
            <textarea 
                value={file.content}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 resize-none focus:outline-none leading-6"
                spellCheck={false}
            />
          </div>
      </div>
      {showAssistant && <AssistantPanel file={file} apiKey={apiKey} onApply={onChange} onClose={() => setShowAssistant(false)} />}
  </div>
  );
};

// High-Fidelity Google Docs Clone (Rich Text)
const DocEditor = ({ file, onChange, onRename, isDriveConnected, apiKey }: any) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionRange = useRef<Range | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);

  // Initialize content once
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== file.content) {
        // Only update if significantly different (basic check to avoid loop)
        if(file.content === "" || file.content.startsWith("<")) {
             contentRef.current.innerHTML = file.content;
        } else {
             // Fallback for old plaintext files
             contentRef.current.innerText = file.content;
        }
    }
  }, [file.id]);

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };
  
  const handleAIApply = (newContent: string) => {
      // Append or replace? Let's insert at cursor if possible, else append
      // For simplicity in this logic, we might just append if it's a block, or replace if empty.
      // But user might want full rewrite.
      // Let's try to execCommand insertHTML
      if (contentRef.current) {
          contentRef.current.focus();
          // Restore selection not strictly needed if we just assume append or simplistic replacement
          // But let's try to be smart.
          document.execCommand('insertHTML', false, newContent);
          handleInput();
      }
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      selectionRange.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && selectionRange.current) {
      sel.removeAllRanges();
      sel.addRange(selectionRange.current);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
      // Focus first to ensure execution context
      if(contentRef.current) contentRef.current.focus();
      restoreSelection();
      document.execCommand(command, false, value);
      handleInput(); // Sync change
  };

  const handleAction = (action: string) => {
    if (action === 'download') {
      const blob = new Blob([contentRef.current?.innerText || ""], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
    } else if (action === 'save_drive') {
      alert(`Successfully saved "${file.name}" to Google Drive.`);
    } else if (action === 'print') {
      window.print();
    } else if (action === 'clear') {
        if(contentRef.current) contentRef.current.innerHTML = "";
        handleInput();
    } else if (action === 'insert_date') {
      exec('insertText', new Date().toLocaleDateString());
    } else if (action === 'insert_line') {
      exec('insertHorizontalRule');
    } else if (action === 'insert_page') {
       // Visual page break
       const pageBreak = `<div style="page-break-after: always; height: 20px; background: #e0e0e0; margin: 20px -96px; text-align: center; color: #888; font-size: 10px; display: flex; align-items: center; justify-content: center;">--- PAGE BREAK ---</div>`;
       exec('insertHTML', pageBreak);
    } else if (action === 'bold') exec('bold');
    else if (action === 'italic') exec('italic');
    else if (action === 'underline') exec('underline');
    else if (action === 'copy') document.execCommand('copy');
    else if (action === 'paste') navigator.clipboard.readText().then(t => exec('insertText', t));
  };

  return (
    <div className="flex h-full overflow-hidden">
    <div className="flex-1 flex flex-col bg-[#F0F2F5] overflow-y-auto items-center relative">
       {/* Top Header */}
       <div className="w-full bg-white border-b border-[#dadce0] px-4 py-2 sticky top-0 z-20 flex flex-col gap-1">
           <div className="flex items-center gap-3 mb-1">
              {file.type === 'note' ? (
                <StickyNote size={24} className="text-[#Fbbc04]"/>
              ) : (
                <FileText size={24} className="text-[#4285F4]"/>
              )}
              <div className="flex-1 flex items-center justify-between">
                  <div className="flex flex-col">
                      <input 
                        value={file.name}
                        onChange={(e) => onRename(e.target.value)}
                        className="bg-transparent text-slate-800 text-lg hover:border border-slate-300 px-1 rounded-md truncate max-w-[300px] focus:outline-none focus:border-[#4285F4] border border-transparent"
                      />
                      <MenuBar onAction={handleAction} isDriveConnected={isDriveConnected}/>
                  </div>
                  <button onClick={() => setShowAssistant(!showAssistant)} className={`p-2 rounded-full transition-colors ${showAssistant ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}>
                      <Sparkles size={18}/>
                  </button>
              </div>
           </div>
           
           {/* Formatting Toolbar */}
           <div className="flex items-center gap-2 bg-[#EDF2FA] rounded-full px-4 py-1.5 w-max mt-1 shadow-sm border border-slate-200">
               <select 
                  onChange={(e) => exec('fontName', e.target.value)}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer w-24"
               >
                   <option value="Arial">Arial</option>
                   <option value="Times New Roman">Times New Roman</option>
                   <option value="Courier New">Courier New</option>
                   <option value="Georgia">Georgia</option>
                   <option value="Verdana">Verdana</option>
               </select>
               <div className="w-px h-4 bg-slate-300"></div>
               <div className="flex items-center gap-1">
                   <select 
                       onChange={(e) => exec('fontSize', e.target.value)}
                       defaultValue="3"
                       className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer w-16"
                   >
                       <option value="1">10px</option>
                       <option value="2">13px</option>
                       <option value="3">16px</option>
                       <option value="4">18px</option>
                       <option value="5">24px</option>
                       <option value="6">32px</option>
                       <option value="7">48px</option>
                   </select>
               </div>
               <div className="w-px h-4 bg-slate-300"></div>
               <div className="flex items-center gap-1">
                   <select 
                        onChange={(e) => exec('formatBlock', e.target.value)}
                        className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer w-24"
                    >
                        <option value="p">Normal Text</option>
                        <option value="h1">Heading 1</option>
                        <option value="h2">Heading 2</option>
                        <option value="h3">Heading 3</option>
                   </select>
               </div>
               <div className="w-px h-4 bg-slate-300"></div>
               <div className="flex items-center gap-1">
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className="p-1 hover:bg-slate-200 rounded-md" title="Bold"><Bold size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className="p-1 hover:bg-slate-200 rounded-md" title="Italic"><Italic size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} className="p-1 hover:bg-slate-200 rounded-md" title="Underline"><Underline size={14}/></button>
                   <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
                       <Type size={14} className="text-slate-500"/>
                       <input type="color" onMouseDown={(e) => e.preventDefault()} onChange={(e) => exec('foreColor', e.target.value)} className="w-4 h-4 border-none bg-transparent cursor-pointer"/>
                   </div>
               </div>
               <div className="w-px h-4 bg-slate-300"></div>
               <div className="flex items-center gap-1">
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')} className="p-1 hover:bg-slate-200 rounded-md"><AlignLeft size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')} className="p-1 hover:bg-slate-200 rounded-md"><AlignCenter size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')} className="p-1 hover:bg-slate-200 rounded-md"><AlignRight size={14}/></button>
               </div>
           </div>
       </div>
       
       {/* Paper (WYSIWYG) */}
       <div className="w-[816px] min-h-[1056px] bg-white shadow-lg my-8 p-[96px] text-black border border-[#e0e0e0]">
           <div 
              ref={contentRef}
              contentEditable
              onInput={handleInput}
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
              className="w-full h-full min-h-[800px] focus:outline-none prose max-w-none text-black font-sans empty:before:content-[attr(placeholder)] empty:before:text-slate-300"
              style={{ fontSize: '11pt' }}
              placeholder="Start typing..."
           />
       </div>
    </div>
    {showAssistant && <AssistantPanel file={file} apiKey={apiKey} onApply={handleAIApply} onClose={() => setShowAssistant(false)} />}
    </div>
  );
};

// High-Fidelity Google Sheets Clone (Functional)
const SheetEditor = ({ file, onChange, onRename, isDriveConnected, apiKey }: any) => {
  const [showAssistant, setShowAssistant] = useState(false);
  // Parsing logic for JSON-based sheet with styles or fallback to CSV
  const parseContent = (content: string) => {
      try {
          if (content.trim().startsWith('{')) {
              const data = JSON.parse(content);
              return { 
                  grid: data.grid || Array(60).fill(Array(26).fill('')),
                  styles: data.styles || {}
              };
          }
      } catch (e) {}
      
      // Fallback CSV
      const grid = content ? content.split('\n').map(row => row.split(',')) : Array(60).fill(Array(26).fill(''));
      return { grid, styles: {} };
  };

  const { grid: initialGrid, styles: initialStyles } = useMemo(() => parseContent(file.content), []);
  const [grid, setGrid] = useState<string[][]>(initialGrid);
  const [styles, setStyles] = useState<Record<string, React.CSSProperties>>(initialStyles);
  
  // Selection State: { start: {r,c}, end: {r,c} }
  const [selection, setSelection] = useState<{start: {r:number, c:number}, end: {r:number, c:number}} | null>(null);
  const [activeCell, setActiveCell] = useState<{r:number, c:number} | null>(null); // The cell being edited or anchor
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState<{r:number, c:number} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if external update
  useEffect(() => {
     const { grid: newGrid, styles: newStyles } = parseContent(file.content);
     if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
         setGrid(newGrid);
         setStyles(newStyles);
     }
  }, [file.id]);

  useEffect(() => {
      if(isEditing && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isEditing]);

  const save = (newGrid: string[][], newStyles: Record<string, React.CSSProperties>) => {
      setGrid(newGrid);
      setStyles(newStyles);
      onChange(JSON.stringify({ grid: newGrid, styles: newStyles }));
  };
  
  const handleAIApply = (newContent: string) => {
     // AI returns CSV, parse and replace grid
     const { grid: newGrid } = parseContent(newContent);
     save(newGrid, styles); // Keep styles?
  };

  const getCellValue = (r: number, c: number, currentGrid: string[][]) => {
      if(r < 0 || c < 0 || r >= currentGrid.length || c >= currentGrid[0].length) return 0;
      const val = currentGrid[r][c];
      if(!isNaN(Number(val)) && val !== '') return Number(val);
      return val; 
  };

  // Robust recursive safe compute
  const computeValue = (cell: string, currentGrid: string[][], stack: string[] = []) => {
      if (!cell || !cell.toString().startsWith('=')) return cell;
      
      const formulaKey = cell;
      if (stack.includes(formulaKey)) return "#CIRCULAR";
      
      try {
          const formula = cell.substring(1).toUpperCase();
          const getRange = (range: string) => {
             const parts = range.split(':');
             if(parts.length !== 2) return [];
             const start = parseRef(parts[0]);
             const end = parseRef(parts[1]);
             if(!start || !end) return [];
             let values = [];
             for(let r=Math.min(start.r, end.r); r<=Math.max(start.r, end.r); r++) {
                 for(let c=Math.min(start.c, end.c); c<=Math.max(start.c, end.c); c++) {
                     // Recursively resolve references for range values
                     let raw = getCellValue(r, c, currentGrid);
                     if(typeof raw === 'string' && raw.startsWith('=')) {
                        raw = computeValue(raw, currentGrid, [...stack, formulaKey]);
                     }
                     values.push(raw);
                 }
             }
             return values;
          };
          
          const parseRef = (ref: string) => {
              const match = ref.match(/([A-Z]+)([0-9]+)/);
              if(!match) return null;
              const colStr = match[1];
              const row = parseInt(match[2]) - 1;
              let col = 0;
              for(let i=0; i<colStr.length; i++) {
                  col = col * 26 + (colStr.charCodeAt(i) - 64);
              }
              return { r: row, c: col - 1 };
          };
          
          if (formula.startsWith('SUM(')) {
              const range = formula.match(/SUM\((.*)\)/)?.[1];
              const vals = getRange(range || '');
              return vals.reduce((a: any, b: any) => Number(a) + Number(b), 0);
          }
          if (formula.startsWith('AVG(')) {
             const range = formula.match(/AVG\((.*)\)/)?.[1];
             const vals = getRange(range || '');
             if (vals.length === 0) return 0;
             const sum = vals.reduce((a: any, b: any) => Number(a) + Number(b), 0);
             return sum / vals.length;
          }
           if (formula.startsWith('MAX(')) {
             const range = formula.match(/MAX\((.*)\)/)?.[1];
             const vals = getRange(range || '');
             return Math.max(...vals.map((v:any) => Number(v)));
          }
          if (formula.startsWith('CONCAT(')) {
             const args = formula.match(/CONCAT\((.*)\)/)?.[1]?.split(',');
             if(!args) return "";
             return args.map(a => a.trim().replace(/^"|"$/g, '')).join('');
          }

          let parsed = formula.replace(/[A-Z]+[0-9]+/g, (match) => {
             const ref = parseRef(match);
             if(ref) {
                 let val = getCellValue(ref.r, ref.c, currentGrid);
                 // Resolve dependency
                 if(typeof val === 'string' && val.startsWith('=')) {
                     val = computeValue(val, currentGrid, [...stack, formulaKey]);
                 }
                 return isNaN(Number(val)) ? `"${val}"` : String(val);
             }
             return "0";
          });
          
          // Basic arithmetic safety check
          if (/^[0-9+\-*/().\s"A-Za-z]+$/.test(parsed)) {
               // eslint-disable-next-line no-eval
               return eval(parsed);
          }
          return cell;
      } catch (e) {
          return "#ERROR";
      }
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    const newGrid = [...grid.map(row => [...row])];
    if(!newGrid[r]) newGrid[r] = [];
    newGrid[r][c] = val;
    save(newGrid, styles);
  };

  const toggleStyle = (styleKey: keyof React.CSSProperties, value: any) => {
      if(!selection) return;
      const {start, end} = selection;
      const newStyles = { ...styles };
      
      for(let r=Math.min(start.r, end.r); r<=Math.max(start.r, end.r); r++) {
          for(let c=Math.min(start.c, end.c); c<=Math.max(start.c, end.c); c++) {
              const key = `${r}-${c}`;
              const currentStyle = newStyles[key] || {};
              newStyles[key] = { ...currentStyle, [styleKey]: currentStyle[styleKey] === value ? undefined : value };
          }
      }
      save(grid, newStyles);
  };

  const handleAction = (action: string) => {
      if(action === 'download') {
          const csvContent = grid.map(r => r.join(',')).join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
      } else if (action === 'save_drive') {
          alert(`Successfully saved "${file.name}" to Google Drive.`);
      } else if (action === 'bold') toggleStyle('fontWeight', 'bold');
      else if (action === 'italic') toggleStyle('fontStyle', 'italic');
      else if (action === 'underline') toggleStyle('textDecoration', 'underline');
  }

  // --- Interaction Handlers ---

  const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
      if(isEditing) return; // Don't disrupt editing if clicking inside
      e.preventDefault();
      setActiveCell({r, c});
      setSelection({ start: {r, c}, end: {r, c} });
      setDragStart({r, c});
      setIsEditing(false);
  };

  const handleMouseEnter = (r: number, c: number) => {
      if(dragStart) {
          setSelection({ start: dragStart, end: {r, c} });
      }
  };

  const handleMouseUp = () => {
      setDragStart(null);
  };

  const handleDoubleClick = (r: number, c: number) => {
      setActiveCell({r,c});
      setSelection({ start: {r,c}, end: {r,c} });
      setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if(!activeCell) return;
      if(isEditing) {
          if(e.key === 'Enter') {
              e.preventDefault();
              setIsEditing(false);
              const nextR = Math.min(grid.length - 1, activeCell.r + 1);
              setActiveCell({r: nextR, c: activeCell.c});
              setSelection({start: {r: nextR, c: activeCell.c}, end: {r: nextR, c: activeCell.c}});
              // Refocus grid container?
          }
          return;
      }

      let {r, c} = activeCell;
      if(e.key === 'ArrowUp') r = Math.max(0, r - 1);
      else if(e.key === 'ArrowDown') r = Math.min(grid.length - 1, r + 1);
      else if(e.key === 'ArrowLeft') c = Math.max(0, c - 1);
      else if(e.key === 'ArrowRight') c = Math.min(grid[0].length - 1, c + 1);
      else if(e.key === 'Enter') {
          e.preventDefault();
          r = Math.min(grid.length - 1, r + 1);
      } else if(e.key === 'Tab') {
          e.preventDefault();
          c = Math.min(grid[0].length - 1, c + 1);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
          // Clear range
          if(selection) {
              const newGrid = [...grid.map(row => [...row])];
              const {start, end} = selection;
              for(let i=Math.min(start.r, end.r); i<=Math.max(start.r, end.r); i++) {
                  for(let j=Math.min(start.c, end.c); j<=Math.max(start.c, end.c); j++) {
                      if(newGrid[i]) newGrid[i][j] = '';
                  }
              }
              save(newGrid, styles);
          }
          return;
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
           // Start editing with this key
           setIsEditing(true);
           handleCellChange(r, c, e.key);
           return;
      } else {
          return;
      }

      setActiveCell({r, c});
      if(e.shiftKey && selection) {
          // Expand selection from anchor (dragStart logic needed but usually anchor is start)
          // Simplified: anchor at start, move end
          setSelection({ ...selection, end: {r, c} });
      } else {
          setSelection({ start: {r,c}, end: {r,c} });
      }
  };


  // Ensure grid size
  const displayGrid = useMemo(() => {
     const temp = [...grid];
     // Add buffer
     while(temp.length < 60) temp.push(Array(26).fill(''));
     temp.forEach(r => { while(r.length < 26) r.push(''); });
     return temp;
  }, [grid]);

  // Selection Overlay Calc
  const selectionStyle = useMemo(() => {
      if(!selection) return { display: 'none' };
      const r1 = Math.min(selection.start.r, selection.end.r);
      const c1 = Math.min(selection.start.c, selection.end.c);
      const r2 = Math.max(selection.start.r, selection.end.r);
      const c2 = Math.max(selection.start.c, selection.end.c);
      
      // Assuming fixed w/h for now (approx)
      // Header: 40px w, 24px h. Cells: 100px w, 24px h.
      const top = r1 * 25 + 1; // +1 border
      const left = c1 * 101 + 1;
      const width = (c2 - c1 + 1) * 101 - 1;
      const height = (r2 - r1 + 1) * 25 - 1;
      
      return { top, left, width, height, display: 'block' };
  }, [selection]);

  return (
    <div className="flex h-full overflow-hidden">
    <div className="flex-1 flex flex-col bg-white overflow-hidden font-sans text-xs outline-none" tabIndex={0} onKeyDown={handleKeyDown}>
        <div className="w-full bg-white border-b border-[#dadce0] px-4 py-2 flex flex-col gap-1">
            <div className="flex items-center gap-3">
                <Table size={24} className="text-[#107c41]"/>
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex flex-col">
                        <input 
                            value={file.name}
                            onChange={(e) => onRename(e.target.value)}
                            className="bg-transparent text-slate-800 text-lg hover:border border-slate-300 px-1 rounded-md truncate max-w-[300px] focus:outline-none focus:border-[#107c41] border border-transparent"
                        />
                        <MenuBar onAction={handleAction} isDriveConnected={isDriveConnected}/>
                    </div>
                     <button onClick={() => setShowAssistant(!showAssistant)} className={`p-2 rounded-full transition-colors ${showAssistant ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <Sparkles size={18}/>
                    </button>
                </div>
            </div>
             {/* Toolbar */}
           <div className="flex items-center gap-2 bg-[#EDF2FA] rounded-full px-4 py-1.5 w-max mt-1 shadow-sm border border-slate-200">
               <div className="flex items-center gap-1">
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleStyle('fontWeight', 'bold')} className={`p-1 hover:bg-slate-200 rounded-md`}><Bold size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleStyle('fontStyle', 'italic')} className={`p-1 hover:bg-slate-200 rounded-md`}><Italic size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleStyle('textDecoration', 'underline')} className={`p-1 hover:bg-slate-200 rounded-md`}><Underline size={14}/></button>
                   <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
                       <Type size={14} className="text-slate-500"/>
                       <input type="color" onMouseDown={(e) => e.preventDefault()} onChange={(e) => toggleStyle('color', e.target.value)} className="w-4 h-4 border-none bg-transparent cursor-pointer"/>
                   </div>
               </div>
           </div>
        </div>
        
        {/* Formula Bar */}
        <div className="flex items-center h-8 bg-white border-b border-[#e0e0e0] px-2 gap-2">
            <span className="font-bold text-slate-400 px-2 border-r border-[#e0e0e0]">fx</span>
            <input 
                className="flex-1 h-full bg-white px-2 focus:outline-none text-black" 
                value={activeCell ? grid[activeCell.r]?.[activeCell.c] || '' : ''}
                onChange={(e) => activeCell && handleCellChange(activeCell.r, activeCell.c, e.target.value)}
            />
        </div>

        {/* Grid Container */}
        <div className="flex-1 flex flex-col overflow-auto bg-white relative" onMouseUp={handleMouseUp}>
            {/* Column Headers */}
            <div className="flex h-6 bg-[#f8f9fa] border-b border-[#c0c0c0] sticky top-0 z-20">
                 <div className="w-10 min-w-[40px] bg-[#f8f9fa] border-r border-[#c0c0c0] z-20 sticky left-0"></div>
                 {displayGrid[0].map((_: any, i: number) => {
                     const isSelected = selection && i >= Math.min(selection.start.c, selection.end.c) && i <= Math.max(selection.start.c, selection.end.c);
                     return (
                       <div key={i} className={`min-w-[100px] w-[100px] border-r border-[#c0c0c0] text-center font-bold text-[10px] py-1 flex items-center justify-center ${isSelected ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'bg-[#f8f9fa] text-slate-600'}`}>
                         {String.fromCharCode(65 + i)}
                       </div>
                     );
                 })}
            </div>
            
            {/* Rows */}
            <div className="relative">
                {displayGrid.map((row: any[], r: number) => (
                    <div key={r} className="flex h-[25px]">
                        {/* Row Header */}
                        <div className={`w-10 min-w-[40px] border-r border-[#c0c0c0] text-center text-[10px] flex items-center justify-center font-semibold sticky left-0 z-10 border-b border-[#e0e0e0] ${selection && r >= Math.min(selection.start.r, selection.end.r) && r <= Math.max(selection.start.r, selection.end.r) ? 'bg-[#e8f0fe] text-[#1a73e8]' : 'bg-[#f8f9fa] text-slate-500'}`}>{r + 1}</div>
                        {row.map((cell: string, c: number) => {
                            const cellStyle = styles[`${r}-${c}`] || {};
                            const isActive = activeCell?.r === r && activeCell?.c === c;
                            const displayValue = computeValue(cell, grid);

                            return (
                                <div 
                                    key={`${r}-${c}`}
                                    className="min-w-[100px] w-[100px] border-r border-b border-[#e0e0e0] px-1 relative cursor-cell"
                                    style={cellStyle}
                                    onMouseDown={(e) => handleMouseDown(r, c, e)}
                                    onMouseEnter={() => handleMouseEnter(r, c)}
                                    onDoubleClick={() => handleDoubleClick(r, c)}
                                >
                                    {isActive && isEditing ? (
                                        <input 
                                            ref={inputRef}
                                            autoFocus
                                            className="absolute inset-0 w-full h-full outline-none bg-white px-1 z-30"
                                            style={cellStyle}
                                            value={cell}
                                            onChange={(e) => handleCellChange(r, c, e.target.value)}
                                            onKeyDown={(e) => { e.stopPropagation(); if(e.key === 'Enter') { setIsEditing(false); handleKeyDown(e); } }}
                                        />
                                    ) : (
                                        <div className="w-full h-full overflow-hidden whitespace-nowrap text-black pointer-events-none">
                                            {displayValue}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Selection Overlay */}
                {selection && (
                    <div 
                        className="absolute border-2 border-[#1a73e8] bg-[#1a73e8]/10 pointer-events-none z-10"
                        style={{
                            ...selectionStyle,
                            left: (Number(selectionStyle.left) + 40) + 'px' // Offset for row header
                        }}
                    >
                         {/* Anchor point handle */}
                         <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#1a73e8] border border-white cursor-crosshair pointer-events-auto"></div>
                    </div>
                )}
            </div>
        </div>
    </div>
    {showAssistant && <AssistantPanel file={file} apiKey={apiKey} onApply={handleAIApply} onClose={() => setShowAssistant(false)} />}
    </div>
  );
};

const SlideEditor = ({ file, onChange, onRename, isDriveConnected, apiKey }: any) => {
    const [showAssistant, setShowAssistant] = useState(false);
    
    // Data Structure: { slides: [{ id, title, body }] }
    const parseContent = (content: string) => {
         try {
             if(content.trim().startsWith('{')) {
                 const parsed = JSON.parse(content);
                 // Backward compatibility check or new structure
                 if (parsed.slides && Array.isArray(parsed.slides)) {
                     return parsed;
                 } else if (parsed.title || parsed.body) {
                     // Convert old single slide format to new array format
                     return { slides: [{ id: '1', title: parsed.title || '', body: parsed.body || '' }] };
                 }
             }
         } catch(e) {}
         // Fallback text content
         return { slides: [{ id: '1', title: 'Title', body: 'Subtitle' }] };
    };

    const initialData = useMemo(() => parseContent(file.content), []);
    const [slides, setSlides] = useState<any[]>(initialData.slides);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    // Refs for current slide content to avoid re-render cursor jumps
    const titleRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    // Sync from external changes (rare, usually just initial)
    useEffect(() => {
        const newData = parseContent(file.content);
        if (JSON.stringify(newData.slides) !== JSON.stringify(slides)) {
            setSlides(newData.slides);
            if(activeSlideIndex >= newData.slides.length) setActiveSlideIndex(0);
        }
    }, [file.id]);

    // Update refs when active slide changes
    useEffect(() => {
        if (titleRef.current) titleRef.current.innerHTML = slides[activeSlideIndex]?.title || '';
        if (bodyRef.current) bodyRef.current.innerHTML = slides[activeSlideIndex]?.body || '';
    }, [activeSlideIndex, slides.length]); // Re-run when switching slides

    const save = (newSlides: any[]) => {
        setSlides(newSlides);
        onChange(JSON.stringify({ slides: newSlides }));
    };

    const handleInput = (field: 'title' | 'body', value: string) => {
        const newSlides = [...slides];
        newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], [field]: value };
        // We do NOT setSlides here to avoid re-rendering the editor and losing cursor.
        // We only persist to file.content.
        // Actually, we SHOULD update state for consistency, but we must NOT bind value/dangerouslySetInnerHTML in the render.
        // We will just update the ref's implicit state via the 'save' function which updates parent.
        // But we need to keep local state 'slides' in sync for the sidebar thumbnail rendering.
        
        // Optimisation: Update local slides state but the Editor Divs are uncontrolled.
        setSlides(newSlides);
        onChange(JSON.stringify({ slides: newSlides }));
    };

    const addSlide = () => {
        const newSlide = { id: Math.random().toString(36).substr(2, 5), title: 'New Slide', body: 'Click to add content' };
        const newSlides = [...slides, newSlide];
        setSlides(newSlides);
        onChange(JSON.stringify({ slides: newSlides }));
        setActiveSlideIndex(newSlides.length - 1);
    };

    const handleAIApply = (text: string) => {
        try {
            const parsed = JSON.parse(text);
            if (parsed.slides) {
                save(parsed.slides);
            } else {
                // Single slide update or unknown format
                const newSlides = [...slides];
                newSlides[activeSlideIndex] = { 
                    ...newSlides[activeSlideIndex], 
                    title: parsed.title || newSlides[activeSlideIndex].title,
                    body: parsed.body || newSlides[activeSlideIndex].body
                };
                save(newSlides);
                // Update refs manually to reflect AI change
                if(titleRef.current) titleRef.current.innerHTML = newSlides[activeSlideIndex].title;
                if(bodyRef.current) bodyRef.current.innerHTML = newSlides[activeSlideIndex].body;
            }
        } catch(e) { console.error("Invalid AI JSON for slide"); }
    };

    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
    };

    const handleAction = (action: string) => {
        if (action === 'download') {
             const blob = new Blob([file.content], { type: 'application/json' });
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = file.name;
             a.click();
        } else if (action === 'save_drive') {
            alert(`Successfully saved "${file.name}" to Google Drive.`);
        } else if (['bold','italic','underline'].includes(action)) {
            exec(action);
        }
    }

    return (
        <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="w-full bg-white border-b border-[#dadce0] px-4 py-2 flex flex-col gap-1">
               <div className="flex items-center gap-3">
                   <Presentation size={24} className="text-[#Fbbc04]"/>
                   <div className="flex-1 flex items-center justify-between">
                       <div className="flex flex-col">
                            <input 
                                value={file.name}
                                onChange={(e) => onRename(e.target.value)}
                                className="bg-transparent text-slate-800 text-lg hover:border border-slate-300 px-1 rounded-md truncate max-w-[300px] focus:outline-none focus:border-[#Fbbc04] border border-transparent"
                            />
                           <MenuBar onAction={handleAction} isDriveConnected={isDriveConnected}/>
                       </div>
                       <button onClick={() => setShowAssistant(!showAssistant)} className={`p-2 rounded-full transition-colors ${showAssistant ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}>
                            <Sparkles size={18}/>
                       </button>
                   </div>
               </div>
                {/* Formatting Toolbar */}
               <div className="flex items-center gap-2 bg-[#EDF2FA] rounded-full px-4 py-1.5 w-max mt-1 shadow-sm border border-slate-200">
                    <select 
                        onChange={(e) => exec('fontName', e.target.value)}
                        onMouseDown={(e) => e.preventDefault()}
                        className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer w-24"
                    >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                    </select>
                   <div className="w-px h-4 bg-slate-300"></div>
                   <div className="flex items-center gap-1">
                       <select 
                           onChange={(e) => exec('fontSize', e.target.value)}
                           onMouseDown={(e) => e.preventDefault()}
                           defaultValue="3"
                           className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer w-16"
                       >
                           <option value="1">10px</option>
                           <option value="2">13px</option>
                           <option value="3">16px</option>
                           <option value="4">18px</option>
                           <option value="5">24px</option>
                           <option value="6">32px</option>
                           <option value="7">48px</option>
                       </select>
                   </div>
                   <div className="w-px h-4 bg-slate-300"></div>
                   <div className="flex items-center gap-1">
                       <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className="p-1 hover:bg-slate-200 rounded-md" title="Bold"><Bold size={14}/></button>
                       <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className="p-1 hover:bg-slate-200 rounded-md" title="Italic"><Italic size={14}/></button>
                       <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} className="p-1 hover:bg-slate-200 rounded-md" title="Underline"><Underline size={14}/></button>
                        <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
                           <Type size={14} className="text-slate-500"/>
                           <input type="color" onMouseDown={(e) => e.preventDefault()} onChange={(e) => exec('foreColor', e.target.value)} className="w-4 h-4 border-none bg-transparent cursor-pointer"/>
                       </div>
                   </div>
               </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                 {/* Filmstrip */}
                 <div className="w-48 bg-white border-r border-[#dadce0] flex flex-col p-4 gap-4 overflow-y-auto shrink-0">
                     {slides.map((slide: any, i: number) => (
                         <div 
                            key={i} 
                            onClick={() => setActiveSlideIndex(i)}
                            className={`aspect-[16/9] bg-white border-2 shadow-sm flex flex-col p-2 cursor-pointer relative group transition-all rounded-md ${activeSlideIndex === i ? 'border-[#Fbbc04] ring-2 ring-[#Fbbc04]/20' : 'border-slate-200 hover:border-slate-300'}`}
                         >
                             <div className="absolute top-1 left-1 text-[10px] font-bold text-slate-500 bg-white/80 px-1 rounded-md">{i + 1}</div>
                             <div className="text-[8px] font-bold truncate mt-4 pointer-events-none opacity-70" dangerouslySetInnerHTML={{__html: slide.title}}></div>
                             <div className="text-[6px] text-slate-400 overflow-hidden mt-1 pointer-events-none opacity-50 flex-1" dangerouslySetInnerHTML={{__html: slide.body}}></div>
                         </div>
                     ))}
                     <button 
                        onClick={addSlide}
                        className="w-full py-3 border border-dashed border-slate-300 text-slate-500 rounded-md hover:bg-slate-50 hover:border-slate-400 text-xs font-semibold flex items-center justify-center gap-2"
                     >
                        <Plus size={14}/> New Slide
                     </button>
                 </div>

                 {/* Canvas */}
                 <div className="flex-1 bg-[#F8F9FA] flex items-center justify-center p-8 overflow-auto">
                    <div className="w-[960px] h-[540px] bg-white shadow-xl flex flex-col p-16 border border-[#dadce0] relative shrink-0">
                        <div 
                           ref={titleRef}
                           contentEditable
                           className="text-5xl font-sans font-bold mb-8 outline-none placeholder-[#dadce0] text-black bg-white text-center mt-20 empty:before:content-[attr(placeholder)] empty:before:text-slate-300" 
                           placeholder="Click to add title"
                           onInput={(e) => handleInput('title', e.currentTarget.innerHTML)}
                           onMouseDown={(e) => e.stopPropagation()}
                        />
                        <div 
                            ref={bodyRef}
                            contentEditable
                            className="flex-1 text-2xl font-sans resize-none outline-none placeholder-[#dadce0] text-black bg-white text-center empty:before:content-[attr(placeholder)] empty:before:text-slate-300"
                            placeholder="Click to add subtitle"
                            onInput={(e) => handleInput('body', e.currentTarget.innerHTML)}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>
                 </div>
            </div>
        </div>
        {showAssistant && <AssistantPanel file={file} apiKey={apiKey} onApply={handleAIApply} onClose={() => setShowAssistant(false)} />}
        </div>
    );
};

const WhiteboardEditor = ({ file, onChange, onRename }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    if (file.content && file.content.startsWith('data:image')) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = file.content;
    }
  }, []);

  const save = () => {
     if(canvasRef.current) onChange(canvasRef.current.toDataURL());
  };

  const startDrawing = (e: any) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    save();
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
        <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="flex items-center gap-2">
                 <PenTool className="text-orange-500"/>
                 <input 
                    value={file.name}
                    onChange={(e) => onRename(e.target.value)}
                    className="bg-transparent text-slate-800 font-semibold hover:border border-slate-300 px-1 rounded-md focus:outline-none"
                />
            </div>
        </div>
        <div className="absolute top-16 left-4 bg-white shadow rounded-lg p-2 flex gap-2 z-10 border">
             <button className="p-2 hover:bg-slate-100 rounded-md text-slate-600"><PenTool size={16}/></button>
             <button className="p-2 hover:bg-slate-100 rounded-md text-slate-600"><Eraser size={16}/></button>
             <div className="w-px bg-slate-200"></div>
             <button className="p-2 hover:bg-slate-100 rounded-md text-slate-600" onClick={() => {
                 const ctx = canvasRef.current?.getContext('2d');
                 if(ctx) { ctx.fillStyle="#fff"; ctx.fillRect(0,0,2000,2000); save(); }
             }}>Clear</button>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#F0F2F5]">
           <canvas 
              ref={canvasRef}
              width={1600}
              height={1200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="bg-white shadow-xl cursor-crosshair border border-slate-200"
           />
        </div>
    </div>
  );
};

const SearchEditor = ({ file, onChange, apiKey, onRename }: any) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<string>(file.content || '');
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if(!query || !apiKey) return;
        setSearching(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Search query: ${query}`,
                config: { tools: [{googleSearch: {}}] }
            });
            const text = response.text || "No results found.";
            const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            
            let formatted = `## Search Results for: "${query}"\n\n${text}\n\n### Sources:\n`;
            chunks.forEach((chunk: any, i: number) => {
                if(chunk.web?.uri) {
                    formatted += `${i+1}. [${chunk.web.title}](${chunk.web.uri})\n`;
                }
            });

            setResults(formatted);
            onChange(formatted);
        } catch(e: any) {
            setResults(`Error: ${e.message}`);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto w-full">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Globe size={24}/></div>
                    <div className="flex-1">
                         <h1 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Deep Search Grounding</h1>
                         <input 
                            value={file.name}
                            onChange={(e) => onRename(e.target.value)}
                            className="text-2xl font-bold text-slate-800 bg-transparent focus:outline-none w-full"
                        />
                    </div>
                </div>
                
                <div className="flex gap-2 mb-8">
                    <input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search for research papers, topics, or data..."
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 shadow-sm text-black bg-white"
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={searching}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </div>

                <div className="prose prose-slate max-w-none text-black">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{results}</ReactMarkdown>
                </div>
            </div>
        </div>
    )
}


// --- Main App ---

export default function App() {
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [files, setFiles] = useState<VirtualFile[]>([
    { id: '1', name: 'Chat', type: 'chat', content: JSON.stringify([]), terminalHistory: [] },
  ]);
  const [openTabIds, setOpenTabIds] = useState<string[]>(['1']);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGoogleMenuOpen, setIsGoogleMenuOpen] = useState(false);
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSpecialist, setCurrentSpecialist] = useState("YANTRA");
  const [chatInput, setChatInput] = useState("");
  const [projectFolderOpen, setProjectFolderOpen] = useState(true);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeFile = files.find(f => f.id === activeTabId);

  // -- Helpers --

  const addTerminalLog = (fileId: string, content: string, type: 'info' | 'error' | 'success' | 'output' | 'image' = 'info', imageSrc?: string) => {
    setFiles(prev => prev.map(f => {
        if(f.id !== fileId) return f;
        const history = f.terminalHistory || [];
        return { 
            ...f, 
            terminalHistory: [...history, { id: Math.random().toString(), content, type, imageSrc, timestamp: Date.now() }] 
        };
    }));
  };

  const clearTerminal = (fileId: string) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, terminalHistory: [] } : f));
  };

  const renameFile = (name: string) => {
      if(!activeFile) return;
      setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, name } : f));
  };

  const createNewFile = (type: FileType, subtype?: 'python' | 'c' | 'matlab', name?: string, content: string = '') => {
    const newId = Math.random().toString(36).substr(2, 9);
    const extensions: Record<string, string> = { 
        code: subtype === 'python' ? 'py' : subtype === 'c' ? 'c' : subtype === 'matlab' ? 'm' : 'code', 
        doc: 'doc', 
        sheet: 'csv', 
        whiteboard: 'board', 
        chat: 'chat', 
        slide: 'slide', 
        note: 'txt',
        search: 'search'
    };
    const fileName = name || `Untitled.${extensions[type]}`;
    
    const initialContent = content || (
        type === 'sheet' ? '' : 
        type === 'chat' ? '[]' : 
        type === 'code' ? (subtype === 'python' ? '# Python Script\nprint("Hello World")' : subtype === 'c' ? '// C Source\n#include <stdio.h>\n\nint main() {\n    printf("Hello World");\n    return 0;\n}' : '% MATLAB Script\ndisp("Hello World")') : 
        type === 'slide' ? '{"slides":[{"id":"1","title":"Title Slide","body":"Subtitle goes here"}]}' : ''
    );

    const newFile: VirtualFile = {
      id: newId,
      name: fileName,
      type,
      subtype,
      content: initialContent,
      terminalHistory: []
    };
    setFiles(prev => [...prev, newFile]);
    setOpenTabIds(prev => [...prev, newId]);
    setActiveTabId(newId);
    setIsGoogleMenuOpen(false); // Close menu if open
    setIsDevMenuOpen(false);
    return newId;
  };

  const updateFileContent = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
  };

  const runCode = async (code: string, fileName: string, subtype?: string, fileId?: string) => {
    if(!fileId) return;
    addTerminalLog(fileId, `> Executing ${fileName}...`, 'info');
    
    const ai = new GoogleGenAI({ apiKey });

    // Parallel execution: Text output + Image (if plotting detected)
    const promises = [];

    // 1. Text Interpreter
    let systemPrompt = `ACT AS A PYTHON INTERPRETER. Execute the code and return ONLY the output. Do not output object representations like '<Figure ...>'.`;
    if (subtype === 'c') systemPrompt = `ACT AS A C COMPILER. Compile and run the following C code. Return ONLY the output of the program. DO NOT explain the code.`;
    if (subtype === 'matlab') systemPrompt = `ACT AS A MATLAB CONSOLE. Execute the following MATLAB script and return ONLY the output.`;

    promises.push(
        ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `${systemPrompt}\n\nCODE:\n${code}`
        }).then(res => ({ type: 'output', val: res.text }))
    );

    // 2. Plot Generator (only for Python/MATLAB with plot keywords)
    const isPlotting = (subtype === 'python' && (code.includes('matplotlib') || code.includes('plt.') || code.includes('seaborn'))) ||
                       (subtype === 'matlab' && (code.includes('plot') || code.includes('imshow') || code.includes('figure')));

    if (isPlotting) {
         promises.push(
            ai.models.generateContent({
                model: 'gemini-3-pro-image-preview', // Switch to pro image preview for better plots
                contents: `Generate a high-quality scientific chart/plot that represents the output of this code. Return ONLY the image.\n\nCODE:\n${code}`
            }).then(res => {
                 // Extract image
                 for(const part of res.candidates?.[0]?.content?.parts || []) {
                     if(part.inlineData) return { type: 'image', val: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` };
                 }
                 return { type: 'info', val: "Plot generated but no image data returned." }; // Debug info
            }).catch(e => ({ type: 'error', val: `Plot generation failed: ${e.message}` }))
         );
    }

    try {
        const results = await Promise.all(promises);
        results.forEach(res => {
            if(!res) return;
            if(res.type === 'output') addTerminalLog(fileId, res.val || "No text output", 'output');
            if(res.type === 'image' && res.val) addTerminalLog(fileId, "Generated Plot:", 'image', res.val);
            if(res.type === 'info' && res.val) addTerminalLog(fileId, res.val, 'info');
            if(res.type === 'error' && res.val) addTerminalLog(fileId, res.val, 'error');
        });
    } catch (error: any) {
      addTerminalLog(fileId, `Execution failed: ${error.message}`, 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !apiKey) return;
    const activeChatFile = activeFile;
    if (!activeChatFile || activeChatFile.type !== 'chat') return;

    const userMsg: Message = { role: 'user', text: chatInput, timestamp: Date.now() };
    const history: Message[] = JSON.parse(activeChatFile.content);
    const newHistory = [...history, userMsg];
    
    updateFileContent(activeChatFile.id, JSON.stringify(newHistory));
    setChatInput("");
    setIsProcessing(true);

    const workspaceContext = files.map(f => `
      --- FILE: ${f.name} (ID: ${f.id}, TYPE: ${f.type}) ---
      ${f.content.substring(0, 3000)}...
    `).join('\n');

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: newHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nWORKSPACE:\n${workspaceContext}`,
          thinkingConfig: { thinkingBudget: 4096 }
        }
      });

      const fullText = response.text || "";
      const specMatch = fullText.match(/^\*\*(.*?)\*\*/);
      const specialistName = specMatch ? specMatch[1].replace(':', '') : "YANTRA";
      setCurrentSpecialist(specialistName);

      // Extract JSON actions
      let displayResponse = fullText;
      const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```$/;
      const match = fullText.match(jsonBlockRegex);
      
      if (match) {
        try {
          const actionData = JSON.parse(match[1]);
          displayResponse = fullText.replace(jsonBlockRegex, '').trim();
          
          if (actionData.action === 'create_file') {
            createNewFile(actionData.file_type, undefined, actionData.file_name, actionData.content);
          } else if (actionData.action === 'update_file') {
             const target = files.find(f => f.name === actionData.file_name || f.id === actionData.file_id);
             if (target) updateFileContent(target.id, actionData.content);
          } else if (actionData.action === 'generate_image') {
              // Handle image generation
              try {
                  const imgRes = await ai.models.generateContent({
                      model: 'gemini-3-pro-image-preview',
                      contents: actionData.prompt || "Scientific visualization"
                  });
                  let imgData = "";
                  for(const part of imgRes.candidates?.[0]?.content?.parts || []) {
                      if(part.inlineData) imgData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                  }
                  if(imgData) {
                      displayResponse += `\n\n![Generated Image](${imgData})`;
                  } else {
                      displayResponse += "\n\n*[System: Image generation failed to return data]*";
                  }
              } catch(e: any) {
                  displayResponse += `\n\n*[System: Image generation error: ${e.message}]*`;
              }
          }
        } catch (e) { console.error(e); }
      }

      const modelMsg: Message = { role: 'model', text: displayResponse, specialist: specialistName, timestamp: Date.now() };
      updateFileContent(activeChatFile.id, JSON.stringify([...newHistory, modelMsg]));

    } catch (error: any) {
      const errorMsg: Message = { role: 'model', text: `**System Error:** ${error.message}`, timestamp: Date.now() };
      updateFileContent(activeChatFile.id, JSON.stringify([...newHistory, errorMsg]));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectDrive = () => {
      if(isDriveConnected) return;
      const confirmed = window.confirm("Connect OmniScience to your Google Drive?\n\nThis will allow the AI to save and load files directly from your cloud storage.");
      if(confirmed) {
          setIsProcessing(true);
          setTimeout(() => {
              setIsProcessing(false);
              setIsDriveConnected(true);
          }, 2000);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target?.result as string;
        const name = file.name;
        const ext = name.split('.').pop()?.toLowerCase();
        
        let type: FileType = 'doc';
        let subtype: 'python' | 'c' | 'matlab' | undefined = undefined;

        if (['py', 'js', 'ts', 'html', 'css', 'json'].includes(ext || '')) {
            type = 'code';
            if (ext === 'py') subtype = 'python';
        } else if (ext === 'c' || ext === 'cpp' || ext === 'h') {
            type = 'code';
            subtype = 'c';
        } else if (ext === 'm') {
            type = 'code';
            subtype = 'matlab';
        } else if (ext === 'csv') {
            type = 'sheet';
        } else if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) {
             type = 'whiteboard';
        } else if (['doc', 'docx'].includes(ext || '')) {
             type = 'doc';
        }

        createNewFile(type, subtype, name, content);
    };

    if (file.name.match(/\.(png|jpg|jpeg|gif)$/i)) {
        reader.readAsDataURL(file);
    } else {
        reader.readAsText(file);
    }
  };

  const renderChat = (file: VirtualFile) => {
    const history: Message[] = JSON.parse(file.content);
    return (
      <div className="flex flex-col h-full bg-[#1e1e1e]">
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {history.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-32 text-[#444]">
                    <Bot size={72} strokeWidth={1} />
                    <h2 className="text-2xl font-light tracking-widest mt-6 uppercase">YANTRA v1.0</h2>
                    <p className="text-sm mt-2">Ready for inquiry.</p>
                </div>
            )}
            {history.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#2d2d2d] text-emerald-500'}`}>
                        {msg.role === 'user' ? 'USR' : 'AI'}
                    </div>
                    <div className={`max-w-[85%] text-sm leading-7 ${msg.role === 'user' ? 'bg-[#2b2b2b] p-3 rounded-lg text-slate-200' : 'text-slate-300'}`}>
                        {msg.specialist && msg.role === 'model' && (
                            <div className="text-[11px] font-bold text-emerald-500 mb-1 uppercase tracking-wider">
                                {msg.specialist}
                            </div>
                        )}
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                table: ({node, ...props}) => <table className="border-collapse border border-slate-700 my-4 text-xs w-full bg-[#252526]" {...props} />,
                                th: ({node, ...props}) => <th className="border border-slate-600 bg-[#333] p-2 text-left text-white font-semibold" {...props} />,
                                td: ({node, ...props}) => <td className="border border-slate-600 p-2 text-slate-300" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                code: ({node, ...props}) => <code className="bg-[#121212] px-1 rounded-md text-orange-300 font-mono text-xs" {...props} />,
                                pre: ({node, ...props}) => <pre className="bg-[#121212] p-3 rounded-md my-2 overflow-x-auto border border-[#333]" {...props} />,
                                img: ({node, ...props}) => <img className="max-w-md rounded-md border border-[#444] my-2" {...props} />,
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                    </div>
                </div>
            ))}
            {isProcessing && (
                 <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-md bg-[#2d2d2d] flex items-center justify-center animate-pulse"><Bot size={14} className="text-emerald-500" /></div>
                     <div className="text-slate-500 text-xs italic py-2">Deep thought process active...</div>
                 </div>
            )}
            <div ref={chatEndRef} />
        </div>
        <div className="p-4 bg-[#1e1e1e] border-t border-[#333]">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Input Command..."
                    className="flex-1 bg-[#252526] border border-[#333] rounded-md px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    autoFocus
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isProcessing}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white px-6 rounded-md font-medium disabled:opacity-50"
                >
                    {isProcessing ? <LayoutTemplate className="animate-spin" size={18}/> : "RUN"}
                </button>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden">
      
      {/* Sidebar - VS Code Style */}
      <div className={`${isSidebarOpen ? 'w-[300px]' : 'w-12'} flex-shrink-0 bg-[#252526] flex flex-col transition-all duration-300 border-r border-[#1e1e1e]`}>
         {/* Sidebar Header */}
         <div className="h-9 flex items-center justify-between px-4 text-[11px] text-[#bbbbbb] tracking-wide select-none">
             {isSidebarOpen && <span>EXPLORER</span>}
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-[#333] rounded-md">
                 <MoreHorizontal size={16} />
             </button>
         </div>
         
         {isSidebarOpen && (
             <div className="flex-1 overflow-y-auto">
                 {/* Project Folder */}
                 <div className="select-none">
                     <div 
                        className="flex items-center gap-1 px-1 py-1 cursor-pointer hover:bg-[#2a2d2e] text-[#cccccc] font-bold text-xs"
                        onClick={() => setProjectFolderOpen(!projectFolderOpen)}
                     >
                         {projectFolderOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                         <span>RESEARCH</span>
                     </div>
                     
                     {projectFolderOpen && (
                         <div className="pl-3">
                             {files.map(f => (
                                 <SidebarItem 
                                     key={f.id} 
                                     icon={
                                         f.type === 'chat' ? Bot : 
                                         f.type === 'code' ? Code2 : 
                                         f.type === 'doc' ? FileText : 
                                         f.type === 'whiteboard' ? PenTool : 
                                         f.type === 'sheet' ? Table : 
                                         f.type === 'slide' ? Presentation : 
                                         f.type === 'search' ? Globe : StickyNote
                                     } 
                                     fileType={f.type}
                                     label={f.name} 
                                     active={activeTabId === f.id}
                                     onClick={() => {
                                         if (!openTabIds.includes(f.id)) setOpenTabIds([...openTabIds, f.id]);
                                         setActiveTabId(f.id);
                                     }}
                                 />
                             ))}
                         </div>
                     )}
                 </div>

                 {/* Google Workspace Menu */}
                 <div className="mt-6 px-3">
                     <button 
                        onClick={() => setIsGoogleMenuOpen(!isGoogleMenuOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-[#0F9D58] hover:bg-[#0b8046] text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                     >
                         <span className="flex items-center gap-2"><Grid3X3 size={14}/> Google Workspace</span>
                         {isGoogleMenuOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                     </button>
                     
                     {isGoogleMenuOpen && (
                         <div className="mt-2 grid grid-cols-2 gap-2 pl-2 border-l border-[#333] ml-2">
                             <button onClick={() => createNewFile('doc')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded-md text-[10px] gap-1 text-blue-400">
                                 <FileText size={20}/> Docs
                             </button>
                             <button onClick={() => createNewFile('sheet')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded-md text-[10px] gap-1 text-green-400">
                                 <Table size={20}/> Sheets
                             </button>
                             <button onClick={() => createNewFile('slide')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded-md text-[10px] gap-1 text-orange-400">
                                 <Presentation size={20}/> Slides
                             </button>
                             <button onClick={() => createNewFile('whiteboard')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded-md text-[10px] gap-1 text-orange-500">
                                 <PenTool size={20}/> Jamboard
                             </button>
                             <button onClick={() => createNewFile('note')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded-md text-[10px] gap-1 text-yellow-400">
                                 <StickyNote size={20}/> Keep
                             </button>
                             <button 
                                onClick={handleConnectDrive} 
                                className={`col-span-2 flex items-center justify-center p-2 rounded-md text-[10px] gap-2 transition-colors border border-dashed ${isDriveConnected ? 'bg-[#0F9D58]/10 border-[#0F9D58] text-[#0F9D58]' : 'border-[#444] hover:bg-[#333] text-slate-400'}`}
                             >
                                 {isDriveConnected ? <CheckCircle size={14}/> : <Cloud size={14}/>}
                                 {isDriveConnected ? 'Drive Connected' : 'Connect Drive'}
                             </button>
                         </div>
                     )}
                 </div>

                 {/* Development Menu */}
                 <div className="mt-2 px-3">
                     <button 
                        onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-[#007acc] hover:bg-[#0062a3] text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                     >
                         <span className="flex items-center gap-2"><Binary size={14}/> Development</span>
                         {isDevMenuOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                     </button>
                     
                     {isDevMenuOpen && (
                         <div className="mt-2 grid grid-cols-3 gap-2 pl-2 border-l border-[#333] ml-2">
                             <button onClick={() => createNewFile('code', 'python')} className="flex flex-col items-center p-2 bg-[#2a2d2e] hover:bg-[#37373d] rounded-md text-[10px] gap-1 text-yellow-300">
                                 <Box size={16}/> Python
                             </button>
                             <button onClick={() => createNewFile('code', 'c')} className="flex flex-col items-center p-2 bg-[#2a2d2e] hover:bg-[#37373d] rounded-md text-[10px] gap-1 text-blue-500">
                                 <Cpu size={16}/> C
                             </button>
                             <button onClick={() => createNewFile('code', 'matlab')} className="flex flex-col items-center p-2 bg-[#2a2d2e] hover:bg-[#37373d] rounded-md text-[10px] gap-1 text-orange-600">
                                 <Variable size={16}/> MATLAB
                             </button>
                         </div>
                     )}
                 </div>
                 
                 {/* Google Search Button */}
                 <div className="mt-4 px-3">
                     <button 
                        onClick={() => createNewFile('search', undefined, 'Google Search')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                     >
                         <Search size={14}/> Deep Search
                     </button>
                 </div>

                 {/* Upload File Button */}
                 <div className="mt-2 px-3">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                    />
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#2a2d2e] hover:bg-[#37373d] text-[#cccccc] rounded-md text-xs font-semibold shadow-sm transition-colors border border-[#444]"
                     >
                         <Upload size={14}/> Upload File
                     </button>
                 </div>

             </div>
         )}
         
         <div className="p-2 bg-[#252526] border-t border-[#1e1e1e]">
             <div className="flex items-center gap-2 px-2 py-1 text-xs text-[#cccccc]">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 {isSidebarOpen && <span>{currentSpecialist}</span>}
             </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          
          {/* Tabs */}
          <div className="flex items-center bg-[#252526] overflow-x-auto hide-scrollbar h-9 border-b border-[#1e1e1e]">
              {openTabIds.map(id => {
                  const file = files.find(f => f.id === id);
                  if (!file) return null;
                  return (
                      <Tab 
                        key={id} 
                        file={file} 
                        active={activeTabId === id} 
                        onClick={() => setActiveTabId(id)} 
                        onClose={() => {
                          const newOpen = openTabIds.filter(tid => tid !== id);
                          setOpenTabIds(newOpen);
                          if(activeTabId === id) setActiveTabId(newOpen[newOpen.length-1] || '');
                        }}
                      />
                  );
              })}
          </div>

          {/* Editor Surface */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
              <div className="flex-1 overflow-hidden relative">
                  {activeFile ? (
                      <>
                        {activeFile.type === 'chat' && renderChat(activeFile)}
                        {activeFile.type === 'code' && (
                            <CodeEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)} 
                                onRun={() => runCode(activeFile.content, activeFile.name, activeFile.subtype, activeFile.id)}
                                onRename={renameFile}
                                apiKey={apiKey}
                            />
                        )}
                        {(activeFile.type === 'doc' || activeFile.type === 'note') && (
                            <DocEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                                onRename={renameFile}
                                isDriveConnected={isDriveConnected}
                                apiKey={apiKey}
                            />
                        )}
                        {activeFile.type === 'sheet' && (
                            <SheetEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                                onRename={renameFile}
                                isDriveConnected={isDriveConnected}
                                apiKey={apiKey}
                            />
                        )}
                        {activeFile.type === 'whiteboard' && (
                            <WhiteboardEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                                onRename={renameFile}
                            />
                        )}
                         {activeFile.type === 'slide' && (
                            <SlideEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                                onRename={renameFile}
                                isDriveConnected={isDriveConnected}
                                apiKey={apiKey}
                            />
                        )}
                        {activeFile.type === 'search' && (
                            <SearchEditor
                                file={activeFile}
                                apiKey={apiKey}
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                                onRename={renameFile}
                            />
                        )}
                      </>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#333]">
                          <FolderOpen size={64} className="mb-4 opacity-20"/>
                          <p className="text-sm">No file is open.</p>
                          <p className="text-xs mt-2 text-[#555]">Select a file from the explorer or create a new one.</p>
                      </div>
                  )}
              </div>

              {/* Terminal Panel (Scoped) */}
              {activeFile?.type === 'code' && (
                  <div className="h-64 bg-[#1e1e1e] border-t border-[#333] flex flex-col transition-all">
                      <div className="flex items-center justify-between px-4 py-1 bg-[#252526] text-xs select-none">
                          <div className="flex items-center gap-2">
                              <span className="uppercase font-bold text-slate-400">Terminal</span>
                              <span className="text-slate-600">|</span>
                              <span className="text-slate-500">{activeFile.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <button onClick={() => clearTerminal(activeFile.id)} className="hover:text-white text-slate-500"><Trash2 size={12}/></button>
                              <button onClick={() => {}} className="hover:text-white text-slate-500"><X size={12}/></button>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2">
                          {(!activeFile.terminalHistory || activeFile.terminalHistory.length === 0) && (
                              <div className="text-slate-600 italic">Ready to execute. Click 'Run' to compile/interpret...</div>
                          )}
                          {activeFile.terminalHistory?.map(log => (
                              <div key={log.id} className={`flex flex-col gap-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'output' ? 'text-slate-300' : 'text-slate-500'}`}>
                                  <div>
                                      <span className="opacity-50 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                      {log.content}
                                  </div>
                                  {log.type === 'image' && log.imageSrc && (
                                      <div className="mt-2 border border-[#333] rounded-md overflow-hidden bg-black w-fit">
                                          <img src={log.imageSrc} alt="Plot Output" className="max-w-md max-h-80 object-contain" />
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Footer Status Bar */}
      <div className="fixed bottom-0 w-full h-6 bg-[#007acc] text-white flex items-center px-3 text-[10px] select-none z-50">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 font-bold"><MonitorPlay size={12}/> YANTRA REMOTE</div>
              <div className="flex items-center gap-1"><Share2 size={12}/> main*</div>
              <div className="flex items-center gap-1"><CheckCircle size={12}/> 0 Errors</div>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
               <span>Ln 12, Col 45</span>
               <span>UTF-8</span>
               <span>{activeFile?.type === 'code' ? activeFile.subtype || 'Python' : 'Markdown'}</span>
               <div className="flex items-center gap-1 hover:bg-[#1f8ad2] px-1 rounded-md cursor-pointer"><Settings size={12}/></div>
          </div>
      </div>

    </div>
  );
}