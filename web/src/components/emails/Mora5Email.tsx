import React from 'react';

interface Mora5EmailProps {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}

export const Mora5Email: React.FC<Mora5EmailProps> = ({
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
        borderBottom: '4px solid #EA580C', // Naranja para advertencia media
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
        backgroundColor: '#FFedd5', // Naranja muy claro
        borderLeft: '4px solid #EA580C', // Naranja
        padding: '12px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#C2410C',
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
                    Aval<span style={{ color: '#EA580C' }}>IA</span>
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
                    Segunda Notificación de Cobro
                </p>
            </div>

            <div style={bodyStyle}>
                <p style={{ fontSize: '15px', margin: '0 0 16px 0' }}>
                    Estimado/a <strong>{contactName}</strong> (de {razonSocial}),
                </p>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Nos comunicamos nuevamente en relación con la factura N° **{invoiceNumber}** emitida por tu proveedor **{clientName}** por valor de **{amount} COP**, la cual presenta un retraso en su pago.
                </p>

                <div style={alertBoxStyle}>
                    Esta obligación registra actualmente 5 días de mora.
                </div>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Mantener tus cuentas al día es indispensable para conservar activo tu cupo de crédito comercial garantizado por Avalia y evitar cobros por mora o recargos administrativos por parte de tu proveedor.
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
                    ¿Cómo realizar el pago?
                </p>
                <p style={{ fontSize: '14px', margin: '0 0 24px 0', color: '#475569', lineHeight: '1.5' }}>
                    Por favor, procede con la cancelación de este saldo **en los canales que el cliente {clientName} dispuso para tal fin** y remítenos el comprobante de pago respondiendo a este mensaje para actualizar tu estado de inmediato.
                </p>

                <p style={{ fontSize: '13px', color: '#64748B', margin: '0', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
                    Si realizaste el pago en las últimas 24 horas, puedes omitir este correo. Agradecemos tu compromiso y puntualidad.
                </p>
            </div>

            <div style={footerStyle}>
                <p style={{ margin: '0 0 4px 0' }}>
                    © {new Date().getFullYear()} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style={{ margin: '0', fontSize: '11px', color: '#94A3B8' }}>
                    Notificación automática de estado de cuenta.
                </p>
            </div>
        </div>
    );
};

export default Mora5Email;
