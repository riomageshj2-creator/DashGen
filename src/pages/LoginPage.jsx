import { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import SignupForm from '../components/Auth/SignupForm';

export default function LoginPage({ onLogin, onSignup }) {
  const [isSignup, setIsSignup] = useState(false);

  if (isSignup) {
    return (
      <SignupForm
        onSignup={onSignup}
        onSwitchToLogin={() => setIsSignup(false)}
      />
    );
  }

  return (
    <LoginForm
      onLogin={onLogin}
      onSwitchToSignup={() => setIsSignup(true)}
    />
  );
}
