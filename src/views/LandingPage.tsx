import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  MessageSquare, 
  Shield, 
  Clock, 
  Zap, 
  Layers, 
  Send,
  HelpCircle,
  X,
  Play,
  ArrowRight,
  Computer,
  Award,
  Bot,
  TrendingUp,
  Activity,
  Code,
  Coins,
  Check,
  Cpu,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThreeDSceneWrapper } from '../components/ThreeDSceneWrapper';

export const LandingPage: React.FC = () => {
  const { user, setView, login, register } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  
  // Floating Messenger Widget states
  const [chatOpen, setChatOpen] = useState(false);
  const [guestMessages, setGuestMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    { sender: 'bot', text: "Hello! I am InterBot, your real-time AI Support Assistant. Ask me anything about our platform, billing, webhooks, or subdomains!", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [guestInput, setGuestInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Awesome interactive Awwwards mouse-movement 3D Tilt calculations
  const cockpitRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [active3dTab, setActive3dTab] = useState<'threads' | 'telemetry' | 'status'>('threads');

  // ROI Calculator states
  const [monthlyTickets, setMonthlyTickets] = useState(850);
  const [currentResolutionTime, setCurrentResolutionTime] = useState(45); // in minutes
  const [agentHourlyWage, setAgentHourlyWage] = useState(28);

  // Interactive Co-Pilot Simulator states
  const [activeScenario, setActiveScenario] = useState<'hmac' | 'stripe' | 'dns'>('hmac');
  const [simStep, setSimStep] = useState<'idle' | 'analyzing' | 'resolved'>('idle');
  const [simProgress, setSimProgress] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cockpitRef.current) return;
    const box = cockpitRef.current.getBoundingClientRect();
    const x = (e.clientX - box.left) - box.width / 2;
    const y = (e.clientY - box.top) - box.height / 2;
    
    // Normalize ratio inside [-12deg, 12deg] range with high cinematic damping 
    const rotX = -(y / (box.height / 2)) * 11;
    const rotY = (x / (box.width / 2)) * 11;
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [guestMessages, isBotTyping]);

  // Simulate simulator animation when active scenario shifts
  useEffect(() => {
    setSimStep('analyzing');
    setSimProgress(0);
    const interval = setInterval(() => {
      setSimProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setSimStep('resolved');
          return 100;
        }
        return p + 25;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [activeScenario]);

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInput.trim()) return;

    const userText = guestInput;
    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add User message
    setGuestMessages(prev => [...prev, { sender: 'user', text: userText, time: timeStamp }]);
    setGuestInput('');
    setIsBotTyping(true);

    // Call simulated client-side AI analysis representing InterBot response
    setTimeout(() => {
      const respText = getGuestResponse(userText);
      setGuestMessages(prev => [...prev, { sender: 'bot', text: respText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setIsBotTyping(false);
    }, 1200);
  };

  const getGuestResponse = (text: string): string => {
    const q = text.toLowerCase();
    if (q.includes('price') || q.includes('cost') || q.includes('billing') || q.includes('plan')) {
      return "Our Starter plan starts at $49/mo, and our Pro plan is $149/mo including advanced integration webhooks and unlimited tickets. To double-check, sign up and try out our demo database!";
    }
    if (q.includes('webhook') || q.includes('api') || q.includes('endpoint')) {
      return "Webhooks on Intercomly automatically verify requests via HMAC signatures. For local environments, check that port **3000** is forwarded or your AWS security lists are updated.";
    }
    if (q.includes('who') || q.includes('creator') || q.includes('developer')) {
      return "This Support Chat Applet is built with a highly secure React + Node full-stack suite alongside custom Socket.IO real-time pipelines and Gemini 3.5 AI models!";
    }
    return "That sounds interesting! Please register or log in using our default accounts to check out full tickets dashboards, real-time message boards, and on-call agent workflows!";
  };

  // ROI calculations
  const calculateROI = () => {
    // Intercomly resolves ~82% of standard issues instantly
    const resolverRate = 0.82;
    const manualRate = 1 - resolverRate;
    
    const minutesSavedPerTicket = currentResolutionTime * 0.90; // support deflection resolves instantly
    const totalMinutesSaved = monthlyTickets * resolverRate * minutesSavedPerTicket;
    const hoursSaved = Math.round(totalMinutesSaved / 60);
    const dollarsSaved = Math.round(hoursSaved * agentHourlyWage);
    const speedImprovementPercent = Math.round(((currentResolutionTime - 1.2) / currentResolutionTime) * 100);

    return { hoursSaved, dollarsSaved, speedImprovementPercent };
  };

  const roi = calculateROI();

  // Scenario structures
  const scenarios = {
    hmac: {
      title: "HMAC Signal Verification Fail",
      tickettext: "Customer reports: 'Webhook signature verification keeps failing immediately in our staging container...'",
      actions: [
        "Analyzing request envelope...",
        "Identifying local port 3000 mapping parameters",
        "Formulating HMAC validation correction snippet"
      ],
      aiDecision: "Detected absolute path syntax mismatch. The staging server was verifying the raw headers before routing middleware. Recommending body-parser raw parser configuration.",
      code: `// Intercomly AI Recommended Code Fix:
import crypto from 'crypto';

export function verifyWebhook(req, secret) {
  const signature = req.headers['x-hub-signature-256'];
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}`
    },
    stripe: {
      title: "Stripe Event Delivery Lag",
      tickettext: "Customer reports: 'Checkout sessions are finishing on Stripe, but users wait 5 mins for upgrade logs...'",
      actions: [
        "Tracing webhook event dispatch queues...",
        "Evaluating MongoDB indexing structures for webhook logs",
        "Recommending on-demand sync fallback"
      ],
      aiDecision: "The listener was experiencing thread locks during concurrent database writes. Recommending non-blocking background queue task workers.",
      code: `// Intercomly AI Recommended Solution:
app.post('/stripe-webhooks', async (req, res) => {
  const event = req.body;
  // Route task instantly to back-channel thread pool
  setImmediate(() => {
    processBillingAsync(event.data.object);
  });
  return res.status(200).json({ received: true });
}`
    },
    dns: {
      title: "Subdomain Route Resolution",
      tickettext: "Customer reports: 'We mapped portal.company.com to support, but it yields SSL invalid errors...'",
      actions: [
        "Testing target support routing records...",
        "Validating Let's Encrypt certificate challenge paths",
        "Drafting virtual host configurations"
      ],
      aiDecision: "CNAME points to the raw IP instead of the global gateway. Recommending routing records update and Let's Encrypt SSL reissue challenge.",
      code: `# DNS Mapping Solution:
NAME: portal.company.com
TYPE: CNAME
VALUE: global-gateway.intercomly.com
TTL: 300`
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fafbfc] text-gray-900 font-sans transition-colors duration-200 dark:bg-[#03060f] dark:text-gray-100 overflow-x-hidden">
      
      {/* 3D Sci-Fi Background Elements */}
      <ThreeDSceneWrapper />
      
      {/* Overlay complex space-age ambient gas clouds and digital grid arrays inspired by premium 3D motion layouts */}
      <div className="absolute top-0 left-0 w-full h-[740px] md:h-[860px] pointer-events-none select-none z-0 overflow-hidden [mask-image:linear-gradient(to_bottom,rgba(255,255,255,1)_72%,rgba(255,255,255,0)_100%)] [webkit-mask-image:linear-gradient(to_bottom,rgba(255,255,255,1)_72%,rgba(255,255,255,0)_100%)]">
        {/* Aesthetic Cyber Grid Net Overlay with radial fade mask */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.08)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,#000_50%,transparent_100%)] opacity-70" />
        
        {/* Soft upper indigo starlight gradient */}
        <div className="absolute top-0 left-1/4 w-[120vw] h-[75vw] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.16),transparent_65%)]" style={{ transform: 'translate3d(0,0,0)' }} />
        
        {/* Living glowing cyan star cloud on upper-right */}
        <div className="absolute top-[12%] right-[-15vw] w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.12),transparent_70%)] blur-2xl" />
        
        {/* Dynamic slow-pulsing cosmic emerald clouds on the outer left margin */}
        <div className="absolute top-[35%] left-[-20vw] w-[90vw] h-[90vw] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.08),transparent_75%)] blur-3xl animate-pulse" style={{ animationDuration: '18s' }} />
        
        {/* Glowing deep purple secondary nebula above the interactive demo zone */}
        <div className="absolute top-[55%] right-[-10vw] w-[75vw] h-[75vw] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.09),transparent_70%)] blur-3xl" />
        
        {/* Glowing solar nebula in deep footer */}
        <div className="absolute bottom-[-10%] left-[10vw] w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.11),transparent_70%)] blur-3xl" />
      </div>

      {/* Header Banner Navbar */}
      <nav className="relative z-10 w-full border-b border-gray-250 bg-white/70 dark:border-slate-900/55 dark:bg-slate-950/20 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-300/40 dark:shadow-none animate-3d-float-fast">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-650 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                Intercomly
              </h1>
              <p className="text-[9px] font-bold text-indigo-500 tracking-wider font-mono">SUPPORT WORKSPACE</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <button
                onClick={() => setView(user.role)}
                className="rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-100 hover:opacity-90 dark:shadow-none transition duration-150"
              >
                Go to Workspace
              </button>
            ) : (
              <>
                <button
                  onClick={() => setView('login')}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setView('register')}
                  className="rounded-xl border border-sky-400/50 bg-sky-50/20 px-4 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-50 dark:bg-sky-950/20 dark:text-sky-400 transition"
                >
                  Registration
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Spotlight Segment */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 text-center flex flex-col items-center">
        {/* Sparkle Badge */}
        <div className="mb-6 flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4.5 py-1.5 text-xs font-bold text-sky-855 dark:text-sky-300 shadow-3d-sm">
          <Sparkles className="h-3.5 w-3.5 text-sky-500 animate-3d-float-slow" />
          <span>Real-Time Support, Fully Automated by Gemini 3.5 AI</span>
        </div>
 
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-gray-900 dark:text-white max-w-3xl">
          The Customer Support Suite built for <span className="bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">Instant Solutions</span>
        </h1>
        <p className="mt-6 text-base sm:text-xl text-gray-500 max-w-2xl leading-relaxed dark:text-slate-400">
          Combine powerful ticket ticketing dashboards, real-time message pipelines, and InterBot AI auto-replies to close open tickets in seconds.
        </p>
 
        {/* Demo trigger logs & credentials block */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {user ? (
            <button
              onClick={() => setView(user.role)}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:opacity-95 px-7 py-4 text-sm font-extrabold text-white shadow-3d-lg hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Enter Client Console <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setView('login')}
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:opacity-95 px-7 py-4 text-sm font-extrabold text-white shadow-3d-lg hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                Start Free Sandbox <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-gray-250 bg-white/70 backdrop-blur-md px-7 py-4 text-sm font-extrabold text-gray-700 hover:bg-gray-50 hover:shadow-3d-lg dark:border-slate-800 dark:bg-slate-905 dark:text-slate-200 dark:hover:bg-slate-800 active:scale-95 cursor-pointer transition"
              >
                <Bot className="h-4 w-4 text-indigo-500" /> Talk to InterBot AI
              </button>
            </>
          )}
        </div>

        {/* ----------------- AWWARDS-STYLE 3D INTERACTIVE DESK COCKPIT ----------------- */}
        <div className="mt-14 w-full max-w-4xl perspective-2000 preserve-3d">
          <div
            ref={cockpitRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative rounded-3xl border border-gray-250 bg-white shadow-3d-lg dark:border-gray-200 dark:bg-white transition-all duration-200 select-none overflow-hidden"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transformStyle: 'preserve-3d',
              boxShadow: `0 35px 70px -15px rgba(99, 102, 241, ${Math.min(0.20 + Math.abs(tilt.x)/45, 0.45)}), 0 15px 30px rgba(0,0,0,0.15)`
            }}
          >
            {/* Top glassmorphic rail with simulated operating system buttons */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-slate-50 dark:bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] cursor-pointer" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] cursor-pointer" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] cursor-pointer" />
                <span className="text-[10px] text-gray-400 font-mono font-semibold ml-4">intercomly_cockpit_v3.52</span>
              </div>

              {/* Subtabs to render inside Mock dashboard */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 dark:bg-slate-100 dark:border-slate-200">
                {(['threads', 'telemetry', 'status'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActive3dTab(t)}
                    type="button"
                    className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer ${
                      active3dTab === t
                        ? 'bg-white text-indigo-650 dark:bg-white dark:text-indigo-650 shadow-sm'
                        : 'text-gray-450 hover:text-gray-900 dark:text-slate-450 dark:hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Inner Dashboard Viewports */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-5 text-left text-xs text-slate-700 dark:text-slate-700 min-h-[220px]">
              {active3dTab === 'threads' && (
                <>
                  {/* Left Column: List */}
                  <div className="md:col-span-5 space-y-2 border-r-0 md:border-r border-gray-200 dark:border-gray-200 pr-0 md:pr-4 pb-4 md:pb-0">
                    <div className="text-[10px] text-indigo-500 uppercase font-black tracking-wider">Active Stream</div>
                    {[
                      { user: 'Sarah Jenkins', msg: 'HMAC validation failing on AWS', status: 'ai_answering' },
                      { user: 'Liam O\'connor', msg: 'SLA target breach notifications', status: 'claimed' },
                      { user: 'Emma Stone', msg: 'Do we have a local settings doc?', status: 'pending' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-2 border border-slate-100 rounded-xl bg-slate-50 hover:border-indigo-400 transition cursor-pointer">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-800 text-[10.5px]">
                          <span>{item.user}</span>
                          <span className="bg-indigo-500 h-1.5 w-1.5 rounded-full" />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.msg}</p>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Interaction view */}
                  <div className="md:col-span-7 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Bot className="h-4 w-4 text-emerald-500" />
                          <span className="font-extrabold text-slate-900 dark:text-slate-900 text-[11px]">InterBot Autonomous Co-Pilot</span>
                        </div>
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[8.5px] font-sans font-extrabold text-indigo-500 tracking-wider">SECURE LAYER</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 leading-relaxed font-sans text-[11px]">
                        <span className="font-bold text-indigo-500">Suggested Action: </span>Our Gemini AI engine detected an active HMAC mismatch on port <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[10px]">3000</code>. Pre-populating setup guide file resources matching this client.
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[9.5px] text-gray-400 font-mono">Telemetry sync active</span>
                      </div>
                      <button onClick={() => setView('login')} className="bg-gradient-to-tr from-sky-500 to-indigo-600 hover:opacity-90 px-3.5 py-1.5 rounded-lg text-[10.5px] font-extrabold text-white cursor-pointer transition">
                        Inspect Console →
                      </button>
                    </div>
                  </div>
                </>
              )}

              {active3dTab === 'telemetry' && (
                <div className="md:col-span-12 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-900 text-[11.5px]">Live Response Frequency (SLA Targets)</h4>
                      <p className="text-[10px] text-gray-500">Continuous telemetry monitor updating averages every second.</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">99.85% COMPLIANT</span>
                  </div>

                  {/* Dummy high-resolution 3D bars display */}
                  <div className="h-24 flex items-end gap-1.5 border-b border-gray-200 pb-1">
                    {[30, 45, 60, 50, 75, 40, 95, 80, 65, 70, 85, 90, 55, 60, 45, 75].map((val, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-sky-400 to-indigo-650 rounded-t-sm transition-all duration-300 hover:opacity-80"
                        style={{ height: `${val}%` }}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>Peak (08:00 AM)</span>
                    <span>Noon</span>
                    <span>Current (Live)</span>
                  </div>
                </div>
              )}

              {active3dTab === 'status' && (
                <div className="md:col-span-12 space-y-4">
                  <div className="text-[10.5px] text-indigo-500 uppercase font-black tracking-wider">System Operations & Verification</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 border border-slate-150 rounded-2xl bg-slate-50 text-center animate-3d-float-slow">
                      <span className="text-[9.5px] text-gray-400 block uppercase font-bold tracking-tight">Avg Time to Claim</span>
                      <span className="text-lg font-black text-indigo-650 block mt-1">1m 14s</span>
                    </div>
                    <div className="p-3 border border-slate-150 rounded-2xl bg-slate-50 text-center animate-3d-float-fast">
                      <span className="text-[9.5px] text-gray-400 block uppercase font-bold tracking-tight">Active Sockets</span>
                      <span className="text-lg font-black text-indigo-650 block mt-1">1,482</span>
                    </div>
                    <div className="p-3 border border-slate-150 rounded-2xl bg-slate-50 text-center animate-3d-float-slow">
                      <span className="text-[9.5px] text-gray-400 block uppercase font-bold tracking-tight">SLA Resolved %</span>
                      <span className="text-lg font-black text-[#10b981] block mt-1">98.24%</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 text-center font-sans">
                    *Persisted data synced accurately across client models securely.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Credentials Quick Card */}
        {!user && (
          <div className="mt-12 rounded-2xl border border-dashed border-gray-200 bg-white/60 dark:bg-slate-900/40 dark:border-slate-800 p-5 text-center max-w-xl w-full relative z-10 backdrop-blur-md shadow-3d-sm animate-3d-float-slow">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Developer Quick-Access Accounts (Ready to Test)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div 
                onClick={() => { login('customer@example.com', 'password'); setView('customer'); }}
                className="rounded-xl bg-white p-2.5 shadow-3d-sm hover:shadow-3d-lg dark:bg-[#111827] border dark:border-slate-800/80 hover:-translate-y-1 hover:border-emerald-500/50 cursor-pointer transition-all duration-205 md:duration-150"
              >
                <span className="font-extrabold text-emerald-650 block mb-0.5">Customer</span>
                <span className="text-gray-550 block truncate">customer@example.com</span>
                <span className="font-mono text-gray-400 block mt-1 bg-slate-100 dark:bg-slate-850 py-0.5 rounded">password</span>
              </div>
              <div 
                onClick={() => { login('agent@example.com', 'password'); setView('agent'); }}
                className="rounded-xl bg-white p-2.5 shadow-3d-sm hover:shadow-3d-lg dark:bg-[#111827] border dark:border-slate-800/80 hover:-translate-y-1 hover:border-indigo-650 cursor-pointer transition-all duration-205 md:duration-150"
              >
                <span className="font-extrabold text-indigo-650 block mb-0.5">Support Agent</span>
                <span className="text-gray-550 block truncate">agent@example.com</span>
                <span className="font-mono text-gray-400 block mt-1 bg-slate-100 dark:bg-slate-850 py-0.5 rounded">password</span>
              </div>
              <div 
                onClick={() => { login('admin@example.com', 'password'); setView('admin'); }}
                className="rounded-xl bg-white p-2.5 shadow-3d-sm hover:shadow-3d-lg dark:bg-[#111827] border dark:border-slate-800/80 hover:-translate-y-1 hover:border-purple-605 block mb-0.5 cursor-pointer transition-all duration-205 md:duration-150"
              >
                <span className="font-extrabold text-purple-600 block mb-0.5">Admin Ops</span>
                <span className="text-gray-550 block truncate">admin@example.com</span>
                <span className="font-mono text-gray-400 block mt-1 bg-slate-100 dark:bg-slate-850 py-0.5 rounded">password</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ----------------- SECTOR 2: INTERACTIVE CO-PILOT SIMULATOR TERMINAL ----------------- */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Left instructions block */}
          <div className="md:col-span-5 flex flex-col justify-center">
            <span className="text-[10px] font-black tracking-wider text-indigo-500 uppercase">Interactive Playground</span>
            <h2 className="text-2xl sm:text-3.5xl font-black text-gray-900 dark:text-white mt-1 leading-tight">
              Test general AI support <span className="bg-gradient-to-r from-emerald-400 to-indigo-500 bg-clip-text text-transparent">diagnostics</span>
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mt-4 leading-relaxed text-xs">
              Select one of our standard support ticket case templates below. Witness how Intercomly's Gemini-enabled co-pilot breaks down raw logs, writes optimized correction code, and deflects manual ticket creation automatically.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              {(Object.keys(scenarios) as Array<'hmac' | 'stripe' | 'dns'>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveScenario(key)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition duration-150 cursor-pointer ${
                    activeScenario === key
                      ? 'border-indigo-500/80 bg-white dark:bg-slate-900 shadow-md ring-1 ring-indigo-550/20'
                      : 'border-slate-200/60 dark:border-slate-850/50 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div>
                    <h4 className="font-black text-xs text-gray-900 dark:text-white">{scenarios[key].title}</h4>
                    <span className="text-[10px] text-gray-400 font-mono mt-0.5 block truncate max-w-[210px] sm:max-w-xs">
                      {scenarios[key].tickettext}
                    </span>
                  </div>
                  <ChevronArrowRight className={`h-4 w-4 transition ${activeScenario === key ? 'text-indigo-500 translate-x-1' : 'text-gray-450'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Terminal block */}
          <div className="md:col-span-7 flex flex-col rounded-3xl border border-gray-205 bg-white shadow-xl overflow-hidden dark:border-slate-800 dark:bg-slate-950 w-full min-w-0 text-slate-900 dark:text-slate-105">
            {/* Terminal menu rail */}
            <div className="border-b px-5 py-4 border-gray-205 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Code className="h-4 w-4 text-[#8b5cf6]" />
                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">InterBot Console Code Simulator</span>
              </div>
              <span className="text-[9px] font-mono font-black text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Live Resolution
              </span>
            </div>

            {/* Simulated Live Action Window */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              {/* Ticket payload input box */}
              <div className="rounded-2xl border border-dashed border-gray-250 dark:border-slate-800 p-4 bg-slate-50 dark:bg-[#0c1221]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider">Simulated Ticket Payload</span>
                </div>
                <p className="text-[11px] leading-relaxed italic text-slate-705 dark:text-slate-300 font-medium font-sans">
                  {scenarios[activeScenario].tickettext}
                </p>
              </div>

              {/* Resolution Progression flow */}
              <div className="space-y-2.5">
                <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-widest block">Agent Autopilot Pipeline</span>
                <div className="space-y-1.5">
                  {scenarios[activeScenario].actions.map((act, index) => {
                    const isPassed = simProgress >= (index + 1) * 33;
                    return (
                      <div key={index} className="flex items-center gap-2 text-[10.5px]">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center border transition-all text-[8px] ${
                          isPassed 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-gray-250 text-gray-400'
                        }`}>
                          {isPassed ? <Check className="h-2 w-2 stroke-[4px]" /> : index + 1}
                        </div>
                        <span className={`transition-opacity duration-150 font-medium ${isPassed ? 'text-slate-800 dark:text-slate-800' : 'text-gray-400'}`}>
                          {act}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bot solution block */}
              {simStep === 'resolved' ? (
                <div className="space-y-3 pt-2 text-left">
                  <div className="border border-emerald-250 dark:border-emerald-800/50 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 p-4 flex gap-3 text-[11px]">
                    <Sparkles className="h-4 w-4 text-emerald-555 dark:text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block text-xs">Autonomous Diagnosis Solution</span>
                      <p className="text-slate-705 dark:text-slate-300 mt-1 leading-relaxed">
                        {scenarios[activeScenario].aiDecision}
                      </p>
                    </div>
                  </div>

                  <pre className="p-3.5 rounded-2xl bg-[#090d16] text-[10.5px] text-[#22c55e] font-mono border border-slate-800 w-full max-w-full overflow-x-auto text-left leading-relaxed whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal">
                    {scenarios[activeScenario].code}
                  </pre>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center gap-2 border border-dashed rounded-2xl border-gray-250">
                  <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Processing diagnosis payload... {simProgress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- SECTOR 3: INTERACTIVE SLA & ROI DEFLECTION CALCULATOR ----------------- */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-3xl border border-indigo-50 bg-gradient-to-tr from-white to-slate-50/50 p-8 shadow-xl dark:border-slate-900/50 dark:from-[#0d1527] dark:to-[#080d16]">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[10px] font-black tracking-wider text-indigo-500 uppercase">SLA Deflection Calculator</span>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              Calculate your workspace ROI savings
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              Drag the parameters below to match your real organization metrics and see how much engineering resource you recover.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Input sliders (Left) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Slider 1 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-gray-800 dark:text-white">
                  <span>Monthly Support Tickets</span>
                  <span className="text-indigo-650 dark:text-sky-400 font-black">{monthlyTickets.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="12500"
                  step="50"
                  value={monthlyTickets}
                  onChange={(e) => setMonthlyTickets(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-indigo-600"
                />
                <div className="flex justify-between text-[9px] text-gray-450">
                  <span>100</span>
                  <span>6,000</span>
                  <span>12,500</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-gray-800 dark:text-white">
                  <span>Avg Manual Resolution Time (Mins)</span>
                  <span className="text-indigo-650 dark:text-sky-400 font-black">{currentResolutionTime}m</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="180"
                  step="5"
                  value={currentResolutionTime}
                  onChange={(e) => setCurrentResolutionTime(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-indigo-600"
                />
                <div className="flex justify-between text-[9px] text-gray-450">
                  <span>10m</span>
                  <span>95m</span>
                  <span>180m</span>
                </div>
              </div>

              {/* Slider 3 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-gray-800 dark:text-white">
                  <span>Hourly Dev / Agent Cost ($)</span>
                  <span className="text-indigo-650 dark:text-sky-400 font-black">${agentHourlyWage}/hr</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="125"
                  step="1"
                  value={agentHourlyWage}
                  onChange={(e) => setAgentHourlyWage(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-indigo-600"
                />
                <div className="flex justify-between text-[9px] text-gray-450">
                  <span>$15</span>
                  <span>$70</span>
                  <span>$125</span>
                </div>
              </div>
            </div>

            {/* Calculated output metrics dashboard (Right) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-5 rounded-2xl border dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Support Slack Saved</span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-gray-900 dark:text-white block tracking-tight">
                    {roi.hoursSaved}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">hours recovered / month</span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500" />
              </div>

              <div className="p-5 rounded-2xl border dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#8b5cf6]" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">Est. Monthly Savings</span>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-gray-900 dark:text-white block tracking-tight text-indigo-600 dark:text-sky-400">
                    ${roi.dollarsSaved.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-[#8b5cf6] block mt-0.5 font-mono">
                    ${((roi.dollarsSaved * 12) / 1000).toFixed(1)}k saved annually
                  </span>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#8b5cf6]" />
              </div>

              <div className="p-5 rounded-2xl border dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 relative overflow-hidden flex flex-col justify-between sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">SLA Speedup Multiplier</span>
                  </div>
                  <span className="text-[10px] font-black text-white bg-indigo-650 px-2 py-0.5 rounded-full uppercase scale-95 font-mono">
                    80% Dev deflected
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 items-center">
                  <div>
                    <span className="text-2.5xl font-black text-gray-900 dark:text-white block tracking-tight">
                      {roi.speedImprovementPercent}% Faster
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">average response reduction</span>
                  </div>
                  
                  {/* Small progress meter visualizer */}
                  <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-indigo-650 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${roi.speedImprovementPercent}%` }}
                    />
                  </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-600" />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-center text-sm font-bold uppercase tracking-widest text-[#0ea5e9]">
          Platform Capabilities
        </h2>
        <p className="text-center text-2xl sm:text-3xl font-bold mt-2 text-gray-900 dark:text-white mb-12">
          Designed for elite support performance
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Bento Card 1 */}
          <div className="interactive-tilt-card perspective-1000 preserve-3d rounded-3xl border border-gray-150 bg-white/80 p-6 dark:border-slate-800/40 dark:bg-[#0f172a]/80 shadow-sm hover:shadow-3d-lg cursor-pointer transition-all duration-300">
            <div className="translate-z-30 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400 shadow-3d-sm hover:rotate-12 transition">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="translate-z-20 text-base font-bold text-gray-900 dark:text-white">Instant Ticketing</h3>
            <p className="mt-2 text-xs text-gray-400 dark:text-slate-400 leading-relaxed">
              Customers can instantly register and submit a highly categorized, prioritized ticket to our support pools.
            </p>
          </div>

          {/* Bento Card 2 */}
          <div className="interactive-tilt-card perspective-1000 preserve-3d rounded-3xl border border-gray-150 bg-white/80 p-6 dark:border-slate-800/40 dark:bg-[#0f172a]/80 shadow-sm hover:shadow-3d-lg cursor-pointer transition-all duration-300">
            <div className="translate-z-30 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400 shadow-3d-sm hover:-rotate-12 transition">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="translate-z-20 text-base font-bold text-gray-900 dark:text-white">Active Socket Messages</h3>
            <p className="mt-2 text-xs text-gray-400 dark:text-slate-400 leading-relaxed">
              Real-time communication powered by custom Socket.IO bridges, providing typing states, online status, and bubble notifications.
            </p>
          </div>

          {/* Bento Card 3 */}
          <div className="interactive-tilt-card perspective-1000 preserve-3d rounded-3xl border border-gray-150 bg-white/80 p-6 dark:border-slate-800/40 dark:bg-[#0f172a]/80 shadow-sm hover:shadow-3d-lg cursor-pointer transition-all duration-300 col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="translate-z-30 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400 shadow-3d-sm hover:-rotate-12 transition">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="translate-z-20 text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>InterBot Co-Pilot</span>
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 uppercase dark:bg-sky-950 dark:text-sky-300">
                AI Enabled
              </span>
            </h3>
            <p className="mt-2 text-xs text-gray-400 dark:text-slate-400 leading-relaxed">
              Integrated directly with Gemini to answer incoming customer questions correctly, referencing existing logs.
            </p>
          </div>
        </div>
      </section>

      {/* Floating Messenger Launcher widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95 transition"
          aria-label="Toggle AI Assistance messenger widget"
        >
          {chatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </button>

        {/* Messenger Expanded interface overlay */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="absolute bottom-16 right-0 w-80 sm:w-96 rounded-3xl border border-gray-100 bg-white shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-[#111827]"
            >
              {/* Header card banner */}
              <div className="bg-gradient-to-tr from-sky-600 to-indigo-700 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                    <Bot className="h-5 w-5 text-amber-300 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">InterBot Live Assistant</h3>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-400 animate-ping" />
                      <span className="text-[10px] text-sky-100 font-mono">Gemini 3.5 AI Core Online</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="rounded-lg p-1 text-sky-100 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Chat Thread history */}
              <div className="h-80 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-gray-200">
                {guestMessages.map((msg, idx) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[80%] ${isBot ? 'self-start' : 'self-end'}`}
                    >
                      <div className={`rounded-2xl p-3 text-xs leading-normal ${
                        isBot 
                          ? 'bg-slate-100 text-gray-800 dark:bg-slate-800 dark:text-slate-100' 
                          : 'bg-indigo-600 text-white rounded-br-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className={`text-[8px] text-gray-400 mt-1 ${isBot ? 'self-start' : 'self-end'}`}>
                        {msg.time}
                      </span>
                    </div>
                  );
                })}

                {isBotTyping && (
                  <div className="flex items-center gap-1.5 self-start bg-slate-150 rounded-2xl px-4 py-2 text-xs text-gray-400 dark:bg-slate-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat footer actions and form entry */}
              <div className="border-t p-3 dark:border-slate-800 bg-gray-50/50 dark:bg-transparent">
                <form onSubmit={handleGuestSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={guestInput}
                    onChange={(e) => setGuestInput(e.target.value)}
                    placeholder="Ask standard topics..."
                    className="flex-1 rounded-xl border border-gray-250 bg-white px-3 py-2 text-xs text-gray-900 focus:ring-1 focus:ring-sky-500 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow hover:opacity-90"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
                <div className="text-center text-[9px] text-gray-400 mt-2 font-medium">
                  Log in with credentials to test full live Socket boards!
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Space-Age Footer */}
      <footer className="relative z-10 mt-28 border-t border-gray-150 bg-white/65 dark:border-slate-850/80 dark:bg-slate-950/40 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          
          {/* Upper Section: Core Platform Live Telemetry Bar */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-gray-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/20 p-5 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                <Cpu className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-450 block tracking-wider">Engine Cluster</span>
                <span className="text-xs font-black text-gray-800 dark:text-amber-400">gemini-3.5-flash-active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-450 block tracking-wider">WebSocket Latency</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">14ms average (99.8% uptime)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-450 block tracking-wider">Security Layer</span>
                <span className="text-xs font-black text-gray-800 dark:text-slate-300">TLS 1.3 / HMAC Webhook Cryptography</span>
              </div>
            </div>
          </div>

          {/* Navigational Link Grids - Adjusted to standard 3 columns per request */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12 text-left">
            
            {/* Column 1: Core Platform */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-indigo-500" />
                <span>Intercomly Core</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-gray-550 mr-4">
                The world's first support automation command center natively powered by Gemini live diagnostics.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">100% Client Managed</span>
              </div>
            </div>

            {/* Column 2: Interactive Sandbox Options */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Features</h4>
              <ul className="space-y-2 text-[11px] text-gray-500 dark:text-slate-400">
                <li>
                  <button onClick={() => setChatOpen(true)} className="hover:text-indigo-505 dark:hover:text-indigo-400 hover:underline transition text-left cursor-pointer">
                    Live Assistant Chatbot
                  </button>
                </li>
                <li>
                  <button onClick={() => { setView('customer'); }} className="hover:text-indigo-550 dark:hover:text-indigo-400 hover:underline transition text-left cursor-pointer">
                    Support Ticket Deflection
                  </button>
                </li>
                <li>
                  <button onClick={() => { setView('agent'); }} className="hover:text-indigo-550 dark:hover:text-indigo-400 hover:underline transition text-left cursor-pointer">
                    Live Agent Workspace
                  </button>
                </li>
                <li>
                  <button onClick={() => { setView('admin'); }} className="hover:text-indigo-550 dark:hover:text-indigo-400 hover:underline transition text-left cursor-pointer">
                    Admin Operational Controls
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform Security Standard Certification */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Security & Certifications</h4>
              <div className="rounded-2xl border border-gray-150 dark:border-slate-800 p-3.5 bg-slate-50/40 dark:bg-slate-900/10 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <Award className="h-4 w-4 text-amber-550 shrink-0" />
                  <span className="text-[10px] font-black uppercase text-gray-800 dark:text-slate-300 font-sans">Active ISO Cert</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">
                  All webhook raw messages and payload parameters undergo strict local HMAC verification cycles to isolate sandbox environments.
                </p>
              </div>
            </div>

          </div>

          {/* Lower section: copyright, privacy, terms, built credit */}
          <div className="border-t border-gray-100 dark:border-slate-900/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400">
            <div>
              <span>© 2026 Intercomly Cloud Support. All rights reserved globally.</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="hover:text-gray-600 dark:hover:text-white transition cursor-pointer">Security Policy</span>
              <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-slate-750" />
              <span className="hover:text-gray-650 dark:hover:text-white transition cursor-pointer">API Agreement</span>
              <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-slate-750" />
              <span className="hover:text-gray-650 dark:hover:text-white transition cursor-pointer">Terms of Service</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

// Simple visual arrow component representing interactive expansion cues
const ChevronArrowRight: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg 
      className={className} 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
};

export default LandingPage;
