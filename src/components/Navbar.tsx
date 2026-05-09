import React from 'react';

interface NavbarProps {
  onFeedbackClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onFeedbackClick }) => (
  <nav
    className="bg-slate-800 text-white shadow-md px-6 py-4 flex items-center justify-between z-20 shrink-0"
    role="banner"
  >
    <div className="flex items-center gap-3">
      <svg
        className="w-6 h-6 text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h3a1 1 0 011 1v5m-5 0v-5a1 1 0 011-1h3a1 1 0 011 1v5m-4 2h.01"
        />
      </svg>
      <h1 className="text-xl font-bold tracking-wider">结构力学计算器</h1>
    </div>
    <button
      type="button"
      onClick={onFeedbackClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        backgroundColor: '#2563eb',
        color: '#fff',
        padding: '0.45rem 0.8rem',
        borderRadius: '0.375rem',
        fontSize: '0.85rem',
        fontWeight: 600,
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.08)',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 10h8M8 14h5m8-2a9 9 0 11-4.2-7.62L21 3v5h-5"
        />
      </svg>
      用户反馈
    </button>
  </nav>
);

export default Navbar;
