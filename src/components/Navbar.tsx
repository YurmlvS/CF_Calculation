import React from 'react';

/**
 * 顶部导航栏组件
 */
const Navbar: React.FC = () => (
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
      <h1 className="text-xl font-bold tracking-wider">
        结构力学计算器{' '}
        <span className="text-sm font-normal text-slate-300">
          (Structural Mechanics)
        </span>
      </h1>
    </div>
    <div className="text-sm text-slate-400">工程辅助计算系统 v2.0</div>
  </nav>
);

export default Navbar;
