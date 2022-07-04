import { FastifyRequest } from 'fastify';
import { FastifyReply } from 'fastify';
import { FastifyInstance } from 'fastify';
import { config } from '../../config';
import { ValidationErrorsEnum } from '../enum/validation-errors.enum';
import { ICreatePayment } from '../interface/payment';
import { ICreateReservation, ICreateReservationResponse, IGetReservationsListResponse, IReservation } from '../interface/reservation';
import { PaymentService } from '../service/payment.service';
import { ReservationService } from '../service/reservation.service';
import { TicketStockService } from '../service/ticket-stock.service';
import { TicketService } from '../service/ticket.service';

export class ReservationRoutes {
    server: FastifyInstance;
    reservationService: ReservationService;
    paymentService: PaymentService;
    ticketService: TicketService;
    ticketStockService: TicketStockService;

    constructor(fastify: FastifyInstance) {
        this.server = fastify;
        this.reservationService = new ReservationService(this.server);
        this.paymentService = new PaymentService(this.server);
        this.ticketService = new TicketService(this.server);
        this.ticketStockService = new TicketStockService(this.server);
    }

    public initEndpoints(): void {
        this.server.register((fastify: FastifyInstance, opts: any, done: any) => {
            fastify.post<{
                Body: ICreateReservation,
                Reply: boolean
            }>('/', async (request: FastifyRequest, reply: FastifyReply): Promise<any> => {
                const newReservation: ICreateReservation = request.body as ICreateReservation;

                let reservationResponse: ICreateReservationResponse;

                try {
                    reservationResponse = await this.reservationService.createReservation(newReservation);
                } catch (err: any) {
                    throw new Error(err);
                }

                try {
                    await this.ticketService.descreaseStockCount(reservationResponse.ticket_id, newReservation.ticket_stock_ids.length);
                } catch (err: any) {
                    throw new Error(err);
                }

                try {
                    await this.ticketStockService.updateTicketStockStatus(newReservation.ticket_stock_ids);
                } catch (err: any) {
                    throw new Error(err);
                }

                let paymentURL: string;

                try {
                    const newPayment: ICreatePayment = {
                        reservation_id: reservationResponse.reservation_id,
                        user_id: newReservation.user_id,
                        amount: reservationResponse.total_price
                    };

                    paymentURL = await this.paymentService.createPayment(newPayment);
                } catch (err: any) {
                    throw new Error(err);
                }

                return paymentURL;
            });

            fastify.get('/', async (request: FastifyRequest, reply: FastifyReply): Promise<any> => {
                let reservationResponse: IGetReservationsListResponse[];
                const { page, limit } = request.query as any;

                try {
                    reservationResponse = await this.reservationService.getReservations(page, limit);
                } catch (err: any) {
                    throw new Error(err);
                }

                return reservationResponse;
            });

            done();
        }, { prefix: `${config.api}/reservations` });
    }
}