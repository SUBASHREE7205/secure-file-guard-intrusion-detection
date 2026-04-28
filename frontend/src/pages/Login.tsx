import { useState } from "react";
import { FaUser, FaLock, FaShieldAlt, FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("auth", "true");
    navigate("/dashboard");
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.setItem("auth", "true");
      navigate("/dashboard");
    } catch (error) {
      console.error("Google login failed", error);
    }
  };


  return (
    <div className="flex w-full min-h-screen font-sans" style={{ backgroundColor: "#020617", color: "#f8fafc" }}>
      {/* Dynamic Enterprise Styling & Animations */}
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .force-green-btn {
          background-color: #10b981 !important;
          background-image: none !important;
          border: 1px solid #10b981 !important;
          color: white !important;
        }
        .force-green-btn:hover {
          background-color: #059669 !important;
          border-color: #059669 !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -6px rgba(16, 185, 129, 0.6) !important;
        }
        .force-glass-btn {
          background-color: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: white !important;
        }
        .force-glass-btn:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .custom-input {
          background-color: rgba(15, 23, 42, 0.6) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid #1e293b !important;
        }
        .custom-input:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 1px #10b981, inset 0 1px 2px rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>
      
      {/* LEFT SIDE: Pure Code Dynamic Visualization (Never Breaks) */}
      <div className="hidden lg:flex relative w-[40%] flex-shrink-0 flex-col overflow-hidden border-r border-[#1e293b] bg-[#020617]" style={{ minHeight: '100vh' }}>
        
        {/* Dynamic Architectural CSS Grid */}
        <div 
          className="absolute inset-0 w-full h-full opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.15), transparent 35%),
              radial-gradient(circle at 85% 30%, rgba(14, 165, 233, 0.08), transparent 30%),
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px',
            backgroundPosition: '0 0, 0 0, -1px -1px, -1px -1px'
          }}
        ></div>

        {/* Animated Radar/Aegis Shield Graphics */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          
          <div className="relative w-72 h-72 flex items-center justify-center" style={{ animation: 'pulse-glow 5s ease-in-out infinite' }}>
            
            {/* Spinning Outer Ring */}
            <div className="absolute inset-0 rounded-full border border-emerald-500/10 border-dashed animate-[spin_20s_linear_infinite]"></div>
            
            {/* Reverse Spinning Middle Tech Ring */}
            <div className="absolute w-[80%] h-[80%] rounded-full border-t-2 border-r-2 border-emerald-500/30 animate-[spin_12s_linear_infinite_reverse]"></div>
            <div className="absolute w-[80%] h-[80%] rounded-full border-b-2 border-l-2 border-emerald-500/10 animate-[spin_12s_linear_infinite_reverse]"></div>
            
            {/* Static Inner Glow Ring */}
            <div className="absolute w-[55%] h-[55%] rounded-full border border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)_inset]"></div>
            
            {/* Core Shield */}
            <div className="relative flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-xl backdrop-blur-md border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <FaShieldAlt className="text-4xl text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>

            {/* Orbiting Nodes */}
            <div className="absolute top-0 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]"></div>
            <div className="absolute bottom-0 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]"></div>
            <div className="absolute left-0 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]"></div>
            
          </div>
          
          {/* Status Typography */}
          <div className="mt-16 flex flex-col items-center">
            <p className="text-emerald-500 tracking-[0.4em] font-bold text-sm mb-3 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">NETWORK SECURE</p>
            <div className="flex gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></div>
               <div className="w-1.5 h-1.5 bg-emerald-500/60 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
               <div className="w-1.5 h-1.5 bg-emerald-500/30 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
            </div>
          </div>
        </div>

        {/* Global Scanline Effect */}
        <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.15] overflow-hidden">
          <div className="w-full h-[2px] bg-emerald-400 shadow-[0_0_15px_#10b981]" style={{ animation: 'scanline 8s linear infinite' }}></div>
        </div>
        
        {/* Subtle shadow on the right edge to blend with the form */}
        <div className="absolute inset-y-0 right-0 w-12 z-30 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, rgba(2, 6, 23, 0.8))' }}></div>
        
        {/* Tiny clean watermark logo in the bottom corner */}
        <div className="absolute bottom-8 left-8 z-30 flex items-center gap-2 px-4 py-2 opacity-60">
          <FaShieldAlt style={{ color: '#10b981', fontSize: '1rem' }} />
          <span style={{ color: 'white', fontWeight: 'bold', letterSpacing: '0.15em', fontSize: '0.8rem', textTransform: 'uppercase' }}>SecureFileGuard</span>
        </div>
      </div>

      {/* RIGHT SIDE: Hyper-Professional Login Form */}
      <div className="w-full lg:w-[60%] lg:ml-[40%] min-h-screen flex flex-col justify-center items-center relative z-20 py-12">
        
        {/* Background glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {/* Main form container */}
        <div className="w-full max-w-[800px] mx-auto p-4 sm:p-10 relative z-10 w-full flex flex-col gap-6 sm:gap-10">
          
          {/* Header */}
          <div className="text-center">
            <div className="lg:hidden w-12 h-12 flex items-center justify-center rounded-xl shadow-lg mx-auto mb-6" style={{ backgroundColor: '#10b981', color: 'white' }}>
               <FaShieldAlt className="text-2xl" />
            </div>
            <h1 className="text-white" style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
               Authentication Gateway
            </h1>
          </div>

          {/* Reference Notice Box */}
          <div className="w-full p-5 rounded-2xl flex items-start gap-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div className="mt-0.5 flex-shrink-0" style={{ color: '#10b981' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#10b981', marginBottom: '0.2rem' }}>Security Protocol Notice</p>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6' }}>
                Please make sure that you login using the exact credentials authorized during your system enrollment. Unauthorized access attempts are actively monitored.
              </p>
            </div>
          </div>

          {/* Main Boxed Content Area */}
          <div className="p-8 sm:p-10 rounded-[28px] mt-12 sm:mt-16" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)' }}>
            
            {/* Flex Container for Multi-Column Layout */}
            <div className="flex flex-col md:flex-row items-stretch gap-6 md:gap-10">
            
            {/* LEFT COLUMN: Social/SSO Logins */}
            <div className="w-full md:flex-1 flex flex-col items-center justify-center gap-5">
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="force-glass-btn group relative flex items-center justify-center gap-3 w-[85%] max-w-[320px] mx-auto transition-all duration-300"
                style={{ 
                  padding: '16px', 
                  borderRadius: '14px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <div style={{ color: '#ea4335' }}><FaGoogle className="text-xl" /></div>
                <span>Login with Google</span>
              </button>
            </div>

            {/* MIDDLE: Vertical Divider */}
            <div className="hidden md:flex flex-col items-center justify-center px-2">
              <div className="w-px bg-[#1e293b]" style={{ height: '90px' }}></div>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', padding: '16px 0' }}>OR</span>
              <div className="w-px bg-[#1e293b]" style={{ height: '90px' }}></div>
            </div>

            {/* Mobile Horizontal Divider */}
            <div className="md:hidden flex items-center justify-center w-full py-4">
              <div className="h-px w-full bg-[#1e293b]"></div>
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', padding: '0 20px' }}>OR</span>
              <div className="h-px w-full bg-[#1e293b]"></div>
            </div>

            {/* RIGHT COLUMN: Standard Form */}
            <div className="w-full md:flex-[1.2] flex flex-col justify-center">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Username/Email Field */}
                <div className="space-y-2">
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1', display: 'block' }}>Username</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <FaUser className="text-[#64748b] group-focus-within:text-[#10b981] transition-colors" style={{ fontSize: '1rem' }} />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="custom-input"
                      style={{ 
                        width: '100%', 
                        padding: '14px 16px 14px 46px', 
                        borderRadius: '12px', 
                        color: '#f8fafc',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1', display: 'block' }}>Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <FaLock className="text-[#64748b] group-focus-within:text-[#10b981] transition-colors" style={{ fontSize: '1rem' }} />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="custom-input"
                      style={{ 
                        width: '100%', 
                        padding: '14px 16px 14px 46px', 
                        borderRadius: '12px', 
                        color: '#f8fafc',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="force-green-btn w-full transition-all duration-300"
                  style={{ 
                    padding: '16px', 
                    borderRadius: '12px',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
                >
                  Sign In to System
                </button>
                
                {/* Forgot Password Link */}
                <div className="text-center mt-5">
                  <a href="#" className="hover:text-emerald-400 transition-colors" style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '600', textDecoration: 'none' }}>
                    Forgot your password?
                  </a>
                </div>
                
              </form>
            </div>
          </div>
          </div> {/* Content Box End */}

          {/* Bottom Footer / Sign up */}
          <div className="relative flex flex-col items-center gap-6 w-full mt-4">
            <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>
              Don't have an account?{' '}
              <a href="#" className="hover:text-emerald-400 transition-colors" style={{ color: '#10b981', fontWeight: '700', textDecoration: 'none' }}>
                Sign up now
              </a>
            </p>
          </div>

        </div>

        {/* Enterprise Legal / Copyright Footer (Pushed to bottom) */}
        <div className="absolute bottom-6 w-full px-6 md:px-16 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold z-10" style={{ color: '#475569' }}>
          <div>
            &copy; {new Date().getFullYear()} SecureFileGuard. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#94a3b8] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#94a3b8] transition-colors">Terms of Service</a>
            <span className="flex items-center gap-1">
              Engineered with <FaShieldAlt className="text-[#10b981]" />
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}