import React from 'react';

interface Mora1EmailProps {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}

export const Mora1Email: React.FC<Mora1EmailProps> = ({
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
        borderBottom: '4px solid #2563EB', // Avalia Blue Accent for standard notices
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
        backgroundColor: '#FEF3C7', // Amarillo claro
        borderLeft: '4px solid #D97706', // Amarillo oscuro
        padding: '12px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#92400E',
        marginTop: '16px',
        marginBottom: '16px',
        fontWeight: '500',
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
                    Aval<span style={{ color: '#2563EB' }}>IA</span>
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
                    Recordatorio de Vencimiento
                </p>
            </div>

            <div style={bodyStyle}>
                <p style={{ fontSize: '15px', margin: '0 0 16px 0' }}>
                    Estimado/a <strong>{contactName}</strong> (de {razonSocial}),
                </p>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Esperamos que te encuentres muy bien.
                </p>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Te escribimos para recordarte de manera amable que la factura N° **{invoiceNumber}** con tu proveedor **{clientName}** venció el día de ayer.
                </p>

                <div style={alertBoxStyle}>
                    Esta obligación registra 1 día de mora en el sistema.
                </div>

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

                <p style={{ fontSize: '14px', margin: '20px 0 16px 0', color: '#334155', fontWeight: 'bold' }}>
                    Instrucciones de Pago:
                </p>
                <p style={{ fontSize: '14px', margin: '0 0 24px 0', color: '#475569', lineHeight: '1.5' }}>
                    Te invitamos a realizar el pago a la mayor brevedad. Recuerda que este pago debe efectuarse directamente **en los canales que el cliente {clientName} dispuso para tal fin**.
                </p>

                <p style={{ fontSize: '13px', color: '#64748B', margin: '0', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
                    Si ya realizaste el pago, por favor haz caso omiso de este correo o reenvíanos el soporte correspondiente para actualizar tu estado en la red Avalia.
                </p>
            </div>

            <div style={footerStyle}>
                <p style={{ margin: '0 0 4px 0' }}>
                    © {new Date().getFullYear()} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style={{ margin: '0', fontSize: '11px', color: '#94A3B8' }}>
                    Este es un aviso automático de cartera.
                </p>
            </div>
        </div>
    );
};

export default Mora1Email;
