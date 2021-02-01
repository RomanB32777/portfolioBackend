import App from './app'
import config from 'config'

const application: Promise<any> = new App({
    port: config.get('port'),
    mongoUri: config.get('mongoUri')
}).run()

if (!application) {
    console.log('good bye! ');
    process.exit(1)
}