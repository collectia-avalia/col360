import React from 'react';

interface Mora30EmailProps {
    contactName: string;
    razonSocial: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    clientName: string;
}

export const Mora30Email: React.FC<Mora30EmailProps> = ({
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
        border: '2px solid #7F1D1D', // Borde rojo oscuro grueso
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        overflow: 'hidden' as const,
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    };

    const headerStyle = {
        backgroundColor: '#7F1D1D', // Rojo sangre oscuro
        color: '#ffffff',
        padding: '28px 24px',
        textAlign: 'center' as const,
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
        backgroundColor: '#FEE2E2',
        borderLeft: '4px solid #7F1D1D',
        padding: '16px 20px',
        borderRadius: '4px',
        fontSize: '13px',
        color: '#7F1D1D',
        marginTop: '16px',
        marginBottom: '16px',
        fontWeight: 'bold',
        textAlign: 'center' as const,
    };

    const actionListStyle = {
        margin: '20px 0',
        paddingLeft: '20px',
        fontSize: '14px',
        color: '#334155',
    };

    const actionItemStyle = {
        marginBottom: '12px',
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
                    Aval<span style={{ color: '#FCA5A5' }}>IA</span>
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#FCA5A5', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Bloqueo de Cupo y Reporte a Centrales
                </p>
            </div>

            <div style={bodyStyle}>
                <p style={{ fontSize: '15px', margin: '0 0 16px 0' }}>
                    Estimado/a <strong>{contactName}</strong> (de {razonSocial}),
                </p>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Lamentamos informarte que la factura N° **{invoiceNumber}** con tu proveedor **{clientName}** por valor de **{amount} COP** presenta hoy **30 días de mora**.
                </p>

                <p style={{ fontSize: '14px', margin: '0 0 16px 0', color: '#334155' }}>
                    Al no haber recibido el pago ni un acuerdo de pago formal a la fecha, hemos procedido a ejecutar las siguientes acciones comerciales y legales:
                </p>

                <div style={alertBoxStyle}>
                    CUPO DE CRÉDITO BLOQUEADO DEFINITIVAMENTE / TRASLADO A COBRO JURÍDICO
                </div>

                <ol style={actionListStyle}>
                    <li style={actionItemStyle}>
                        <strong>Bloqueo Definitivo del Cupo:</strong> Tu cupo de crédito comercial con Avalia ha sido cancelado y bloqueado de forma permanente. No podrás acceder a crédito comercial en nuestra plataforma.
                    </li>
                    <li style={actionItemStyle}>
                        <strong>Reporte Negativo en Centrales de Riesgo:</strong> Se procederá de manera inmediata con el reporte negativo de esta obligación en las centrales de información financiera (Datacrédito y TransUnion), lo cual afectará tu historial y calificación de crédito a nivel nacional.
                    </li>
                    <li style={actionItemStyle}>
                        <strong>Traslado a Cobro Jurídico:</strong> El expediente ha sido transferido a nuestra firma de abogados externa para iniciar el cobro judicial de la obligación. Esto generará cargos adicionales por concepto de intereses de mora, honorarios de cobranza (hasta un 20%) y costos procesales.
                    </li>
                </ol>

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
                    Pago Inmediato:
                </p>
                <p style={{ fontSize: '14px', margin: '0 0 24px 0', color: '#475569', lineHeight: '1.5' }}>
                    Aún puedes evitar el cobro por la vía judicial y mitigar la permanencia del reporte negativo realizando el pago inmediato **en los canales que el cliente {clientName} dispuso para tal fin** y enviando el comprobante de pago con carácter de urgencia.
                </p>
            </div>

            <div style={footerStyle}>
                <p style={{ margin: '0 0 8px 0' }}>
                    © {new Date().getFullYear()} AvalIA B2B. Todos los derechos reservados.
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#94A3B8' }}>
                    Si tienes dudas o deseas enviar tu soporte de pago, contáctanos a <a href="mailto:comercial@avaliab2b.com" style={{ color: '#2563EB', textDecoration: 'none' }}>comercial@avaliab2b.com</a> o vía WhatsApp al <a href="https://wa.me/573015965775" style={{ color: '#2563EB', textDecoration: 'none' }}>+57 3015965775</a>.
                </p>
                <p style={{ margin: '0', fontSize: '11px', color: '#7F1D1D', fontWeight: 'bold' }}>
                    AVISO LEGAL FORMAL DE COBRO COACTIVO.
                </p>
            </div>
        </div>
    );
};

export default Mora30Email;
