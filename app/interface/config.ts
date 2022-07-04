export interface IDBConfig {
    dbName: string;
    port: number;
    host: string;
    username: string;
    password: string;
}

export interface IAppConfig {
    api: string;
    app: string;
    environment: string;
    postgresSQL: IDBConfig;
    serverPort: number;
}