import { useState } from 'react';
import { UserPlus, AlertCircle, Activity } from 'lucide-react';

export default function SignupForm({ onSignup, onSwitchToLogin, loading: authLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await onSignup(email, password, displayName);
      setSuccess('Account created! Check your email for verification, or sign in if email confirmation is disabled.');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Activity size={24} />
          </div>
          <div>
            <h1>DashGen</h1>
          </div>
        </div>
        <p className="auth-subtitle">Get started with your free dashboard analytics.</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="auth-error" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name">Display Name</label>
            <input
              id="signup-name"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading || authLoading}
          >
            {loading ? <span className="spinner" /> : <UserPlus size={18} />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
