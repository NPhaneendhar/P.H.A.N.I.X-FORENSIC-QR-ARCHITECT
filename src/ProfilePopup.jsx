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
      className="backdrop" 
      onClick={onClose}
      style={{
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div
        className="glass"
        onClick={(e) => e.stopPropagation()}
        style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            padding: '32px 24px',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-secondary)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'var(--text-secondary)',
            padding: 0
          }}
        >
          ×
        </button>
        
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '28px'
        }}>
             <div style={{
                 width: '100px',
                 height: '100px',
                 borderRadius: '50%',
                 background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%)', 
                 border: '3px solid var(--accent)',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 marginBottom: '18px',
                 boxShadow: '0 0 30px rgba(0, 113, 227, 0.3)',
                 position: 'relative',
                 overflow: 'hidden'
             }}>
                 {/* CUSTOM CYBER EXPERT ILLUSTRATION */}
                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="var(--accent)" strokeWidth="1.5" />
                    <path d="M12 14C8 14 5 16 5 19V20H19V19C19 16 16 14 12 14Z" stroke="var(--accent)" strokeWidth="1.5" />
                    <path d="M9 8L11 10L15 6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="18" cy="5" r="1" fill="var(--accent)" opacity="0.6" />
                    <circle cx="4" cy="12" r="1" fill="var(--accent)" opacity="0.4" />
                    <circle cx="20" cy="15" r="1" fill="var(--accent)" opacity="0.5" />
                 </svg>
             </div>
        
            <h2 style={{
                margin: '0',
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.8px',
                textAlign: 'center'
            }}>
               Phaneendhar Nittala
            </h2>
            <p style={{
                margin: '8px 0 0',
                fontSize: '15px',
                fontWeight: 500,
                color: 'var(--text-secondary)', 
                textAlign: 'center',
                lineHeight: 1.4
            }}>
                Developer & Forensic Science Graduate
            </p>
        </div>

        {/* Content List */}
        <div style={{
            background: 'rgba(0,0,0,0.4)', 
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '28px',
            border: '1px solid var(--glass-border)'
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
                fontSize: '11px', 
                fontWeight: 800, 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '1.5px',
                marginBottom: '16px',
                textAlign: 'center'
            }}>
                CONNECT
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <a 
                    href="mailto:nittalaphaneendhar@gmail.com" 
                    style={socialLinkStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    title="Email"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </a>
                <a 
                    href="https://www.linkedin.com/in/nittalaphaneendhar" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={socialLinkStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#0077b5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    title="LinkedIn"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a 
                    href="https://github.com/nittalaphaneendhar" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={socialLinkStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#171515'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    title="GitHub"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
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
