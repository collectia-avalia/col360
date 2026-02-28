import React from 'react';

interface InvoiceEmailProps {
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    payerName: string; // Opcional, si lo tenemos
    message?: string;
}

export const InvoiceEmail: React.FC<InvoiceEmailProps> = ({
    invoiceNumber,
    amount,
    dueDate,
    payerName,
    message,
}) => {
    const containerStyle = {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
    };

    const headerStyle = {
        backgroundColor: '#4F46E5', // Indigo-600
        color: '#ffffff',
        padding: '20px',
        textAlign: 'center' as const,
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
    };

    const bodyStyle = {
        padding: '20px',
        color: '#333333',
        lineHeight: '1.6',
    };

    const detailBoxStyle = {
        backgroundColor: '#f9fafb',
        padding: '15px',
        borderRadius: '4px',
        marginTop: '20px',
        marginBottom: '20px',
    };

    const labelStyle = {
        fontWeight: 'bold',
        color: '#6b7280',
        display: 'block',
        marginBottom: '4px',
    };

    const valueStyle = {
        fontSize: '16px',
        marginBottom: '12px',
        display: 'block',
    };

    const footerStyle = {
        marginTop: '30px',
        textAlign: 'center' as const,
        fontSize: '12px',
        color: '#9ca3af',
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>Avalia SaaS</h1>
                <p style={{ margin: '5px 0 0', fontSize: '14px', opacity: 0.9 }}>Notificación de Factura</p>
            </div>

            <div style={bodyStyle}>
                <p>Hola <strong>{payerName || 'Cliente'}</strong>,</p>

                <p>Se ha generado una nueva factura en el sistema que requiere su atención.</p>

                {message && (
                    <div style={{ backgroundColor: '#fff8e1', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #fbbf24', marginBottom: '20px' }}>
                        <strong>Mensaje:</strong> {message}
                    </div>
                )}

                <div style={detailBoxStyle}>
                    <span style={labelStyle}>Número de Factura:</span>
                    <span style={valueStyle}>{invoiceNumber}</span>

                    <span style={labelStyle}>Monto Total:</span>
                    <span style={valueStyle}>{amount}</span>

                    <span style={labelStyle}>Fecha de Vencimiento:</span>
                    <span style={{ ...valueStyle, marginBottom: 0 }}>{dueDate}</span>
                </div>

                <p>Por favor, ingrese a la plataforma para revisar los detalles y proceder con el pago u otras gestiones.</p>

                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <a
                        href="https://avaliab2b.com/dashboard/invoices"
                        style={{
                            display: 'inline-block',
                            padding: '12px 24px',
                            backgroundColor: '#4F46E5',
                            color: '#ffffff',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                        }}
                    >
                        Ver Factura
                    </a>
                </div>
            </div>

            <div style={footerStyle}>
                <p>© {new Date().getFullYear()} Avalia SaaS. Todos los derechos reservados.</p>
                <p>Si tiene preguntas, responda a este correo.</p>
            </div>
        </div>
    );
};

export default InvoiceEmail;
