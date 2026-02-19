import React from 'react';

interface WelcomeClientEmailProps {
    companyName: string;
    email: string;
    loginUrl: string;
    password?: string; // Opcional, solo si decidimos enviarla (inseguro pero práctico en fases tempranas)
}

export const WelcomeClientEmail: React.FC<WelcomeClientEmailProps> = ({
    companyName,
    email,
    loginUrl,
    password,
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
        backgroundColor: '#1E293B', // Slate-800
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
        backgroundColor: '#1E293B',
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
                <h1 style={{ margin: 0, fontSize: '24px' }}>Avalia SaaS</h1>
                <p style={{ margin: '5px 0 0', fontSize: '14px', opacity: 0.9 }}>Bienvenido a la Plataforma</p>
            </div>

            <div style={bodyStyle}>
                <p>Hola <strong>{companyName}</strong>,</p>

                <p>Tu cuenta corporativa en Avalia SaaS ha sido creada exitosamente.</p>

                <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 10px 0' }}><strong>Tus credenciales de acceso:</strong></p>
                    <p style={{ margin: '0 0 5px 0' }}>Usuario: <strong>{email}</strong></p>
                    {password && (
                        <p style={{ margin: '0' }}>Contraseña: <strong>{password}</strong></p>
                    )}
                </div>

                <p>Para ingresar al portal, haz clic en el siguiente botón:</p>

                <div style={{ textAlign: 'center' }}>
                    <a href={loginUrl} style={buttonStyle}>
                        Iniciar Sesión
                    </a>
                </div>

                <p style={{ fontSize: '14px', color: '#666' }}>
                    Te recomendamos cambiar tu contraseña al ingresar por primera vez.
                </p>
            </div>

            <div style={footerStyle}>
                <p>© {new Date().getFullYear()} Avalia SaaS. Todos los derechos reservados.</p>
                <p>Este es un correo automático de bienvenida.</p>
            </div>
        </div>
    );
};

export default WelcomeClientEmail;
