export default function Icon({ name, size=20, stroke=1.8, className='', ...props }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", className };
  switch (name) {
    case 'home':       return (<svg {...common} {...props}><path d="M3 10.5L12 3l9 7.5"/><path d="M5 10.5V21h14V10.5"/></svg>);
    case 'sell':       return (<svg {...common} {...props}><path d="M7 7h10v4H7z"/><path d="M12 11v10"/><path d="M7 15h10"/></svg>);
    case 'chat':       return (<svg {...common} {...props}><path d="M21 12a8 8 0 10-3.3 6.5L21 21l-2-3.5A7.96 7.96 0 0021 12z"/></svg>);
    case 'orders':     return (<svg {...common} {...props}><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h6"/></svg>);
    case 'profile':    return (<svg {...common} {...props}><path d="M12 12a4 4 0 100-8 4 4 0 000 8z"/><path d="M4 21a8 8 0 0116 0"/></svg>);
    case 'search':     return (<svg {...common} {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/></svg>);
    case 'back':       return (<svg {...common} {...props}><path d="M15 18l-6-6 6-6"/></svg>);
    case 'cart':       return (<svg {...common} {...props}><path d="M6 6h14l-1.5 9H8z"/><circle cx="8" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>);
    case 'heart':      return (<svg {...common} {...props}><path d="M20.8 8.6a5.5 5.5 0 00-9.8-3.8A5.5 5.5 0 004 8.6c0 6.2 8 10.2 8 10.2s8-4 8-10.2z"/></svg>);
    case 'star':       return (<svg {...common} {...props}><path d="M12 3l2.7 5.5L21 9.3l-4.5 4.4L17.4 21 12 18l-5.4 3 1-7.3L3 9.3l6.3-.8z"/></svg>);
    case 'google':     return (<svg {...common} fill="currentColor" stroke="none" {...props}><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.147 8.027-3.24 2.053-2.053 2.627-5.307 2.627-8.24 0-.827-.067-1.427-.16-2.067h-10.5z"/></svg>);
    default:           return null;
  }
}
