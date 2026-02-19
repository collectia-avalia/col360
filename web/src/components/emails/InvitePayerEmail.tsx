import React from 'react';

interface InvitePayerEmailProps {
    razonSocial: string;
    inviterEmail: string;
    inviteLink: string;
}

export const InvitePayerEmail: React.FC<InvitePayerEmailProps> = ({
    razonSocial,
    inviterEmail,
    inviteLink,
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
        backgroundColor: '#7c3aed', // Violet-600 (Avalia Brand Color?)
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

    const buttonStyle = {
        display: 'inline-block',
        padding: '12px 24px',
        backgroundColor: '#7c3aed',
        color: '#ffffff',
        textDecoration: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
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
                <h1 style={{ margin: 0, fontSize: '24px' }}>Bienvenido a Avalia</h1>
                <p style={{ margin: '5px 0 0', fontSize: '14px', opacity: 0.9 }}>Invitación al Portal de Pagos</p>
            </div>

            <div style={bodyStyle}>
                <p>Hola <strong>{razonSocial}</strong>,</p>

                <p><strong>{inviterEmail}</strong> te ha invitado a gestionar tus facturas y cupos en nuestra plataforma Avalia SaaS.</p>

                <p>Para completar tu registro, configurar tu cuenta y acceder al portal, por favor haz clic en el siguiente botón:</p>

                <div style={{ textAlign: 'center' }}>
                    <a href={inviteLink} style={buttonStyle}>
                        Aceptar Invitación
                    </a>
                </div>

                <p style={{ fontSize: '14px', color: '#666' }}>
                    Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                    <br />
                    <a href={inviteLink} style={{ color: '#7c3aed' }}>{inviteLink}</a>
                </p>

                <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
                    Si no esperabas este correo o crees que es un error, puedes ignorarlo.
                </p>
            </div>

            <div style={footerStyle}>
                <p>© {new Date().getFullYear()} Avalia SaaS. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no respondas a esta dirección.</p>
            </div>
        </div>
    );
};

export default InvitePayerEmail;
