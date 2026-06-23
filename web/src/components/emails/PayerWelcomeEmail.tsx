import React from 'react';

interface PayerWelcomeEmailProps {
    contactName: string;
    razonSocial: string;
    approvedQuota: string;
    clientName: string;
}

export const PayerWelcomeEmail: React.FC<PayerWelcomeEmailProps> = ({
    contactName,
    razonSocial,
    approvedQuota,
    clientName,
}) => {
    const containerStyle = {
        fontFamily: 'Geist Sans, Inter, system-ui, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        overflow: 'hidden' as const,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    };

    const headerStyle = {
        backgroundColor: '#0F172A', // Avalia Petrol
        color: '#ffffff',
        padding: '32px 24px',
        textAlign: 'center' as const,
        borderBottom: '4px solid #7C3AED', // Avalia Violet Accent
    };

    const logoStyle = {
        fontSize: '28px',
        fontWeight: '800',
        letterSpacing: '-0.025em',
        margin: 0,
    };

    const bodyStyle = {
        padding: '32px 24px',
        color: '#1E293B', // Texto Principal
        lineHeight: '1.6',
    };

    const quotaBoxStyle = {
        backgroundColor: '#F8FAFC',
        border: '1px solid #e2e8f0',
        padding: '24px',
        borderRadius: '8px',
        marginTop: '24px',
        marginBottom: '24px',
        textAlign: 'center' as const,
    };

    const quotaLabelStyle = {
        fontSize: '12px',
        fontWeight: '700',
        color: '#64748B', // Texto Secundario
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        display: 'block',
        marginBottom: '4px',
    };

    const quotaValueStyle = {
        fontSize: '32px',
        fontWeight: '900',
        color: '#0F172A',
        display: 'block',
    };

    const modelExplanationStyle = {
        backgroundColor: '#EFF6FF', // Fondo Azul claro
        borderLeft: '4px solid #2563EB', // Avalia Blue
        padding: '16px 20px',
        borderRadius: '4px',
        marginTop: '20px',
        marginBottom: '20px',
    };

    const buttonStyle = {
        display: 'inline-block',
        padding: '14px 28px',
        backgroundColor: '#2563EB', // Avalia Blue
        color: '#ffffff',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '16px',
        marginTop: '16px',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgb(37 99 235 / 0.1)',
        textAlign: 'center' as const,
    };

    const footerStyle = {
        backgroundColor: '#F8FAFC',
        padding: '24px',
        textAlign: 'center' as const,
        fontSize: '12px',
        color: '#94A3B8',
        borderTop: '1px solid #e2e8f0',
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h1 style={logoStyle}>
                    Aval<span style={{ color: '#7C3AED' }}>IA</span>
                </h1>
                <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                    Respaldo de Crédito Comercial
                </p>
            </div>

            <div style={bodyStyle}>
                <p style={{ fontSize: '16px', margin: '0 0 16px 0' }}>
                    Estimado/a <strong>{contactName}</strong>,
                </p>

                <p style={{ fontSize: '15px', margin: '0 0 16px 0', color: '#334155' }}>
                    Es un gusto saludarte y darte la bienvenida a la red de confianza de **Avalia**.
                </p>

                <p style={{ fontSize: '15px', margin: '0 0 16px 0', color: '#334155' }}>
                    Queremos informarte que, a solicitud de tu proveedor <strong>{clientName}</strong>, hemos culminado con éxito el estudio de riesgo y aprobado un cupo de crédito comercial para respaldar tus compras a plazo:
                </p>

                <div style={quotaBoxStyle}>
                    <span style={quotaLabelStyle}>Cupo Aprobado y Garantizado</span>
                    <span style={quotaValueStyle}>{approvedQuota} COP</span>
                </div>

                <div style={modelExplanationStyle}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1E3A8A', fontWeight: 'bold' }}>
                        ¿Cómo funciona tu cupo con Avalia?
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#1E40AF', lineHeight: '1.5' }}>
                        No somos factoring ni adelantamos dinero sobre tus facturas. Avalia actúa como una entidad fiadora (fianza comercial) que garantiza el pago de tus obligaciones a plazo con tu proveedor. Esto te permite comprar a crédito con la máxima confianza y fortalecer tu relación comercial.
                    </p>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '24px 0 12px 0' }}>
                    ¿Cómo mantener tu cupo activo?
                </h3>
                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#475569' }}>
                    Para disfrutar de este cupo de crédito y futuros incrementos, es fundamental que realices el pago puntual de cada factura emitida por tu proveedor. El cumplimiento oportuno de los plazos evita suspensiones temporales en la plataforma de facturación y mantiene intacto tu historial comercial en nuestra red y centrales de información financiera.
                </p>

                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: '24px 0 12px 0' }}>
                    Haz crecer tu negocio con Avalia
                </h3>
                <p style={{ fontSize: '14px', margin: '0 0 24px 0', color: '#475569' }}>
                    Al igual que hoy tu proveedor te otorga crédito respaldado por nosotros, tú también puedes ofrecer ventas a plazos a tus propios compradores sin asumir riesgo de cartera. Habilita cupos de crédito y vende de forma segura.
                </p>

                <div style={{ textAlign: 'center' }}>
                    <a href="https://avaliab2b.com" style={buttonStyle} target="_blank" rel="noreferrer">
                        Conocer más de Avalia
                    </a>
                </div>
            </div>

            <div style={footerStyle}>
                <p style={{ margin: '0 0 8px 0' }}>
                    © {new Date().getFullYear()} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#94A3B8' }}>
                    Si tienes dudas, contáctanos a <a href="mailto:comercial@avaliab2b.com" style={{ color: '#2563EB', textDecoration: 'none' }}>comercial@avaliab2b.com</a> o vía WhatsApp al <a href="https://wa.me/573015965775" style={{ color: '#2563EB', textDecoration: 'none' }}>+57 3015965775</a>.
                </p>
                <p style={{ margin: '0', fontSize: '11px', color: '#CBD5E1' }}>
                    Este es un correo informativo sobre tu cupo de crédito comercial.
                </p>
            </div>
        </div>
    );
};

export default PayerWelcomeEmail;
