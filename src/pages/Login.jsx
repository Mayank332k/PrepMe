import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import styles from './Login.module.css';
import logo from '../assets/logo.png';

export const Login = ({ onNavigate, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const rotatingMessages = [
    "Enhance your journey for free.",
    "AI-powered professional insights.",
    "Curate your professional narrative.",
    "Master your next interview."
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [rotatingMessages.length]);

  const workflowPhases = [
    { id: 'source', label: 'Source Workspace', icon: 'upload_file', color: 'var(--color-blue)' },
    { id: 'synthesis', label: 'AI Synthesis', icon: 'psychology', color: 'var(--color-purple)' },
    { id: 'analysis', label: 'Final Analysis', icon: 'analytics', color: 'var(--color-green)' }
  ];

  const [phaseIndex, setPhaseIndex] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % workflowPhases.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [workflowPhases.length]);

  const currentPhase = workflowPhases[phaseIndex];

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      setEmailError('');
      setPasswordError('');
      // Post to /auth/google - the browser now handles HttpOnly Cookie automatcially
      const response = await api.post('/auth/google', {
        idToken: credentialResponse.credential
      });

      const { user, accessToken } = response.data;
      
      // Store token for Bearer auth fallback
      if (accessToken) {
        localStorage.setItem('token', accessToken);
      }
      
      
      // Update global user state in App.jsx (this now handles navigation too)
      if (onAuthSuccess) onAuthSuccess(user);
      
    } catch (error) {
      console.error("Auth Error:", error.response?.data || error.message);
      const msg = error.response?.data?.message || "Google Authentication failed.";
      setEmailError(msg); // Google errors are usually account/email related
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = () => {
    setEmailError("Google Login was unsuccessful. Please check your account.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailError('');
    setPasswordError('');
    
    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const payload = isSignUp ? { name, email, password } : { email, password };
      
      const response = await api.post(endpoint, payload);
      const { user, accessToken } = response.data;
      
      if (accessToken) {
        localStorage.setItem('token', accessToken);
      }
      
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (error) {
      console.error("Manual Auth Error:", error.response?.data || error.message);
      const msg = error.response?.data?.message || "Authentication failed.";
      
      if (msg.toLowerCase().includes('password')) {
        setPasswordError(msg);
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('user') || msg.toLowerCase().includes('exist')) {
        setEmailError(msg);
      } else {
        setEmailError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.layout}>
        <section className={styles.editorialColumn}>
          <div className={styles.heroContent}>
            <span className={styles.kicker}>The future of careers</span>
            <h1 className={styles.headline}>
              Curate your <br/>
              <span className={styles.italic}>professional</span> <br/>
              narrative.
            </h1>
            <p className={styles.description}>
              Step into a world where your experience is treated like art. 
              We help you analyze, refine, and present your journey with precision.
            </p>
          </div>

          <div className={styles.workflowShowcase}>
            <div className={styles.stackScene}>
              {/* Window 1: Source */}
              <div className={`${styles.windowStack} ${phaseIndex === 0 ? styles.active : phaseIndex === 1 ? styles.prev : styles.next}`}>
                <div className={styles.previewWindow}>
                  <div className={styles.windowHeader} style={{ background: 'rgba(52, 152, 219, 0.05)' }}>
                    <div className={styles.windowDots}><span></span><span></span><span></span></div>
                    <div className={styles.windowAddress}>source_workspace.app</div>
                  </div>
                  <div className={styles.windowContent}>
                    <div className={styles.sourceInterface}>
                      <div className={styles.sidePanel}></div>
                      <div className={styles.editorArea}>
                        <div className={styles.codeLine} style={{ width: '80%' }}></div>
                        <div className={styles.codeLine} style={{ width: '60%' }}></div>
                        <div className={styles.docPulse}>
                          <span className="material-symbols-outlined">description</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Window 2: Synthesis */}
              <div className={`${styles.windowStack} ${phaseIndex === 1 ? styles.active : phaseIndex === 2 ? styles.prev : styles.next}`}>
                <div className={styles.previewWindow}>
                  <div className={styles.windowHeader} style={{ background: 'rgba(155, 89, 182, 0.05)' }}>
                    <div className={styles.windowDots}><span></span><span></span><span></span></div>
                    <div className={styles.windowAddress}>ai_synthesis.engine</div>
                  </div>
                  <div className={styles.windowContent}>
                    {currentPhase.id === 'synthesis' && (
                      <div className={styles.synthesisInterface}>
                        <div className={styles.scanScene3d}>
                          <div className={styles.pageSkeleton3d}>
                            {/* The 3D Page */}
                            <div className={styles.virtualPage}>
                              <div className={styles.pageHeader}></div>
                              {[...Array(8)].map((_, i) => (
                                <div key={i} className={styles.skeletonLine} style={{ width: `${Math.random() * 40 + 50}%` }}></div>
                              ))}
                            </div>
                            
                            {/* The Laser Scanner */}
                            <div className={styles.laserScanner}></div>
                          </div>
                        </div>
                        <div className={styles.statusLine}>Synthesizing Professional Identity...</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Window 3: Analysis */}
              <div className={`${styles.windowStack} ${phaseIndex === 2 ? styles.active : phaseIndex === 0 ? styles.prev : styles.next}`}>
                <div className={styles.previewWindow}>
                  <div className={styles.windowHeader} style={{ background: 'rgba(46, 213, 115, 0.05)' }}>
                    <div className={styles.windowDots}><span></span><span></span><span></span></div>
                    <div className={styles.windowAddress}>final_report.dashboard</div>
                  </div>
                  <div className={styles.windowContent}>
                    <div className={styles.analysisInterface}>
                      <div className={styles.miniDashboard}>
                        <div className={styles.miniTopRow}>
                          <div className={styles.miniScoreSection}>
                            <div className={styles.premiumRing}>
                              <svg viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--bg-base)" strokeWidth="3"></circle>
                                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-green)" strokeWidth="3" strokeDasharray="85 100" strokeLinecap="round"></circle>
                              </svg>
                              <span className={styles.scoreText}>84</span>
                            </div>
                            <span className={styles.miniLabel}>Overall Score</span>
                          </div>
                          
                          <div className={styles.miniMetricsGrid}>
                            <div className={styles.miniMetricBar} style={{ '--progress': '90%' }}></div>
                            <div className={styles.miniMetricBar} style={{ '--progress': '75%' }}></div>
                            <div className={styles.miniMetricBar} style={{ '--progress': '60%' }}></div>
                          </div>
                        </div>

                        <div className={styles.miniBadges}>
                          <div className={`${styles.miniBadge} ${styles.strength}`}>Strengths</div>
                          <div className={`${styles.miniBadge} ${styles.growth}`}>Growth</div>
                        </div>
                        
                        <div className={styles.miniSkeletonLines}>
                          <div className={styles.skeletonLineShort}></div>
                          <div className={styles.skeletonLineFull}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.phaseIndicator}>
              {workflowPhases.map((phase, idx) => (
                <div 
                  key={phase.id} 
                  className={`${styles.indicatorDot} ${idx === phaseIndex ? styles.active : ''}`}
                  onClick={() => setPhaseIndex(idx)}
                  style={{ '--phase-color': phase.color, cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined">{phase.icon}</span>
                  {idx === phaseIndex && <span className={styles.indicatorLabel}>{phase.label}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.formColumn}>
          <div className={styles.brandHeader}>
            <div className={styles.logoIcon}>
              <img src={logo} alt="Logo" className={styles.logoImg} />
            </div>
            <div className={styles.messageCycler}>
              {rotatingMessages.map((msg, idx) => (
                <p 
                  key={idx} 
                  className={`${styles.cycleText} ${idx === messageIndex ? styles.active : ''}`}
                >
                  {msg}
                </p>
              ))}
            </div>
          </div>

          <Card className={styles.authCard}>
            <div className={styles.cardNav}>
              <button 
                className={`${styles.navTab} ${!isSignUp ? styles.activeTab : ''}`}
                onClick={() => { setIsSignUp(false); setEmailError(''); setPasswordError(''); }}
              >
                Sign In
              </button>
              <button 
                className={`${styles.navTab} ${isSignUp ? styles.activeTab : ''}`}
                onClick={() => { setIsSignUp(true); setEmailError(''); setPasswordError(''); }}
              >
                Sign Up
              </button>
            </div>

            <div className={styles.googleBtnWrapper}>
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                theme="filled_blue"
                shape="pill"
                size="large"
                width="100%"
              />
            </div>

            <div className={styles.divider}>
              <span className={styles.dividerText}>or continue with email</span>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={`${styles.nameFieldContainer} ${isSignUp ? styles.fieldVisible : ''}`}>
                <div className={styles.formGroup}>
                  <Input 
                    label="Full Name"
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <Input 
                  label="Email address"
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  error={emailError}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <Input 
                  label="Password"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  error={passwordError}
                  required
                  suffix={
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.eyeBtn}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  }
                />
              </div>

              <Button type="submit" fullWidth loading={isLoading} className={styles.submitBtn}>
                {isLoading 
                  ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                  : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <footer className={styles.cardFooter}>
              <p>
                {isSignUp ? 'Already have an account?' : 'New to PrepMe?'} 
                <button 
                  className={styles.toggleLink}
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </footer>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default Login;
