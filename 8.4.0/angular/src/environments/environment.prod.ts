// "Production" enabled environment

export const environment = {
    production: true,
    application: {
        baseUrl: 'http://localhost:4200',
        name: 'AttendanceModule',
    },
    oAuthConfig: {
        issuer: 'https://localhost:44311/',
        clientId: 'AttendanceModule_App',
        dummyClientSecret: '1q2w3e*',
        scope: 'offline_access AttendanceModule',
    },
    apis: {
        default: {
            url: 'https://localhost:44311',
        },
    },
    // Add these missing properties:
    appConfig: 'appconfig.production.json', // Add this line
    hmr: false, // Add this line
};
