import * as path from 'path';
import { DotenvConfigOutput } from 'dotenv';
import dotenv, { DotenvSafeOptions } from 'dotenv-safe';
import { IAppConfig } from './app/interface/config';

enum ENV {
    API_PATH = 'API_PATH',
    APP_URL = 'APP_URL',
    POSTGRES_SQL_DBNAME = 'POSTGRES_SQL_DBNAME',
    POSTGRES_SQL_HOST = 'POSTGRES_SQL_HOST',
    POSTGRES_SQL_PASSWORD = 'POSTGRES_SQL_PASSWORD',
    POSTGRES_SQL_PORT = 'POSTGRES_SQL_PORT',
    POSTGRES_SQL_USERNAME = 'POSTGRES_SQL_USERNAME',
    SERVER_PORT = 'SERVER_PORT',
    NODE_ENV = 'NODE_ENV'
}

const dotEnvOptions: DotenvSafeOptions = {
    encoding: 'utf-8',
    example: path.resolve(__dirname, '.env.example'),
    path: path.resolve(__dirname, '.env')
};

const result: DotenvConfigOutput = dotenv.config(dotEnvOptions);

if (result.error) {
    console.warn('[config] local ENV config not available.');
}

export const getConfig = (): IAppConfig => {
    return {
        api: process.env[ENV.API_PATH] || 'api',
        app: process.env[ENV.APP_URL] || 'http://locahost:3000',
        environment: process.env[ENV.NODE_ENV] || 'development',
        postgresSQL: {
            dbName: process.env[ENV.POSTGRES_SQL_DBNAME] || 'ticket-selling',
            port: Number(process.env[ENV.POSTGRES_SQL_PORT]) || 5432,
            host: process.env[ENV.POSTGRES_SQL_HOST] || 'localhost',
            username: process.env[ENV.POSTGRES_SQL_USERNAME] || 'postgres',
            password: process.env[ENV.POSTGRES_SQL_PASSWORD] || ''
        },
        serverPort: Number(process.env[ENV.SERVER_PORT]) || 3000
    };
};

const serverConfig: IAppConfig = getConfig();

export const config: IAppConfig = serverConfig;

export const features = Object.freeze({
    reports: false
});
