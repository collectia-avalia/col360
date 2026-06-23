import React from 'react';

interface Mora10EmailProps {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}

export const Mora10Email: React.FC<Mora10EmailProps> = ({
    contactName,
    razonSocial,
    invoiceNumber,
    amount,
    dueDate,
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
        padding: '24px 24px',
        textAlign: 'center' as const,
        borderBottom: '4px solid #DC2626', // Rojo/Naranja para advertencia alta
    };

    const logoStyle = {
        fontSize: '24px',
        fontWeight: '800',
        letterSpacing: '-0.025em',
        margin: 0,
    };

    const bodyStyle = {
        padding: '32px 24px',
        color: '#1E293B',
        lineHeight: '1.6',
    };

    const detailBoxStyle = {
        backgroundColor: '#F8FAFC',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px',
        marginBottom: '20px',
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '14px',
    };

    const labelStyle = {
        fontWeight: 'bold',
        color: '#64748B',
        padding: '8px 0',
        borderBottom: '1px solid #f1f5f9',
        width: '40%',
    };

    const valueStyle = {
        color: '#0F172A',
        padding: '8px 0',
        borderBottom: '1px solid #f1f5f9',
        fontWeight: '500',
    };

    const alertBoxStyle = {
        backgroundColor: '#FEF2F2', // Rojo muy claro
        borderLeft: '4px solid #DC2626', // Rojo
        padding: '12px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#991B1B',
        marginTop: '16px',
        marginBottom: '16px',
        fontWeight: '600',
    };

    const footerStyle = {
        backgroundColor: '#F8FAFC',
        padding: '20px',
        textAlign: 'center' as const,
        fontSize: '12px',
        color: '#94A3B8',
        borderTop: '1px solid #e2e8f0',
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h1 style={logoStyle}>
                    Aval<span style={{ color: '#DC2626' }}>IA</span>
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
                    Notificación Urgente de Mora
                </p>
            </div>

            <div style={bodyStyle}>
                <p style={{ fontSize: '15px', margin: '0 0 16px 0' }}>
                    Estimado/a <strong>{contactName}</strong> (de {razonSocial}),
                </p>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Te informamos que la factura N° **{invoiceNumber}** con tu proveedor **{clientName}** por valor de **{amount} COP** registra actualmente una mora prolongada.
                </p>

                <div style={alertBoxStyle}>
                    Esta obligación registra actualmente 10 días de mora.
                </div>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Esta situación comienza a generar un impacto negativo directo en tu **calificación crediticia interna** dentro de nuestra plataforma, lo cual podría limitar futuras solicitudes de incremento o renovación de cupo de crédito comercial con este y otros proveedores asociados a nuestra red.
                </p>

                <div style={detailBoxStyle}>
                    <table style={tableStyle}>
                        <tbody>
                            <tr>
                                <td style={labelStyle}>Proveedor / Facturador</td>
                                <td style={valueStyle}>{clientName}</td>
                            </tr>
                            <tr>
                                <td style={labelStyle}>Factura N°</td>
                                <td style={{ ...valueStyle, fontWeight: 'bold' }}>{invoiceNumber}</td>
                            </tr>
                            <tr>
                                <td style={labelStyle}>Monto Pendiente</td>
                                <td style={{ ...valueStyle, color: '#B91C1C', fontWeight: 'bold' }}>{amount} COP</td>
                            </tr>
                            <tr>
                                <td style={labelStyle}>Fecha Vencimiento</td>
                                <td style={valueStyle}>{dueDate}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p style={{ fontSize: '14px', margin: '20px 0 12px 0', color: '#0F172A', fontWeight: 'bold' }}>
                    Regularización de Cuenta:
                </p>
                <p style={{ fontSize: '14px', margin: '0 0 24px 0', color: '#475569', lineHeight: '1.5' }}>
                    Te solicitamos proceder con el pago inmediato **en los canales que el cliente {clientName} dispuso para tal fin** y remitir el soporte para restaurar tu calificación crediticia en el sistema.
                </p>

                <p style={{ fontSize: '13px', color: '#64748B', margin: '0', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
                    Si tienes algún inconveniente o necesitas reportar un acuerdo de pago, por favor ponte en contacto con tu proveedor a la brevedad.
                </p>
            </div>

            <div style={footerStyle}>
                <p style={{ margin: '0 0 4px 0' }}>
                    © {new Date().getFullYear()} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style={{ margin: '0', fontSize: '11px', color: '#94A3B8' }}>
                    Aviso formal de cartera.
                </p>
            </div>
        </div>
    );
};

export default Mora10Email;
