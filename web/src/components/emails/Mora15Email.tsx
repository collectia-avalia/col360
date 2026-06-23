import React from 'react';

interface Mora15EmailProps {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}

export const Mora15Email: React.FC<Mora15EmailProps> = ({
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
        borderBottom: '4px solid #B91C1C', // Rojo oscuro para advertencia muy grave (suspensión)
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
        backgroundColor: '#FEE2E2', // Rojo
        borderLeft: '4px solid #B91C1C', // Rojo oscuro
        padding: '16px 20px',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#991B1B',
        marginTop: '16px',
        marginBottom: '16px',
        fontWeight: 'bold',
    };

    const warningBoxStyle = {
        backgroundColor: '#FFFBEB', // Amarillo/Naranja de advertencia
        border: '1px solid #FDE68A',
        padding: '16px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#92400E',
        marginTop: '20px',
        marginBottom: '20px',
        lineHeight: '1.5',
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
                    Aval<span style={{ color: '#B91C1C' }}>IA</span>
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8', fontWeight: '500' }}>
                    Notificación de Suspensión de Cupo
                </p>
            </div>

            <div style={bodyStyle}>
                <p style={{ fontSize: '15px', margin: '0 0 16px 0' }}>
                    Estimado/a <strong>{contactName}</strong> (de {razonSocial}),
                </p>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Te informamos que debido al no pago de la factura N° **{invoiceNumber}** con tu proveedor **{clientName}** por valor de **{amount} COP**, la cual cuenta con **15 días de mora**, **hemos procedido a suspender temporalmente tu cupo de crédito comercial**.
                </p>

                <div style={alertBoxStyle}>
                    ESTADO DE CUPO: SUSPENDIDO TEMPORALMENTE
                </div>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Esta suspensión temporal impide realizar nuevas compras a crédito con el respaldo de Avalia ante este y cualquier otro proveedor de nuestra red, hasta que la obligación pendiente sea cancelada en su totalidad.
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

                <div style={warningBoxStyle}>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', textTransform: 'uppercase' as const, fontSize: '12px', letterSpacing: '0.05em' }}>
                        Advertencia Importante
                    </p>
                    <p style={{ margin: 0 }}>
                        De continuar la mora y superar los <strong>30 días</strong>, de acuerdo con la legislación vigente, nos veremos obligados a <strong>reportar esta obligación en mora ante las centrales de información financiera (Datacrédito y TransUnion)</strong> e iniciar el **proceso de cobro coactivo judicial** correspondiente.
                    </p>
                </div>

                <p style={{ fontSize: '14px', margin: '20px 0 12px 0', color: '#0F172A', fontWeight: 'bold' }}>
                    Acción Requerida:
                </p>
                <p style={{ fontSize: '14px', margin: '0 0 24px 0', color: '#475569', lineHeight: '1.5' }}>
                    Te instamos a regularizar tu situación de forma inmediata realizando el pago **en los canales que el cliente {clientName} dispuso para tal fin** y enviando el comprobante de manera urgente. Una vez verificado el pago por el proveedor, tu cupo será reactivado de inmediato.
                </p>
            </div>

            <div style={footerStyle}>
                <p style={{ margin: '0 0 4px 0' }}>
                    © {new Date().getFullYear()} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style={{ margin: '0', fontSize: '11px', color: '#94A3B8' }}>
                    Aviso legal y de cobro pre-jurídico.
                </p>
            </div>
        </div>
    );
};

export default Mora15Email;
