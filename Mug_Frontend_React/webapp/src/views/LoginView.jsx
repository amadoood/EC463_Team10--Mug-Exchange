import { useState } from "react";

export default function LoginView({
  visible,
  mugLogo,
  username,
  password,
  loginError,
  onUsernameChange,
  onPasswordChange,
  onLogin,
  onGotoSignup,
}) {
  const [showMission, setShowMission] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!visible) return null;

  const handleKey = (e) => {
    if (e.key === "Enter") onLogin();
  };

  return (
    <main className="view auth-view">
      <div className="auth-bg">

        {/* Logo */}
        <div className="logo-wrap">
          <div className="logo-circle">
            <img src={mugLogo} alt="Mug Exchange" className="logo-img" />
          </div>
          <div className="brand-name">Mug Exchange</div>
          <div className="brand-tagline">reusable mugs, as easy as disposables</div>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-title">Welcome back</div>

          <div className="field">
            <label htmlFor="login-username">Username</label>
            <input id="login-username" className="input" placeholder="your_username"
              autoComplete="off" value={username}
              onChange={(e) => onUsernameChange(e.target.value)} onKeyDown={handleKey} />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div style={{position:"relative"}}>
              <input id="login-password" className="input" type={showPw ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e) => onPasswordChange(e.target.value)} onKeyDown={handleKey}
                style={{paddingRight:52}} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"0.72rem",fontWeight:500,letterSpacing:"0.03em"}}>
                {showPw
                  ? <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {loginError && <p className="err-text">Invalid credentials. Please try again.</p>}

          <button className="btn btn-primary btn-full" onClick={onLogin}>Log In</button>
          <button className="btn-link" onClick={onGotoSignup}>Don&apos;t have an account? Sign up</button>
        </div>

        {/* Our Mission trigger */}
        <button className="mission-trigger" onClick={() => setShowMission(true)}>
          🌿 Our mission
        </button>

        <p className="auth-footer">By continuing you agree to our Terms of Service and Privacy Policy</p>
      </div>

      {/* Mission modal */}
      {showMission && (
        <div className="modal-overlay" onClick={() => setShowMission(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowMission(false)}>✕</button>
            <div className="modal-logo-row">
              <img src={mugLogo} alt="" className="modal-logo" />
              <div>
                <div className="modal-headline">Reusable mugs,<br />as easy as disposables.</div>
              </div>
            </div>
            <p className="modal-body">
              We're building a world where grabbing coffee in a reusable mug is the default — not the exception. 
              Partnered with Boston's independent cafes, we make it effortless to reduce waste one cup at a time.
            </p>
            <div className="modal-items">
              {[
                { icon: "♻️", title: "Reuse over waste", body: "Every mug returned keeps a disposable cup out of the landfill." },
                { icon: "🤝", title: "Local cafe network", body: "Partnered with independent Boston cafes who care about their footprint." },
                { icon: "📡", title: "Seamless tracking", body: "Real-time mug status so returning is as easy as ordering." },
              ].map(({ icon, title, body }) => (
                <div key={title} className="modal-item">
                  <span className="modal-item-icon">{icon}</span>
                  <div>
                    <div className="modal-item-title">{title}</div>
                    <div className="modal-item-body">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}