import fastify, { FastifyInstance } from 'fastify';
import { FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { IncomingMessage } from 'http';
import { config } from '../config';
import { StatusCodesEnum } from './enum/status-codes.enum';
import { PaymentRoutes } from './route/payment.route';
import { ReservationRoutes } from './route/reservation.route';
import { DatabaseService } from './service/database.service';

export class Server {
  private databaseService: DatabaseService;
  private server: FastifyInstance;

  constructor() {
    this.server = fastify();
    this.databaseService = new DatabaseService(this.server);
  }

  private initAPI(): void {
    const reservationRoutes: ReservationRoutes = new ReservationRoutes(this.server);
    const paymentRoutes: PaymentRoutes = new PaymentRoutes(this.server);

    reservationRoutes.initEndpoints();
    paymentRoutes.initEndpoints();
  }

  private async createServer(): Promise<void> {
    const defaultRoute = (req: IncomingMessage, res: ServerResponse): any => {
      res.writeHead(StatusCodesEnum.NotFound);
      res.end();
    }
    
    this.server.setDefaultRoute(defaultRoute);
  
    await this.server.listen({ port: config.serverPort }, (err, address) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      console.log(`Server listening at ${address}`)
    });
  }

  private async initalizeServer(): Promise<void> {
    await this.databaseService.initDB(config.postgresSQL);
    await this.databaseService.updateDB();
    this.initAPI();
    await this.createServer();
  }

  private onErrorInitialisingServer(err: Error): void {
    console.error('[Server.onErrorInitialisingServer]', err);

    process.exit(1);
  }

  private onProcessWarning(e: any): void {
    console.warn(e.stack);
  }

  public init(): Promise<any> {
    process.on('warning', this.onProcessWarning.bind(this));

    return this.initalizeServer().catch(this.onErrorInitialisingServer.bind(this));
  }
}
