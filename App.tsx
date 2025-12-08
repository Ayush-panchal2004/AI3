import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Table
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---

type FileType = 'chat' | 'code' | 'doc' | 'whiteboard' | 'sheet' | 'slide' | 'note';

interface VirtualFile {
  id: string;
  name: string;
  type: FileType;
  content: string; // For text/code/doc
  data?: any; // For structured data 
}

interface Message {
  role: 'user' | 'model';
  text: string;
  specialist?: string;
  timestamp: number;
}

interface TerminalOutput {
  id: string;
  type: 'info' | 'error' | 'success' | 'output';
  content: string;
  timestamp: number;
}

// --- Constants ---

const SYSTEM_INSTRUCTION = `
You are the intelligence engine for "OmniScience", a unified research workspace.
You are NOT a chatbot. You are a collection of 51 Specialized AI Agents working in unison.
Your Primary Persona is **Specialist #0: The Liaison**.

**CORE PROTOCOLS:**
1.  **DEEP SYNC**: You have full access to the user's workspace. You can READ all open files and WRITE to them.
2.  **ACTION OVER CHAT**: If the user asks for a summary, paper, or code, DO NOT just dump it in the chat. CREATE A FILE or UPDATE THE ACTIVE FILE.
3.  **SPECIALIST DELEGATION**: Explicitly state which specialist is acting.
    - Coding -> **The Pythonista**
    - Physics -> **The Quantum Mechanic**
    - Writing -> **The Documentarian**
    - Planning -> **The Orchestrator**

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
- If the user wants a research paper, create a ".doc" file and fill it with academic-standard content (LaTeX formatted math).
- Use Markdown tables for structured data in chat.
`;

// --- Components ---

