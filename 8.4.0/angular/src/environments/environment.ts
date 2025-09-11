// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
    production: false,
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
    appConfig: 'appconfig.json', // Add this line
    hmr: false, // Add this line for Hot Module Replacement
};
