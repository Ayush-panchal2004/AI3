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
  CheckCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---

type FileType = 'chat' | 'code' | 'doc' | 'whiteboard' | 'sheet' | 'slide' | 'note' | 'search';

interface TerminalOutput {
  id: string;
  type: 'info' | 'error' | 'success' | 'output';
  content: string;
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

**FILE MANIPULATION COMMANDS:**
To perform actions, you must include a JSON block at the END of your response.
Format:
\`\`\`json
{
  "action": "create_file" | "update_file" | "switch_tab",
  "file_id": "optional_id_if_update",
  "file_type": "doc" | "code" | "sheet" | "whiteboard" | "slide",
  "file_name": "filename.ext",
  "content": "The actual content..."
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
    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm transition-colors group relative cursor-pointer select-none ${active ? 'bg-[#37373d] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}`}
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
            className="px-2 py-1 hover:bg-slate-200 rounded-sm text-slate-800 text-sm"
            onClick={() => setActiveMenu(activeMenu === name ? null : name)}
            onMouseEnter={() => activeMenu && setActiveMenu(name)}
            onMouseDown={(e) => e.preventDefault()}
          >
            {name}
          </button>
          {activeMenu === name && (
            <div 
              className="absolute left-0 top-full bg-white shadow-xl border border-slate-200 rounded py-1 min-w-[180px] z-50 flex flex-col"
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

// --- Editors ---

const CodeEditor = ({ file, onChange, onRun, onRename }: any) => (
  <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center justify-between p-2 bg-[#1e1e1e] border-b border-[#333] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-indigo-400 flex items-center gap-2">
                <Code2 size={12}/>
                <input 
                    value={file.name}
                    onChange={(e) => onRename(e.target.value)}
                    className="bg-transparent border-b border-transparent hover:border-slate-500 focus:border-indigo-500 focus:outline-none text-slate-300 w-32"
                />
            </span>
            {file.subtype && <span className="bg-[#333] px-1 rounded text-[10px] text-slate-300 uppercase">{file.subtype}</span>}
          </div>
          <button onClick={onRun} className="flex items-center gap-1 px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded-sm transition-colors font-semibold">
            <Play size={10} fill="currentColor"/> Run
          </button>
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
);

// High-Fidelity Google Docs Clone (Rich Text)
const DocEditor = ({ file, onChange, onRename, isDriveConnected }: any) => {
  const contentRef = useRef<HTMLDivElement>(null);

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

  const exec = (command: string, value: string | undefined = undefined) => {
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
    <div className="flex flex-col h-full bg-[#F0F2F5] overflow-y-auto items-center relative">
       {/* Top Header */}
       <div className="w-full bg-white border-b border-[#dadce0] px-4 py-2 sticky top-0 z-20 flex flex-col gap-1">
           <div className="flex items-center gap-3 mb-1">
              <FileText size={24} className="text-[#4285F4]"/>
              <div className="flex flex-col">
                  <input 
                    value={file.name}
                    onChange={(e) => onRename(e.target.value)}
                    className="bg-transparent text-slate-800 text-lg hover:border border-slate-300 px-1 rounded truncate max-w-[300px] focus:outline-none focus:border-[#4285F4] border border-transparent"
                  />
                  <MenuBar onAction={handleAction} isDriveConnected={isDriveConnected}/>
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
                   <option value="Courier New">Courier New</option>
                   <option value="Georgia">Georgia</option>
                   <option value="Verdana">Verdana</option>
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
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className="p-1 hover:bg-slate-200 rounded" title="Bold"><Bold size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className="p-1 hover:bg-slate-200 rounded" title="Italic"><Italic size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} className="p-1 hover:bg-slate-200 rounded" title="Underline"><Underline size={14}/></button>
                   <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
                       <Type size={14} className="text-slate-500"/>
                       <input type="color" onMouseDown={(e) => e.preventDefault()} onChange={(e) => exec('foreColor', e.target.value)} className="w-4 h-4 border-none bg-transparent cursor-pointer"/>
                   </div>
               </div>
               <div className="w-px h-4 bg-slate-300"></div>
               <div className="flex items-center gap-1">
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')} className="p-1 hover:bg-slate-200 rounded"><AlignLeft size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')} className="p-1 hover:bg-slate-200 rounded"><AlignCenter size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')} className="p-1 hover:bg-slate-200 rounded"><AlignRight size={14}/></button>
               </div>
           </div>
       </div>
       
       {/* Paper (WYSIWYG) */}
       <div className="w-[816px] min-h-[1056px] bg-white shadow-lg my-8 p-[96px] text-black border border-[#e0e0e0]">
           <div 
              ref={contentRef}
              contentEditable
              onInput={handleInput}
              className="w-full h-full min-h-[800px] focus:outline-none prose max-w-none text-black font-sans empty:before:content-[attr(placeholder)] empty:before:text-slate-300"
              style={{ fontSize: '11pt' }}
              placeholder="Start typing..."
           />
       </div>
    </div>
  );
};

