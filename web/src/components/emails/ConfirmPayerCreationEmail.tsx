import React from 'react';

interface ConfirmPayerCreationEmailProps {
    payerName: string;
    payerEmail: string;
    userName: string; // Email del usuario que creó el pagador
}

export const ConfirmPayerCreationEmail: React.FC<ConfirmPayerCreationEmailProps> = ({
    payerName,
    payerEmail,
    userName,
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
        backgroundColor: '#059669', // Emerald-600 (Color de éxito)
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
        backgroundColor: '#f0fdf4', // Emerald-50
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #bbf7d0', // Emerald-200
        marginTop: '20px',
        marginBottom: '20px',
    };

    const footerStyle = {
        marginTop: '30px',
        textAlign: 'center' as const,
        fontSize: '12px',
        color: '#9ca3af',
        borderTop: '1px solid #eee',
        paddingTop: '20px',
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>Pagador Registrado</h1>
                <p style={{ margin: '5px 0 0', fontSize: '14px', opacity: 0.9 }}>Confirmación de Registro en Avalia SaaS</p>
            </div>

            <div style={bodyStyle}>
                <p>Hola,</p>

                <p>Te confirmamos que has registrado exitosamente un nuevo pagador en la plataforma.</p>
                <p>Hemos enviado una invitación a la empresa para que complete su registro y acceda al portal de pagos.</p>

                <div style={detailBoxStyle}>
                    <p style={{ margin: '0 0 10px 0' }}><strong>Empresa Registrada:</strong></p>
                    <p style={{ fontSize: '18px', margin: '0 0 5px 0', color: '#047857' }}>{payerName}</p>
                    <p style={{ margin: '0', color: '#555' }}>Correo de Contacto: {payerEmail}</p>
                </div>

                <p>
                    Podrás ver el estado de este pagador y gestionar sus facturas desde tu panel de control.
                </p>

                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <a
                        href="https://avaliab2b.com/dashboard/payers"
                        style={{
                            display: 'inline-block',
                            padding: '12px 24px',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                        }}
                    >
                        Ver Pagadores
                    </a>
                </div>
            </div>

            <div style={footerStyle}>
                <p>© {new Date().getFullYear()} Avalia SaaS. Todos los derechos reservados.</p>
                <p>Este es un correo informativo.</p>
            </div>
        </div>
    );
};

export default ConfirmPayerCreationEmail;
