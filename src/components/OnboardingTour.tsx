import React, { useEffect, useState } from 'react';
import { Joyride, Step, STATUS } from 'react-joyride';
import { useApp } from '../context/AppContext';

interface OnboardingTourProps {
  run: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onClose }) => {
  const { user, theme, activeView, conversations, activeConversation } = useApp();
  const [steps, setSteps] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !run) return;

    const baseSteps: any[] = [
      {
        target: '#tour-brand',
        title: '🚀 Space Center Control',
        content: 'Welcome to your service dashboard! This sidebar lets you manage system workspaces, switch profiles, and toggle layout preferences.',
        placement: 'right',
        disableBeacon: true,
      },
      {
        target: '#tour-nav-landing',
        title: '🪐 Cockpit Operations',
        content: 'Here you will find our interactive 3D elements and workspace stats tracking active service level agreements.',
        placement: 'right',
      },
      {
        target: '#tour-header-actions',
        title: '⚙️ Workspace Controls',
        content: 'Quickly access workspace settings, shift visual colors, and review diagnostic system messages at a glance.',
        placement: 'bottom',
      },
      {
        target: '#tour-user-card',
        title: '👤 Active Identity Card',
        content: 'Your account login status. Leverage these role tags to easily swap perspectives and test full user flows.',
        placement: 'right',
      }
    ];

    const customerSteps: any[] = [
      {
        target: '#tour-customer-title',
        title: '💬 Customer Care Board',
        content: 'Welcome to your custom dashboard! Initiate ticket requests, check answer records, and chat directly with agents in real-time.',
        placement: 'bottom',
      },
      {
        target: '#tour-submit-ticket-btn',
        title: '🎟️ Submit Support Claim',
        content: 'Need help? Specify your issue, set urgency, and submit instantly to connect to an specialized representative.',
        placement: 'left',
      },
      {
        target: '#tour-tickets-list',
        title: '📁 Ticket Influx Directory',
        content: 'Your ongoing support claims. Pick any item from the directory list to open the active socket chat thread.',
        placement: 'right',
      },
      {
        target: '#tour-chat-window-container',
        title: '⚡ Live Conversation Room',
        content: 'Review chronological chat threads, verify sent indicators, and communicate with dedicated technical agents.',
        placement: 'left',
      },
      {
        target: '#tour-ai-copilot-btn',
        title: '🤖 Server-Side Gemini Copilot',
        content: 'Request help from InterBot! Instantly parse chat context using our server-side system model to guide issues.',
        placement: 'left',
      },
      {
        target: '#tour-chat-input-area',
        title: '🎤 Dictate or Text Input',
        content: 'Type answers or use browser Web Speech audio dictation. You can also drag-and-drop helpful attachments directly.',
        placement: 'top',
      },
    ];

    const agentSteps: any[] = [
      {
        target: '#tour-agent-title',
        title: '📥 Agent Inbox Center',
        content: 'This is the operational core for agents to claim inbound workflows and handle incoming pipeline queries.',
        placement: 'bottom',
      },
      {
        target: '#tour-agent-filters',
        title: '🔍 Queue Navigation Pool',
        content: 'Filter tickets by ownership (Assigned to Me vs Unassigned Queue) and track current pending statuses.',
        placement: 'left',
      },
      {
        target: '#tour-agent-queue',
        title: '🔥 Real-Time Ticket Feed',
        content: 'Incoming requests with auto-parsed severity tags. Select any record to inspect and start working.',
        placement: 'right',
      },
      {
        target: '#tour-agent-chat-window',
        title: '✍️ Support Thread Control',
        content: 'Communicate directly with clients. Claim open tickets, release tags, or close conversations easily.',
        placement: 'left',
      },
      {
        target: '#tour-agent-ai-draft-btn',
        title: '💡 Smart AI Draft Assistant',
        content: 'Let Gemini model craft high-scoring replies! Speeds up customer service by feeding context into drafts.',
        placement: 'top',
      },
      {
        target: '#tour-agent-metadata-card',
        title: '📑 PERSISTENT CUSTOMER CRM',
        content: 'Inspect user bio data, company affiliation, and write custom diagnostic notes that persist securely.',
        placement: 'left',
      },
    ];

    const adminSteps: any[] = [
      {
        target: '#tour-nav-admin_dashboard',
        title: '📊 Administrative Hub',
        content: 'Access the SLA performance analytics suite and monitor customer transaction speeds or metric trends.',
        placement: 'right',
      },
      ...agentSteps,
    ];

    let finalSteps = [...baseSteps];

    if (user.role === 'customer') {
      finalSteps = [...finalSteps, ...customerSteps];
    } else if (user.role === 'agent') {
      finalSteps = [...finalSteps, ...agentSteps];
    } else if (user.role === 'admin') {
      finalSteps = [...finalSteps, ...adminSteps];
    }

    // Dynamic filtering to include only steps where the target DOM selector exists
    const validSteps = finalSteps.filter(step => {
      try {
        const el = document.querySelector(step.target);
        return el !== null;
      } catch (e) {
        return false;
      }
    });

    setSteps(validSteps);
  }, [user, run, activeView, conversations, activeConversation]);

  const handleJoyrideCallback = (data: any) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status) || type === 'tour:end') {
      localStorage.setItem('intercomly-tour-completed', 'true');
      onClose();
    }
  };

  // Determine styles depending on current dark or light mode theme
  const isDark = theme === 'dark';
  const JoyrideComponent = Joyride as any;

  if (!run || steps.length === 0) {
    return null;
  }

  return (
    <JoyrideComponent
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          arrowColor: isDark ? '#0f172a' : '#ffffff',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          overlayColor: 'rgba(15, 23, 42, 0.55)',
          primaryColor: '#6366f1',
          textColor: isDark ? '#f1f5f9' : '#1e293b',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '20px',
          border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.15)',
          boxShadow: isDark 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 25px 50px -12px rgba(99, 102, 241, 0.1)',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '13px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontWeight: '800',
          fontSize: '15px',
          marginBottom: '8px',
          color: isDark ? '#38bdf8' : '#4f46e5',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.025em',
        },
        tooltipContent: {
          padding: '4px 0 12px 0',
          lineHeight: '1.6',
          color: isDark ? '#94a3b8' : '#475569',
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '10px 16px',
          outline: 'none',
          boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        },
        buttonBack: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginRight: '12px',
          cursor: 'pointer',
        },
        buttonSkip: {
          color: '#ef4444',
          fontSize: '11px',
          fontWeight: 'extrabold',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          cursor: 'pointer',
        },
      } as any}
      locale={{
        last: 'Complete Tour',
        skip: 'Skip',
      }}
    />
  );
};