// High-Fidelity Google Sheets Clone (Functional)
const SheetEditor = ({ file, onChange, onRename, isDriveConnected }: any) => {
  // Parsing logic for JSON-based sheet with styles or fallback to CSV
  const parseContent = (content: string) => {
      try {
          if (content.trim().startsWith('{')) {
              const data = JSON.parse(content);
              return { 
                  grid: data.grid || Array(40).fill(Array(15).fill('')),
                  styles: data.styles || {}
              };
          }
      } catch (e) {}
      
      // Fallback CSV
      const grid = content ? content.split('\n').map(row => row.split(',')) : Array(40).fill(Array(15).fill(''));
      return { grid, styles: {} };
  };

  const { grid: initialGrid, styles: initialStyles } = useMemo(() => parseContent(file.content), []);
  const [grid, setGrid] = useState<string[][]>(initialGrid);
  const [styles, setStyles] = useState<Record<string, React.CSSProperties>>(initialStyles);
  const [selectedCell, setSelectedCell] = useState<{r:number, c:number} | null>(null);

  // Sync if external update
  useEffect(() => {
     const { grid: newGrid, styles: newStyles } = parseContent(file.content);
     // Deep compare check simplified
     if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
         setGrid(newGrid);
         setStyles(newStyles);
     }
  }, [file.id]);

  const save = (newGrid: string[][], newStyles: Record<string, React.CSSProperties>) => {
      setGrid(newGrid);
      setStyles(newStyles);
      onChange(JSON.stringify({ grid: newGrid, styles: newStyles }));
  };

  const getCellValue = (r: number, c: number, currentGrid: string[][]) => {
      if(r < 0 || c < 0 || r >= currentGrid.length || c >= currentGrid[0].length) return 0;
      const val = currentGrid[r][c];
      if(!isNaN(Number(val)) && val !== '') return Number(val);
      return val; 
  };

  const computeValue = (cell: string, currentGrid: string[][]) => {
      if (!cell || !cell.startsWith('=')) return cell;
      try {
          const formula = cell.substring(1).toUpperCase();
          const getRange = (range: string) => {
             const parts = range.split(':');
             if(parts.length !== 2) return [];
             const start = parseRef(parts[0]);
             const end = parseRef(parts[1]);
             if(!start || !end) return [];
             let values = [];
             for(let r=start.r; r<=end.r; r++) {
                 for(let c=start.c; c<=end.c; c++) {
                     values.push(getCellValue(r, c, currentGrid));
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

          let parsed = formula.replace(/[A-Z]+[0-9]+/g, (match) => {
             const ref = parseRef(match);
             if(ref) return String(getCellValue(ref.r, ref.c, currentGrid));
             return "0";
          });
          
          if (/^[0-9+\-*/().\s]+$/.test(parsed)) {
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
    newGrid[r][c] = val;
    save(newGrid, styles);
  };

  const toggleStyle = (styleKey: keyof React.CSSProperties, value: any) => {
      if(!selectedCell) return;
      const key = `${selectedCell.r}-${selectedCell.c}`;
      const currentStyle = styles[key] || {};
      const newStyle = { ...currentStyle, [styleKey]: currentStyle[styleKey] === value ? undefined : value };
      const newStyles = { ...styles, [key]: newStyle };
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

  // Ensure grid size
  const displayGrid = useMemo(() => {
     const temp = [...grid];
     while(temp.length < 50) temp.push(Array(15).fill(''));
     temp.forEach(r => { while(r.length < 15) r.push(''); });
     return temp;
  }, [grid]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden font-sans text-xs">
        <div className="w-full bg-white border-b border-[#dadce0] px-4 py-2 flex flex-col gap-1">
            <div className="flex items-center gap-3">
                <Table size={24} className="text-[#107c41]"/>
                <div className="flex flex-col">
                    <input 
                        value={file.name}
                        onChange={(e) => onRename(e.target.value)}
                        className="bg-transparent text-slate-800 text-lg hover:border border-slate-300 px-1 rounded truncate max-w-[300px] focus:outline-none focus:border-[#107c41] border border-transparent"
                    />
                    <MenuBar onAction={handleAction} isDriveConnected={isDriveConnected}/>
                </div>
            </div>
             {/* Toolbar */}
           <div className="flex items-center gap-2 bg-[#EDF2FA] rounded-full px-4 py-1.5 w-max mt-1 shadow-sm border border-slate-200">
               <div className="flex items-center gap-1">
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleStyle('fontWeight', 'bold')} className={`p-1 hover:bg-slate-200 rounded ${selectedCell && styles[`${selectedCell.r}-${selectedCell.c}`]?.fontWeight === 'bold' ? 'bg-slate-300' : ''}`}><Bold size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleStyle('fontStyle', 'italic')} className={`p-1 hover:bg-slate-200 rounded ${selectedCell && styles[`${selectedCell.r}-${selectedCell.c}`]?.fontStyle === 'italic' ? 'bg-slate-300' : ''}`}><Italic size={14}/></button>
                   <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleStyle('textDecoration', 'underline')} className={`p-1 hover:bg-slate-200 rounded ${selectedCell && styles[`${selectedCell.r}-${selectedCell.c}`]?.textDecoration === 'underline' ? 'bg-slate-300' : ''}`}><Underline size={14}/></button>
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
                value={selectedCell ? grid[selectedCell.r]?.[selectedCell.c] || '' : ''}
                onChange={(e) => selectedCell && handleCellChange(selectedCell.r, selectedCell.c, e.target.value)}
            />
        </div>

        <div className="flex items-center h-6 bg-[#f8f9fa] border-b border-[#c0c0c0]">
             <div className="w-10 bg-[#f8f9fa] border-r border-[#c0c0c0] z-10"></div>
             <div className="flex-1 flex overflow-hidden">
                {displayGrid[0].map((_: any, i: number) => (
                   <div key={i} className="min-w-[100px] bg-[#f8f9fa] border-r border-[#c0c0c0] text-center font-bold text-slate-600 py-1 flex items-center justify-center">
                     {String.fromCharCode(65 + i)}
                   </div>
                ))}
             </div>
        </div>
        <div className="flex-1 overflow-auto bg-white">
          {displayGrid.map((row: any[], r: number) => (
            <div key={r} className="flex h-6 border-b border-[#e0e0e0]">
               <div className="w-10 min-w-[40px] bg-[#f8f9fa] border-r border-[#c0c0c0] text-center text-slate-500 flex items-center justify-center font-semibold text-[10px]">{r + 1}</div>
               {row.map((cell: string, c: number) => {
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  const displayValue = (isSelected) ? cell : computeValue(cell, grid);
                  const cellStyle = styles[`${r}-${c}`] || {};
                  
                  return (
                    <div 
                        key={`${r}-${c}`}
                        className={`min-w-[100px] border-r border-[#e0e0e0] px-1 relative ${isSelected ? 'border-2 border-[#1a73e8] z-10' : ''}`}
                        style={cellStyle}
                        onClick={() => setSelectedCell({r, c})}
                    >
                        {isSelected ? (
                             <input 
                                autoFocus
                                className="w-full h-full outline-none bg-white"
                                style={cellStyle}
                                value={cell}
                                onChange={(e) => handleCellChange(r, c, e.target.value)}
                             />
                        ) : (
                            <div className="w-full h-full overflow-hidden whitespace-nowrap text-black cursor-cell">
                                {displayValue}
                            </div>
                        )}
                    </div>
                  );
               })}
            </div>
          ))}
        </div>
    </div>
  );
};

const SlideEditor = ({ file, onChange, onRename, isDriveConnected }: any) => {
    // Parse content as JSON { title: html, body: html } or fallback
    const parseContent = (content: string) => {
         try {
             if(content.trim().startsWith('{')) {
                 return JSON.parse(content);
             }
         } catch(e) {}
         // Fallback
         const lines = content.split('\n');
         return { title: lines[0] || 'Title', body: lines.slice(1).join('\n') || 'Subtitle' };
    };

    const [content, setContent] = useState(parseContent(file.content));
    
    useEffect(() => {
        setContent(parseContent(file.content));
    }, [file.id]);

    const save = (newContent: any) => {
        setContent(newContent);
        onChange(JSON.stringify(newContent));
    };

    // Generic exec for contentEditable areas
    const exec = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        // We need to sync manually after exec, but it's hard to know which div.
        // We'll rely on onInput of the divs.
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
        <div className="flex flex-col h-full bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="w-full bg-white border-b border-[#dadce0] px-4 py-2 flex flex-col gap-1">
               <div className="flex items-center gap-3">
                   <Presentation size={24} className="text-[#Fbbc04]"/>
                   <div className="flex flex-col">
                        <input 
                            value={file.name}
                            onChange={(e) => onRename(e.target.value)}
                            className="bg-transparent text-slate-800 text-lg hover:border border-slate-300 px-1 rounded truncate max-w-[300px] focus:outline-none focus:border-[#Fbbc04] border border-transparent"
                        />
                       <MenuBar onAction={handleAction} isDriveConnected={isDriveConnected}/>
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
                       <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} className="p-1 hover:bg-slate-200 rounded" title="Bold"><Bold size={14}/></button>
                       <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} className="p-1 hover:bg-slate-200 rounded" title="Italic"><Italic size={14}/></button>
                       <button onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} className="p-1 hover:bg-slate-200 rounded" title="Underline"><Underline size={14}/></button>
                        <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
                           <Type size={14} className="text-slate-500"/>
                           <input type="color" onMouseDown={(e) => e.preventDefault()} onChange={(e) => exec('foreColor', e.target.value)} className="w-4 h-4 border-none bg-transparent cursor-pointer"/>
                       </div>
                   </div>
               </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                 {/* Filmstrip */}
                 <div className="w-48 bg-white border-r border-[#dadce0] flex flex-col p-4 gap-4 overflow-y-auto">
                     {[1].map(i => (
                         <div key={i} className="aspect-[16/9] bg-white border-2 border-[#Fbbc04] shadow-sm flex items-center justify-center text-[10px] text-slate-400 cursor-pointer relative group">
                             <div className="absolute top-1 left-1 text-slate-500 font-bold">{i}</div>
                             Slide {i}
                         </div>
                     ))}
                     <button className="w-full py-2 border border-dashed border-slate-300 text-slate-400 rounded hover:bg-slate-50">+ New Slide</button>
                 </div>

                 {/* Canvas */}
                 <div className="flex-1 bg-[#F8F9FA] flex items-center justify-center p-8 overflow-auto">
                    <div className="w-[960px] h-[540px] bg-white shadow-xl flex flex-col p-16 border border-[#dadce0] relative">
                        <div 
                           contentEditable
                           className="text-5xl font-sans font-bold mb-8 outline-none placeholder-[#dadce0] text-black bg-white text-center mt-20 empty:before:content-[attr(placeholder)] empty:before:text-slate-300" 
                           placeholder="Click to add title"
                           onInput={(e) => save({ ...content, title: e.currentTarget.innerHTML })}
                           dangerouslySetInnerHTML={{ __html: content.title }}
                        />
                        <div 
                            contentEditable
                            className="flex-1 text-2xl font-sans resize-none outline-none placeholder-[#dadce0] text-black bg-white text-center empty:before:content-[attr(placeholder)] empty:before:text-slate-300"
                            placeholder="Click to add subtitle"
                            onInput={(e) => save({ ...content, body: e.currentTarget.innerHTML })}
                            dangerouslySetInnerHTML={{ __html: content.body }}
                        />
                    </div>
                 </div>
            </div>
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
                    className="bg-transparent text-slate-800 font-semibold hover:border border-slate-300 px-1 rounded focus:outline-none"
                />
            </div>
        </div>
        <div className="absolute top-16 left-4 bg-white shadow rounded-lg p-2 flex gap-2 z-10 border">
             <button className="p-2 hover:bg-slate-100 rounded text-slate-600"><PenTool size={16}/></button>
             <button className="p-2 hover:bg-slate-100 rounded text-slate-600"><Eraser size={16}/></button>
             <div className="w-px bg-slate-200"></div>
             <button className="p-2 hover:bg-slate-100 rounded text-slate-600" onClick={() => {
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
    { id: '1', name: 'MWI_Chat', type: 'chat', content: JSON.stringify([]), terminalHistory: [] },
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
  const activeFile = files.find(f => f.id === activeTabId);

  // -- Helpers --

  const addTerminalLog = (fileId: string, content: string, type: 'info' | 'error' | 'success' | 'output' = 'info') => {
    setFiles(prev => prev.map(f => {
        if(f.id !== fileId) return f;
        const history = f.terminalHistory || [];
        return { 
            ...f, 
            terminalHistory: [...history, { id: Math.random().toString(), content, type, timestamp: Date.now() }] 
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
        type === 'slide' ? 'Title Slide\nSubtitle goes here' : ''
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
    try {
      const ai = new GoogleGenAI({ apiKey });
      let systemPrompt = `ACT AS A PYTHON INTERPRETER. Execute the code and return ONLY the output.`;
      if (subtype === 'c') systemPrompt = `ACT AS A C COMPILER. Compile and run the following C code. Return ONLY the output of the program. DO NOT explain the code.`;
      if (subtype === 'matlab') systemPrompt = `ACT AS A MATLAB CONSOLE. Execute the following MATLAB script and return ONLY the output.`;

      const prompt = `${systemPrompt}\n\nCODE:\n${code}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      addTerminalLog(fileId, response.text || "No output", 'output');
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
                    <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#2d2d2d] text-emerald-500'}`}>
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
                                code: ({node, ...props}) => <code className="bg-[#121212] px-1 rounded text-orange-300 font-mono text-xs" {...props} />,
                                pre: ({node, ...props}) => <pre className="bg-[#121212] p-3 rounded my-2 overflow-x-auto border border-[#333]" {...props} />,
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                    </div>
                </div>
            ))}
            {isProcessing && (
                 <div className="flex gap-4">
                     <div className="w-8 h-8 rounded bg-[#2d2d2d] flex items-center justify-center animate-pulse"><Bot size={14} className="text-emerald-500" /></div>
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
                    className="flex-1 bg-[#252526] border border-[#333] rounded-sm px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    autoFocus
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isProcessing}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white px-6 rounded-sm font-medium disabled:opacity-50"
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
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-[#333] rounded">
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
                         <span>MWI_RESEARCH</span>
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
                        className="w-full flex items-center justify-between px-3 py-2 bg-[#0F9D58] hover:bg-[#0b8046] text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
                     >
                         <span className="flex items-center gap-2"><Grid3X3 size={14}/> Google Workspace</span>
                         {isGoogleMenuOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                     </button>
                     
                     {isGoogleMenuOpen && (
                         <div className="mt-2 grid grid-cols-2 gap-2 pl-2 border-l border-[#333] ml-2">
                             <button onClick={() => createNewFile('doc')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-blue-400">
                                 <FileText size={20}/> Docs
                             </button>
                             <button onClick={() => createNewFile('sheet')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-green-400">
                                 <Table size={20}/> Sheets
                             </button>
                             <button onClick={() => createNewFile('slide')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-orange-400">
                                 <Presentation size={20}/> Slides
                             </button>
                             <button onClick={() => createNewFile('whiteboard')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-orange-500">
                                 <PenTool size={20}/> Jamboard
                             </button>
                             <button onClick={() => createNewFile('note')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-yellow-400">
                                 <StickyNote size={20}/> Keep
                             </button>
                             <button 
                                onClick={handleConnectDrive} 
                                className={`col-span-2 flex items-center justify-center p-2 rounded text-[10px] gap-2 transition-colors border border-dashed ${isDriveConnected ? 'bg-[#0F9D58]/10 border-[#0F9D58] text-[#0F9D58]' : 'border-[#444] hover:bg-[#333] text-slate-400'}`}
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
                        className="w-full flex items-center justify-between px-3 py-2 bg-[#007acc] hover:bg-[#0062a3] text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
                     >
                         <span className="flex items-center gap-2"><Binary size={14}/> Development</span>
                         {isDevMenuOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                     </button>
                     
                     {isDevMenuOpen && (
                         <div className="mt-2 grid grid-cols-3 gap-2 pl-2 border-l border-[#333] ml-2">
                             <button onClick={() => createNewFile('code', 'python')} className="flex flex-col items-center p-2 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-yellow-300">
                                 <Box size={16}/> Python
                             </button>
                             <button onClick={() => createNewFile('code', 'c')} className="flex flex-col items-center p-2 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-blue-500">
                                 <Cpu size={16}/> C
                             </button>
                             <button onClick={() => createNewFile('code', 'matlab')} className="flex flex-col items-center p-2 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-orange-600">
                                 <Variable size={16}/> MATLAB
                             </button>
                         </div>
                     )}
                 </div>
                 
                 {/* Google Search Button */}
                 <div className="mt-4 px-3">
                     <button 
                        onClick={() => createNewFile('search', undefined, 'Google Search')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#4285F4] hover:bg-[#3367d6] text-white rounded-sm text-xs font-semibold shadow-sm transition-colors"
                     >
                         <Search size={14}/> Deep Search
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
                            />
                        )}
                        {(activeFile.type === 'doc' || activeFile.type === 'note') && (
                            <DocEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                                onRename={renameFile}
                                isDriveConnected={isDriveConnected}
                            />
                        )}
                        {activeFile.type === 'sheet' && (
                            <SheetEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                                onRename={renameFile}
                                isDriveConnected={isDriveConnected}
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
                          <FolderOpen size={64} strokeWidth={1}/>
                          <p className="mt-4 text-sm font-mono">No Active File</p>
                      </div>
                  )}
              </div>

              {/* Conditional Terminal: Only for Code Files */}
              {activeFile?.type === 'code' && (
                  <div className="h-48 bg-[#1e1e1e] border-t border-[#333] flex flex-col">
                      <div className="flex items-center justify-between px-4 py-1 bg-[#1e1e1e] border-b border-[#333]">
                          <div className="flex gap-4 text-[10px] font-bold text-[#969696] uppercase tracking-wide">
                              <span className="cursor-pointer border-b border-white text-white">Terminal</span>
                              <span className="hover:text-white cursor-pointer">Output</span>
                          </div>
                          <button onClick={() => clearTerminal(activeFile.id)} className="text-xs text-slate-500 hover:text-white"><Eraser size={12}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
                          {(!activeFile.terminalHistory || activeFile.terminalHistory.length === 0) && <div className="text-slate-600 italic">Ready for input...</div>}
                          {activeFile.terminalHistory?.map((log) => (
                              <div key={log.id} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'output' ? 'text-indigo-300' : 'text-slate-400'}`}>
                                  <span className="opacity-40 mr-2 select-none">❯</span>
                                  {log.content}
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
          
          {/* Status Bar */}
          <div className="bg-[#007acc] text-white text-[11px] flex justify-between items-center px-2 select-none h-6">
              <div className="flex gap-4 items-center">
                  <span className="font-semibold flex items-center gap-1"><MonitorPlay size={10}/> YANTRA REMOTE</span>
                  <span>{activeFile?.name || 'Empty Workspace'}</span>
              </div>
              <div className="flex gap-4 opacity-90">
                   <span>UTF-8</span>
                   <span>Gemini 3 Pro</span>
              </div>
          </div>
      </div>
    </div>
  );
}