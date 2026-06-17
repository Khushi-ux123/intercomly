import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  HelpCircle, 
  FileText, 
  BookOpen, 
  Layers, 
  Compass, 
  Cpu, 
  Sparkles, 
  ShieldAlert, 
  MessageSquare, 
  User, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Shield,
  Clock,
  ArrowDownCircle,
  AlertOctagon,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Documentation content structures
interface DocArticle {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<any>;
  content: string;
  keywords: string;
  role: 'customer' | 'agent' | 'admin' | 'all';
}

export const KnowledgeBasePortal: React.FC = () => {
  const { user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  
  // For admins or debugging, allow switching target role perspective to preview other roles' docs
  const [rolePerspective, setRolePerspective] = useState<'customer' | 'agent' | 'admin'>(
    user?.role || 'customer'
  );

  // Sync role perspective if user state loaded
  React.useEffect(() => {
    if (user?.role) {
      setRolePerspective(user.role);
    }
  }, [user?.role]);

  const articles: DocArticle[] = [
    // --- General/All Roles ---
    {
      id: 'gen-1',
      title: 'Getting Started with the Support Center',
      category: 'Overview',
      icon: Compass,
      content: 'Welcome to our high-resolution support ticket desk and messaging pipelines. This interface unites instant chat operations, automatic AI resolutions, and team coordination to streamline customer service. Navigate using the sidebar to find active workspaces, tickets, real-time message boards, and interactive telemetry charts.',
      keywords: 'welcome system guide setup start help desk introduction',
      role: 'all'
    },
    {
      id: 'gen-2',
      title: 'Real-Time Connectivity Setup',
      category: 'Infrastructure',
      icon: Database,
      content: 'Our platform maintains permanent and stateful duplex connections built on WebSockets. This connection feeds real-time events like message transmissions, agent typing indicators, online/offline cues, status badge changes, and custom client desk updates instantly without manual browser refreshes.',
      keywords: 'websocket backend live update network connect setup socket',
      role: 'all'
    },
    {
      id: 'gen-3',
      title: 'Visual Theme and System Accessibility',
      category: 'Settings',
      icon: Layers,
      content: 'Every element inside this system was designed for maximum legibility and reduced eye strain during long workflows. Toggle options apply high-contrast colors, optimized line spacing, and explicit support badges so critical cues look perfectly distinct across devices.',
      keywords: 'color dark light interface visibility text layout contrast',
      role: 'all'
    },

    // --- Customer Perspective ---
    {
      id: 'cust-1',
      title: 'How do I open a support ticket?',
      category: 'Ticket Management',
      icon: FileText,
      content: '1. Access your Customer Dashboard using the main navigation panel.\n2. In the "My Support Pipelines" panel, click on the "+ Create Ticket" button.\n3. Provide a precise, descriptive Title summarizing your prompt.\n4. Write a Detailed Description of the technical question.\n5. Select an appropriate priority grade (Low, Medium, High).\n6. Submit and our system immediately boots an automated queue!',
      keywords: 'create file open send ticket priority help issue submit',
      role: 'customer'
    },
    {
      id: 'cust-2',
      title: 'What does InterBot (AI Support) do?',
      category: 'AI Assistant',
      icon: Sparkles,
      content: 'Immediately after you submit a support ticket, our server-side autonomous AI "InterBot" reads your title and description. It generates an immediate, context-rich response suggesting troubleshooting links, workspace answers, or known setup files. If these solve your issue, you can resolve the ticket. If you need a human agent, the ticket remains open in the pool.',
      keywords: 'chatbot ai robot replies automation answers automated interbot gemini',
      role: 'customer'
    },
    {
      id: 'cust-3',
      title: 'How do I chat instantly with my assigned representative?',
      category: 'Real-Time Chat',
      icon: MessageSquare,
      content: 'As soon as a support agent claims and locks your open ticket, a secure messaging frame wakes up on your Customer feed. You can exchange code snippets, explain error screens, observe live typing states, and resolve the thread actively.',
      keywords: 'message chat agent representative typing online reply speak',
      role: 'customer'
    },
    {
      id: 'cust-4',
      title: 'Understanding SLA Response and Resolution Windows',
      category: 'SLA Policy',
      icon: Clock,
      content: 'Service targets protect your workflows:\n- Urgent Priorities: Handled inside 1 hour (immediate paging).\n- High Priorities: Addressed within 2 hours.\n- Medium Priorities: Addressed within 12 hours.\n- Low Priorities: Resolved within 24 hours of creation.',
      keywords: 'sla resolved time priority speed hours targets level agree',
      role: 'customer'
    },

    // --- Agent Perspective ---
    {
      id: 'agent-1',
      title: 'Managing your workspace & claiming tickets',
      category: 'Inbox Workspace',
      icon: FileText,
      content: 'Your Agent Workspace is designed to keep you focused. You can see active unassigned tickets in the global pool that wait for attention. Selecting any ticket reveals its core details. Click "Claim Ticket" to lock the request under your workspace ownership and launch live developer-client chats. Click "Release Ticket" to push it back into the general queue.',
      keywords: 'claim release assign human ticket workspace queue grab unassigned',
      role: 'agent'
    },
    {
      id: 'agent-2',
      title: 'Writing and persisting private session notes',
      category: 'Diagnostics',
      icon: BookOpen,
      content: 'During deep investigative sessions, use the Diagnostic Notes slate on the right-hand side of your active chat workspace. Private session notes are cached safely in local storage and state memory across sessions, allowing you to trace key telemetry hashes or customer phone numbers privately without cluttering response logs.',
      keywords: 'persist file customer private custom notes save diagnostic notebook',
      role: 'agent'
    },
    {
      id: 'agent-3',
      title: 'How to invoke the AI Smart Draft builder',
      category: 'AI Assistant',
      icon: Sparkles,
      content: 'When drafting a complex explanation for a client, click the "✨ AI Suggested Draft" button right above the typing editor. This utilizes the Gemini LLM service to gather past messages, check client parameters, and instantly structure a tailored, grammatically polished template answer. You can freely edit this template before executing the message payload.',
      keywords: 'draft artificial automatic suggested gemini response prompt write smart',
      role: 'agent'
    },
    {
      id: 'agent-4',
      title: 'Permissions: Is isolating support views secure?',
      category: 'Security & Scope',
      icon: ShieldAlert,
      content: 'Yes. To protect customer confidentiality and maintain clean queue pipelines, standard agents are restricted to seeing and managing only their own assigned tickets, and newly pending unassigned items. Only full administrators hold permissions to analyze all tickets assigned to all agents simultaneously.',
      keywords: 'privacy limit access only me isolation assigned other view credentials',
      role: 'agent'
    },

    // --- Admin Perspective ---
    {
      id: 'admin-1',
      title: 'Running live accounts promotions and role audits',
      category: 'Administration',
      icon: User,
      content: 'As an Administrator, you handle global team permissions. Browse the "Team & Client Directory" panel on your dashboard. Next to each profile, an interactive toggle allows you to promote a standard Customer account into a Support Representative Agent, or safely modify credentials to balance support pools.',
      keywords: 'manage edit register customer agent administrator role configure change promote',
      role: 'admin'
    },
    {
      id: 'admin-2',
      title: 'How to monitor real-time SLA metrics',
      category: 'SLA Metrics',
      icon: Cpu,
      content: 'The SLA Telemetry Chart renders performance aggregates. Use filters inside the module to switch tracking scopes. You can study hourly averages, throughput counts, priority curves, and system queue heights to discover bottleneck trends.',
      keywords: 'metric hours charts tracking radar volatility category analytics data telemetry',
      role: 'admin'
    },
    {
      id: 'admin-3',
      title: 'Unrestricted workspace tickets overrides',
      category: 'Telemetry Control',
      icon: Shield,
      content: 'Administrators hold master review clearance. The Admin console exposes full, unfiltered ticket list views spanning every agent. Use these grids to evaluate workload equity, update statuses from "pending" to "resolved", and reassign open queries during shifts.',
      keywords: 'admin power view all control filter ticket agent permission override force edit',
      role: 'admin'
    }
  ];

  // Filter based on selected perspective and keywords/search term/category
  const filteredArticles = articles.filter(art => {
    // Determine if article is relevant for the selected perspective
    const isPerspectiveMatch = 
      art.role === 'all' || 
      art.role === rolePerspective;
      
    if (!isPerspectiveMatch) return false;

    // Search query match
    const normSearch = searchTerm.toLowerCase();
    const isSearchMatch = 
      art.title.toLowerCase().includes(normSearch) ||
      art.content.toLowerCase().includes(normSearch) ||
      art.category.toLowerCase().includes(normSearch) ||
      art.keywords.toLowerCase().includes(normSearch);

    // Category filter match
    const isCategoryMatch = 
      activeCategory === 'All' || 
      art.category.toLowerCase() === activeCategory.toLowerCase();

    return isSearchMatch && isCategoryMatch;
  });

  // Extract unique categories for tabs based on current role perspective
  const dynamicCategories = ['All', ...Array.from(
    new Set(
      articles
        .filter(art => art.role === 'all' || art.role === rolePerspective)
        .map(art => art.category)
    )
  )];

  // FAQs Quick Actions
  const faqs = [
    { q: 'Is my data stored securely?', a: 'Yes. All tickets, chats, and account settings are securely maintained using local database stores and backed by state-perserving REST APIs.' },
    { q: 'Can I change my registered role?', a: 'Standard users sign up as Customers. Support Agents and Admin promotions are controlled by administrators using the Admin dashboard directory.' },
    { q: 'What happens if a socket disconnects?', a: 'The interface implements smart auto-reconnection filters. If you lose connection, it logs retry markers and reconnects instantly to lock on-call statuses.' }
  ];

  return (
    <div id="knowledge-base-portal" className="space-y-6">
      {/* Search Header layout */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5 border-b border-gray-50 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              <span>Interactive Knowledge Base & Help Desk</span>
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-slate-400">
              Access comprehensive reference instructions customized for your specialized system account role.
            </p>
          </div>


        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search instructions, FAQs, system tools, setup keys, or keywords...`}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3.5 top-3 text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Dynamic Category Tabs */}
        {dynamicCategories.length > 2 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-gray-50 pt-3 dark:border-slate-800/40">
            {dynamicCategories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setExpandedDoc(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-150 ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40'
                      : 'bg-white hover:bg-gray-50 text-gray-500 dark:bg-transparent dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion Article Blocks */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-12 text-center text-xs text-gray-400 dark:border-slate-800 dark:bg-transparent">
            <AlertOctagon className="mx-auto h-7 w-7 text-indigo-400 mb-2.5 animate-bounce" />
            <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">No matching articles found</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              Try adjusting your query or resetting filters. Keywords include: "ticket", "chatbot", "draft", "sla", "WebSocket".
            </p>
          </div>
        ) : (
          filteredArticles.map((art) => {
            const isExpanded = expandedDoc === art.id;
            const IconComponent = art.icon;
            
            return (
              <motion.div
                id={`article-${art.id}`}
                layout="position"
                key={art.id}
                className="rounded-xl border border-gray-100 bg-white dark:border-slate-850 dark:bg-[#0f172a] shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedDoc(isExpanded ? null : art.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">
                        {art.category}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white block mt-0.5">
                        {art.title}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium shrink-0 flex items-center gap-1">
                    <span>{isExpanded ? 'Collapse' : 'Explain'}</span>
                    <ArrowRight className={`h-3 w-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="border-t border-gray-50/50 dark:border-slate-850/40"
                    >
                      <div className="p-5 text-[11.5px] text-gray-600 dark:text-slate-350 leading-relaxed bg-slate-50/15 dark:bg-slate-900/10">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-gray-100/50 dark:border-slate-800/50 whitespace-pre-line tracking-normal">
                          {art.content}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] text-gray-400 font-mono">
                          <code className="bg-gray-100/70 dark:bg-slate-850 px-2 py-0.5 rounded text-gray-500 uppercase tracking-widest font-bold">Target: {art.role}</code>
                          <code className="bg-gray-100/70 dark:bg-slate-850 px-2 py-0.5 rounded text-gray-500">Keywords: {art.keywords}</code>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Dynamic FAQs grid section */}
      <div className="grid gap-4 md:grid-cols-3">
        {faqs.map((faq, idx) => (
          <div key={idx} className="rounded-xl border border-gray-150/60 bg-white p-4.5 dark:border-slate-850 dark:bg-[#0f172a] shadow-sm">
            <h5 className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
              <HelpCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <span>FAQ Guide</span>
            </h5>
            <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug mb-1.5">
              {faq.q}
            </p>
            <p className="text-[10.5px] text-gray-400 dark:text-slate-400 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      {/* Standardized SLA reference tables as responsive layout decoration */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
        <h4 className="text-xs font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-indigo-500" />
          <span>SLA Reference Matrix Matrix (Target Compliance Hours)</span>
        </h4>
        <p className="text-[10px] text-gray-400 dark:text-slate-400 mb-4">
          Tracking standards configured for corporate audit targets:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-gray-50 pb-2 text-gray-400 dark:border-slate-800">
                <th className="pb-2 font-bold uppercase tracking-wider select-none">Priority</th>
                <th className="pb-2 font-bold uppercase tracking-wider select-none">First Response</th>
                <th className="pb-2 font-bold uppercase tracking-wider select-none">Resolution target</th>
                <th className="pb-2 font-bold uppercase tracking-wider select-none">Assigned Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50 text-gray-600 dark:divide-slate-800/50 dark:text-slate-300">
              <tr>
                <td className="py-2.5 font-bold text-rose-500">Urgent</td>
                <td className="py-2.5">Live Alert / Immediate</td>
                <td className="py-2.5 font-semibold">1 Hour maximum</td>
                <td className="py-2.5 rounded font-mono text-[10px]">On-Call Operations</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-red-500">High</td>
                <td className="py-2.5">&lt; 30 Minutes</td>
                <td className="py-2.5 font-semibold">2 Hours maximum</td>
                <td className="py-2.5 font-mono text-[10px]">Tier-2 Engineering</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-amber-500">Medium</td>
                <td className="py-2.5">&lt; 2 Hours</td>
                <td className="py-2.5 font-semibold">12 Hours target</td>
                <td className="py-2.5 font-mono text-[10px]">Tier-1 Help Desk</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-sky-500">Low</td>
                <td className="py-2.5">&lt; 8 Hours</td>
                <td className="py-2.5 font-semibold">24 Hours target</td>
                <td className="py-2.5 font-mono text-[10px]">General Support</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBasePortal;
