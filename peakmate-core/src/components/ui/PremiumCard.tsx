import React from 'react';

interface PremiumCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    gradientClass?: string;
    trend?: {
        value: number;
        isUp: boolean;
    };
    children?: React.ReactNode;
}

export function PremiumCard({ label, value, icon, gradientClass = 'premium-gradient-1', trend, children }: PremiumCardProps) {
    return (
        <div className="neo-glass-card neo-glass" style={{ minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Background Decorative Gradient Circle */}
            <div className={`animate-float ${gradientClass}`} style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                filter: 'blur(40px)',
                opacity: 0.4,
                zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</span>
                    {icon && <div style={{ color: 'var(--color-primary)', opacity: 0.8 }}>{icon}</div>}
                </div>

                <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                    {value}
                </div>

                {trend && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 8,
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 600,
                        color: trend.isUp ? 'var(--color-success)' : 'var(--color-error)',
                        background: trend.isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 12
                    }}>
                        {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </div>
                )}
            </div>

            <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto' }}>
                {children}
            </div>
        </div>
    );
}
