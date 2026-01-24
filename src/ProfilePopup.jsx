import React, { useEffect, useState } from 'react';

export default function ProfilePopup({ isOpen, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50px',
        right: '-10px',
        zIndex: 2000,
        pointerEvents: isOpen ? 'auto' : 'none',
        filter: isOpen ? 'opacity(1) translateY(0) scale(1)' : 'opacity(0) translateY(-10px) scale(0.96)',
        transformOrigin: 'top right',
        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div
        style={{
            position: 'relative',
            width: '320px',
            // Dark Graphite Surface
            background: '#27272a', 
            borderRadius: '12px',
            border: '1px solid #3f3f46',
            boxShadow: '0 2px 6px 2px rgba(0, 0, 0, 0.15)',
            padding: '24px',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: '#f4f4f5'
        }}
      >
        
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '24px'
        }}>
             <div style={{
                 width: '86px',
                 height: '86px',
                 borderRadius: '50%',
                 background: '#3f3f46', 
                 border: 'none',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 fontSize: '38px',
                 marginBottom: '16px',
                 boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
             }}>
                 🥷
             </div>
        
            <h2 style={{
                margin: '0',
                fontSize: '20px',
                fontWeight: 500,
                color: '#f4f4f5',
                letterSpacing: '-0.3px',
                textAlign: 'center'
            }}>
               Phaneendhar Nittala
            </h2>
            <p style={{
                margin: '4px 0 0',
                fontSize: '13px',
                fontWeight: 400,
                color: '#a1a1aa', 
                textAlign: 'center'
            }}>
                Developer & Forensic Science Graduate
            </p>
        </div>

        {/* Content List */}
        <div style={{
            background: '#18181b', 
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '24px'
        }}>
            <div style={itemStyle}>
                <span style={labelStyle}>Education</span>
                <span style={valueStyle}>B.Sc. Forensic Science</span>
            </div>
            <div style={{ ...itemStyle, borderBottom: 'none' }}>
                <span style={labelStyle}>University</span>
                <span style={valueStyle}>Centurion University of Technology and Management</span>
            </div>

        </div>

        {/* Connect Section */}
        <div>
            <div style={{ 
                fontSize: '10px', 
                fontWeight: 700, 
                color: '#52525b', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                marginBottom: '12px',
                textAlign: 'center'
            }}>
                CONNECT
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <a 
                    href="mailto:nittalaphaneendhar@gmail.com" 
                    style={socialLinkStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.background = '#3f3f46'}
                    title="Email"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </a>
                <a 
                    href="https://www.linkedin.com/in/nittalaphaneendhar" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={socialLinkStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#0077b5'}
                    onMouseLeave={e => e.currentTarget.style.background = '#3f3f46'}
                    title="LinkedIn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a 
                    href="https://github.com/nittalaphaneendhar" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={socialLinkStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#171515'}
                    onMouseLeave={e => e.currentTarget.style.background = '#3f3f46'}
                    title="GitHub"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                </a>
            </div>
        </div>
    </div>
    </div>
  );
}

const itemStyle = {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 14px',
    borderBottom: '1px solid #3f3f46', 
    gap: '3px'
};

const labelStyle = {
    fontSize: '11px',
    fontWeight: 500,
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
};

const valueStyle = {
    fontSize: '13px',
    color: '#f4f4f5',
    fontWeight: 400,
    lineHeight: 1.35
};

const socialLinkStyle = {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#3f3f46',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f4f4f5',
    textDecoration: 'none',
    fontSize: '18px',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255,255,255,0.05)'
};