const SidebarItem = ({ icon: Icon, label, onClick, active, fileType }: any) => (
  <div 
    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm transition-colors group relative cursor-pointer ${active ? 'bg-[#37373d] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}`}
    onClick={onClick}
  >
    <Icon size={14} className={
        fileType === 'chat' ? 'text-indigo-400' :
        fileType === 'code' ? 'text-yellow-400' :
        fileType === 'sheet' ? 'text-green-400' :
        fileType === 'doc' ? 'text-blue-400' :
        fileType === 'slide' ? 'text-orange-400' :
        'text-slate-400'
    } />
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
    <span className="truncate text-xs flex-1">{file.name}</span>
    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded text-slate-400">
      <X size={12} />
    </button>
  </div>
);

// --- Editors ---

const CodeEditor = ({ file, onChange, onRun }: any) => (
  <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center justify-between p-2 bg-[#1e1e1e] border-b border-[#333] text-xs text-slate-400">
          <span className="font-mono text-indigo-400 flex items-center gap-2"><Code2 size={12}/> {file.name}</span>
          <button onClick={onRun} className="flex items-center gap-1 px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded-sm transition-colors font-semibold">
            <Play size={10} fill="currentColor"/> Run Script
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

const DocEditor = ({ file, onChange }: any) => (
  <div className="flex flex-col h-full bg-[#f0f0f0] overflow-y-auto items-center p-8">
       <div className="w-full max-w-[850px] bg-white min-h-[1100px] shadow-sm border border-slate-200 p-[72px] text-slate-900">
           <div className="mb-4">
               <input 
                  value={file.name.replace('.doc', '')}
                  onChange={(e) => { /* Rename logic */ }}
                  className="text-3xl font-bold w-full outline-none placeholder-slate-300 font-serif"
                  placeholder="Untitled Research"
               />
               <div className="text-sm text-slate-400 mt-1 font-serif italic">Last edit: Just now</div>
           </div>
           <textarea 
              value={file.content}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-full min-h-[900px] text-[11pt] resize-none focus:outline-none font-serif leading-relaxed"
              placeholder="Begin typing your research..."
           />
       </div>
  </div>
);

const SlideEditor = ({ file, onChange }: any) => (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="aspect-[16/9] h-[80%] bg-white shadow-xl flex flex-col p-12 border border-slate-200">
                <input 
                   className="text-4xl font-bold mb-8 outline-none placeholder-slate-300" 
                   placeholder="Click to add title"
                   value={file.content.split('\n')[0] || ''}
                   onChange={(e) => {
                       const lines = file.content.split('\n');
                       lines[0] = e.target.value;
                       onChange(lines.join('\n'));
                   }}
                />
                <textarea 
                    className="flex-1 text-2xl resize-none outline-none placeholder-slate-200"
                    placeholder="Click to add subtitle"
                    value={file.content.split('\n').slice(1).join('\n')}
                    onChange={(e) => {
                        const lines = file.content.split('\n');
                        const rest = e.target.value;
                        onChange(lines[0] + '\n' + rest);
                    }}
                />
            </div>
        </div>
        <div className="h-40 bg-white border-t flex items-center px-4 gap-4 overflow-x-auto">
            {[1,2,3].map(i => (
                <div key={i} className="aspect-[16/9] h-24 bg-slate-100 border hover:border-orange-500 cursor-pointer flex items-center justify-center text-slate-400">
                    Slide {i}
                </div>
            ))}
            <div className="h-24 aspect-[16/9] border-2 border-dashed flex items-center justify-center text-slate-300 cursor-pointer hover:bg-slate-50">
                <Plus size={24}/>
            </div>
        </div>
    </div>
);

const SheetEditor = ({ file, onChange }: any) => {
  const rows = file.content.split('\n').map((row: string) => row.split(','));
  const ensureGrid = () => {
    while(rows.length < 50) rows.push(new Array(10).fill(''));
    rows.forEach((r: any[]) => { while(r.length < 20) r.push(''); });
    return rows;
  };
  const grid = ensureGrid();

  const handleCellChange = (r: number, c: number, val: string) => {
    const newGrid = [...grid];
    newGrid[r][c] = val;
    onChange(newGrid.map((row: any[]) => row.join(',')).join('\n'));
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
        <div className="flex border-b">
             <div className="w-10 bg-slate-50 border-r flex items-center justify-center text-xs text-slate-400">#</div>
             <div className="flex-1 flex overflow-hidden">
                {grid[0].map((_: any, i: number) => (
                   <div key={i} className="min-w-[100px] bg-slate-50 border-r text-center text-xs font-bold text-slate-600 py-1 flex items-center justify-center">
                     {String.fromCharCode(65 + i)}
                   </div>
                ))}
             </div>
        </div>
        <div className="flex-1 overflow-auto">
          {grid.map((row: any[], r: number) => (
            <div key={r} className="flex h-8 border-b">
               <div className="w-10 min-w-[40px] bg-slate-50 border-r text-center text-xs text-slate-500 flex items-center justify-center">{r + 1}</div>
               {row.map((cell: string, c: number) => (
                  <input 
                    key={`${r}-${c}`}
                    value={cell}
                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                    className="min-w-[100px] border-r px-2 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
               ))}
            </div>
          ))}
        </div>
    </div>
  );
};

const WhiteboardEditor = ({ file, onChange }: any) => {
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
    <div className="flex flex-col h-full bg-[#f8f9fa] relative">
        <div className="absolute top-4 left-4 bg-white shadow rounded-lg p-2 flex gap-2 z-10 border">
             <button className="p-2 hover:bg-slate-100 rounded text-slate-600"><PenTool size={16}/></button>
             <button className="p-2 hover:bg-slate-100 rounded text-slate-600"><Eraser size={16}/></button>
             <div className="w-px bg-slate-200"></div>
             <button className="p-2 hover:bg-slate-100 rounded text-slate-600" onClick={() => {
                 const ctx = canvasRef.current?.getContext('2d');
                 if(ctx) { ctx.fillStyle="#fff"; ctx.fillRect(0,0,2000,2000); save(); }
             }}>Clear</button>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
           <canvas 
              ref={canvasRef}
              width={1600}
              height={1200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="bg-white shadow-xl cursor-crosshair"
           />
        </div>
    </div>
  );
};


// --- Main App ---

export default function App() {
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [files, setFiles] = useState<VirtualFile[]>([
    { id: '1', name: 'MWI_Chat', type: 'chat', content: JSON.stringify([]) },
  ]);
  const [openTabIds, setOpenTabIds] = useState<string[]>(['1']);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGoogleMenuOpen, setIsGoogleMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSpecialist, setCurrentSpecialist] = useState("The Liaison");
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [projectFolderOpen, setProjectFolderOpen] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeFile = files.find(f => f.id === activeTabId);

  // -- Helpers --

  const addTerminalLog = (content: string, type: 'info' | 'error' | 'success' | 'output' = 'info') => {
    setTerminalOutput(prev => [...prev, { id: Math.random().toString(), content, type, timestamp: Date.now() }]);
  };

  const createNewFile = (type: FileType, name?: string, content: string = '') => {
    const newId = Math.random().toString(36).substr(2, 9);
    const extensions: Record<string, string> = { 
        code: 'py', doc: 'doc', sheet: 'csv', whiteboard: 'board', chat: 'chat', slide: 'slide', note: 'txt' 
    };
    const fileName = name || `Untitled.${extensions[type]}`;
    
    const initialContent = content || (
        type === 'sheet' ? 'Header 1,Header 2,Header 3\nData 1,Data 2,Data 3' : 
        type === 'chat' ? '[]' : 
        type === 'code' ? '# New Script' : 
        type === 'slide' ? 'Title Slide\nSubtitle goes here' : ''
    );

    const newFile: VirtualFile = {
      id: newId,
      name: fileName,
      type,
      content: initialContent
    };
    setFiles(prev => [...prev, newFile]);
    setOpenTabIds(prev => [...prev, newId]);
    setActiveTabId(newId);
    setIsGoogleMenuOpen(false); // Close menu if open
    return newId;
  };

  const updateFileContent = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
  };

  const runCode = async (code: string, fileName: string) => {
    addTerminalLog(`> Executing ${fileName}...`, 'info');
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `ACT AS A PYTHON INTERPRETER. Execute:\n${code}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
      });
      addTerminalLog(response.text || "No output", 'output');
    } catch (error: any) {
      addTerminalLog(`Execution failed: ${error.message}`, 'error');
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
      const specialistName = specMatch ? specMatch[1].replace(':', '') : "The Liaison";
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
            createNewFile(actionData.file_type, actionData.file_name, actionData.content);
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

  const renderChat = (file: VirtualFile) => {
    const history: Message[] = JSON.parse(file.content);
    return (
      <div className="flex flex-col h-full bg-[#1e1e1e]">
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {history.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-32 text-[#444]">
                    <Bot size={72} strokeWidth={1} />
                    <h2 className="text-2xl font-light tracking-widest mt-6 uppercase">OmniScience v2.1</h2>
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
                                table: ({node, ...props}) => <table className="border-collapse border border-slate-700 my-4 text-xs w-full" {...props} />,
                                th: ({node, ...props}) => <th className="border border-slate-700 bg-[#252526] p-2 text-left text-slate-200 font-semibold" {...props} />,
                                td: ({node, ...props}) => <td className="border border-slate-700 p-2 text-slate-400" {...props} />,
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
                                         f.type === 'slide' ? Presentation : StickyNote
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
                             <button onClick={() => createNewFile('chat')} className="flex flex-col items-center p-3 bg-[#2a2d2e] hover:bg-[#37373d] rounded text-[10px] gap-1 text-indigo-400">
                                 <Bot size={20}/> Assistant
                             </button>
                         </div>
                     )}
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
                                onRun={() => runCode(activeFile.content, activeFile.name)}
                            />
                        )}
                        {(activeFile.type === 'doc' || activeFile.type === 'note') && (
                            <DocEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                            />
                        )}
                        {activeFile.type === 'sheet' && (
                            <SheetEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                            />
                        )}
                        {activeFile.type === 'whiteboard' && (
                            <WhiteboardEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
                            />
                        )}
                         {activeFile.type === 'slide' && (
                            <SlideEditor 
                                file={activeFile} 
                                onChange={(val: string) => updateFileContent(activeFile.id, val)}
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
                              <span className="hover:text-white cursor-pointer">Debug Console</span>
                          </div>
                          <button onClick={() => setTerminalOutput([])} className="text-xs text-slate-500 hover:text-white"><Eraser size={12}/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
                          {terminalOutput.length === 0 && <div className="text-slate-600 italic">Ready for input...</div>}
                          {terminalOutput.map((log) => (
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
                  <span className="font-semibold flex items-center gap-1"><MonitorPlay size={10}/> OMNISCIENCE REMOTE</span>
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