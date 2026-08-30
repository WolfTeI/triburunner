/**
 * Configuración de entorno y credenciales de Firebase para TribuRunner Web.
 * Conectado al proyecto oficial 'tribu-runner'.
 */
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyB-xFC5Sge3gTNC-uU9Tr2VR25nRrmT6wA',
    authDomain: 'tribu-runner.firebaseapp.com',
    projectId: 'tribu-runner',
    storageBucket: 'tribu-runner.firebasestorage.app',
    messagingSenderId: '167835947827',
    appId: '1:167835947827:web:triburunnerweb001',
  },
  // Correos de Fundadores autorizados con acceso irrestricto Root
  founderEmails: [
    'carlosaprost@gmail.com',
    'wolftei.games@gmail.com',
    'admin@triburunner.com',
    'founder@triburunner.com',
  ],
};
