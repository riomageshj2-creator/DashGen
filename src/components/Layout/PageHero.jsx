import React from 'react';

export default function PageHero({ title, description, icon: Icon, variant = 'primary' }) {
  const getGradient = () => {
    switch(variant) {
      case 'primary': return 'var(--gradient-primary)';
      case 'success': return 'var(--gradient-success)';
      case 'danger': return 'var(--gradient-danger)';
      default: return 'var(--gradient-primary)';
    }
  };

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      padding: '40px 32px',
      marginBottom: '32px',
      border: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-card)',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      alignItems: 'center',
      gap: '24px'
    }} className="fade-in">
      {/* Decorative Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '400px',
        height: '400px',
        background: getGradient(),
        opacity: 0.08,
        filter: 'blur(80px)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '5%',
        width: '200px',
        height: '200px',
        background: getGradient(),
        opacity: 0.05,
        filter: 'blur(60px)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Icon Container */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: variant === 'danger' ? 'var(--danger)' : variant === 'success' ? 'var(--success)' : 'var(--accent-primary)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        zIndex: 1
      }}>
        {Icon && <Icon size={32} strokeWidth={1.5} />}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 800, 
          color: 'var(--text-primary)', 
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          {title}
        </h1>
        <p style={{ 
          fontSize: '15px', 
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          fontWeight: 400
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}
