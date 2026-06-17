import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KnowledgeBasePortal } from '../components/KnowledgeBasePortal';
import { 
  User, 
  MapPin, 
  Phone, 
  Building2, 
  BookOpen, 
  CheckCircle2, 
  Info,
  Layers,
  Database,
  HelpCircle,
  FileText,
  Compass,
  Cpu,
  ShieldAlert,
  ArrowRight,
  Search,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, updateProfile } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');
  const [alertOpen, setAlertOpen] = useState(false);
  
  // Navigation tabs for the settings workspace
  const [activeTab, setActiveTab] = useState<'profile' | 'help'>('profile');
  
  // Doc portal states
  const [helpSearch, setHelpSearch] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name, bio, phone, company });
    setAlertOpen(true);
    setTimeout(() => setAlertOpen(false), 2000);
  };

  if (!user) return null;

  // Help Docs DB structured according to user roles
  const customerDocs = [
    {
      id: 'cust-1',
      title: 'How do I open a support ticket?',
      category: 'Ticket Management',
      icon: FileText,
      content: 'To create a ticket, click "My Support Pipelines" on your Customer Dashboard, then click the "Create Ticket" button on the left panel. Choose a clear subject, detail the issue, select a category and priority level (Low, Medium, or High), and submit.',
      keywords: 'create file open send ticket priority'
    },
    {
      id: 'cust-2',
      title: 'What does InterBot (AI Support) do?',
      category: 'AI Assistant',
      icon: Sparkles,
      content: 'When you first submit a ticket, our AI Chatbot "InterBot" instantly provides autonomous, context-aware answers to troubleshoot your issue without delay. If the solution resolves your issue, you can mark the ticket as resolved. If not, the queue remains open for a human agent to review and claim.',
      keywords: 'chatbot ai robot replies automation answers'
    },
    {
      id: 'cust-3',
      title: 'How do I message my assigned agent?',
      category: 'Real-Time Chat',
      icon: MessageSquare,
      content: 'Once a human support representative reviews and claims your ticket, you can chat with them instantly on your dashboard portal. Type in the text bar on the bottom, see live typing indicators, and receive read receipts instantaneously.',
      keywords: 'message chat agent representative typing online'
    },
    {
      id: 'cust-4',
      title: 'What are the SLA Targets for resolutions?',
      category: 'SLA Policy',
      icon: Cpu,
      content: 'We prioritize customer needs based on ticket severity levels: Low priority tickets are processed within 24 hours. Medium priority is set for under 12 hours. High/Urgent requests aim for rapid responses under 1 to 2 hours.',
      keywords: 'sla resolved time priority speed hours targets'
    }
  ];

  const agentDocs = [
    {
      id: 'agent-1',
      title: 'How do I claim or release a ticket?',
      category: 'Inbox Workspace',
      icon: FileText,
      content: 'Browse the live queue list on your left panel. Select a ticket and click "Claim Ticket" on the active conversation frame header to link yourself as the assigned expert. If you need to hand off the query to another support channel due to schedule shifts, click the "Release Ticket" button.',
      keywords: 'claim release assign human ticket workspace queue'
    },
    {
      id: 'agent-2',
      title: 'How do I use the AI Smart Draft support tool?',
      category: 'AI Assistant',
      icon: Sparkles,
      content: 'In the message interaction text prompt, click on the "✨ AI Suggested Draft" button. This queries the Gemini AI Model to read current customer ticket properties and the recent message history. It instantly pre-populates your text input fields with a complete, polite drafted response you can edit or send right away.',
      keywords: 'draft artificial automatic suggested gemini response prompt'
    },
    {
      id: 'agent-3',
      title: 'Am I limited to seeing only my own assigned tickets?',
      category: 'Security & Scope',
      icon: ShieldAlert,
      content: 'Yes. To keep workspaces isolated and prevent noise across team members, agents are configured to see only tickets assigned directly to them, or unassigned tickets waiting in the queue. Global visibility of all tickets assigned to other staff members is restricted purely to administrators.',
      keywords: 'privacy limit access only me isolation assigned other'
    },
    {
      id: 'agent-4',
      title: 'Writing internal session notes',
      category: 'File & Notes',
      icon: BookOpen,
      content: 'The third panel on the right allows you to write private internal session notes for active customers. These notes are stored persistently inside local storage and state. Use it to keep track of diagnostic keys, API addresses, on-call coordinates, or general follow-ups.',
      keywords: 'persist file customer private custom notes save'
    }
  ];

  const adminDocs = [
    {
      id: 'admin-1',
      title: 'Managing customer and agent directory accounts',
      category: 'Administration',
      icon: User,
      content: 'Directly from your Admin view dashboards, retrieve user registration records, verify roles (Customer, Support Agent, Administrator), study customer sign-up trends, and balance ticket distribution pools across shifts dynamically.',
      keywords: 'manage edit register customer agent administrator role'
    },
    {
      id: 'admin-2',
      title: 'How to monitor real-time SLA metrics?',
      category: 'SLA Metrics',
      icon: Cpu,
      content: 'Check the real-time SLA Telemetry chart component. Filter by hourly, daily, or monthly granular ranges to discover bottlenecks. Tracking includes average customer response curves, throughput ratings, and ticket urgency ratios.',
      keywords: 'metric hours charts tracking radar volatility category analytics data'
    },
    {
      id: 'admin-3',
      title: 'Reviewing entire workspace ticket trends',
      category: 'Telemetry Control',
      icon: Layers,
      content: 'Unlike isolated agents, Administrators hold unrestricted access permissions. You can view all active and closed tickets from all agents, transfer assignments, update priorities, and override category mappings continuously.',
      keywords: 'admin power view all control filter ticket agent permission'
    }
  ];

  // Pick documentation based on role
  const docsToSearch = 
    user.role === 'admin' ? adminDocs : 
    user.role === 'agent' ? agentDocs : customerDocs;

  // Filter docs
  const filteredDocs = docsToSearch.filter(d => {
    return d.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
           d.content.toLowerCase().includes(helpSearch.toLowerCase()) ||
           d.category.toLowerCase().includes(helpSearch.toLowerCase()) ||
           d.keywords.toLowerCase().includes(helpSearch.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      {/* Page Title Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Workspace Settings & Portal</span>
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-400">
            Configure your personal profile details or browse the interactive documentation portal customized for your {user.role} role.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex bg-gray-150 dark:bg-slate-900 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors duration-150 ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-600 dark:bg-slate-800 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors duration-150 flex items-center gap-1.5 ${
              activeTab === 'help'
                ? 'bg-white text-indigo-600 dark:bg-slate-800 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help & Docs Center</span>
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <div>
          {alertOpen && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-850 dark:text-emerald-450">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 font-extrabold" />
              <span>Profile configuration updated in persistent memory store!</span>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-12">
            {/* Left Box: Avatar details */}
            <div className="md:col-span-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-850 dark:bg-[#0f172a] flex flex-col items-center text-center">
              <img 
                src={user.avatar} 
                alt={user.name} 
                referrerPolicy="no-referrer"
                className="h-20 w-20 rounded-full object-cover border-4 border-indigo-100 mb-3 block shadow-sm"
              />
              <h3 className="font-extrabold text-gray-900 dark:text-white leading-tight capitalize text-sm">
                {user.name}
              </h3>
              <p className="text-[10px] text-gray-400 truncate w-full mb-2">{user.email}</p>
              
              <div className="mt-2 w-full border-t border-gray-50 pt-3 dark:border-slate-800/60 flex flex-col gap-1.5 text-left text-[11px] text-gray-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">User Role:</span>
                  <span className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 text-[10px]">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-400">UUID Label:</span>
                  <span className="font-mono text-gray-900 dark:text-white text-[9.5px] truncate max-w-[100px]">{user.id}</span>
                </div>
              </div>
            </div>

            {/* Right Form: Input profile modifications */}
            <form onSubmit={handleUpdate} className="md:col-span-8 flex flex-col gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-[#0f172a]">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Display Public Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-750 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {user.role === 'customer' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Corporate Account / Company Identifier
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme SaaS Co."
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-750 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Support Contact Phone Line
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 345-2311"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-750 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Tell us about yourself / Workspace Bio
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Record any details regarding integration profiles or client support targets..."
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-750 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 py-3 text-xs font-extrabold text-white hover:opacity-90 transition shadow-lg shadow-indigo-100 dark:shadow-none cursor-pointer"
              >
                Save Profile Updates
              </button>
            </form>
          </div>


        </div>
      ) : (
        <KnowledgeBasePortal />
      )}
    </div>
  );
};
export default ProfileSettings;
