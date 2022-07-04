import { FastifyInstance } from "fastify";
import { DBNamesEnum } from "../enum/db-names.enum";
import { ReservationStatusesEnum } from "../enum/reservation-statuses.enum";
import { TicketTypesEnum } from "../enum/ticket-types.enum";
import { ValidationErrorsEnum } from "../enum/validation-errors.enum";
import { ICreateReservation, ICreateReservationResponse, IGetReservationsListResponse, IReservation } from "../interface/reservation";
import { CommonUtil } from "../util/common.util";

export class ReservationService {
    server: FastifyInstance;

    constructor(fastify: FastifyInstance) {
        this.server = fastify;
    }

    public async createReservation(reservation: ICreateReservation): Promise<ICreateReservationResponse> {
        try {
            let date: Date = new Date();
            let deadline: Date = new Date();
            deadline.setMinutes(deadline.getMinutes() + 15);
            let variables: string = '';

            reservation.ticket_stock_ids.forEach((el: number, index: number) => {
                if (index > 0) {
                    variables += `, `;
                }

                variables += `$${index + 1}`;
            });

            let ticketsRows: {rows: {ticket_id: number, type: TicketTypesEnum, row: number, seat: number, stock: number, price: number}[]} = await (this.server as any).pg.query(
                `SELECT tickets.id AS ticket_id, type, row, seat, stock, price FROM ticket_stocks LEFT JOIN tickets ON tickets.id = ticket_stocks.ticket_id WHERE ticket_stocks.id IN (${variables})`, [...reservation.ticket_stock_ids]
            );

            if (ticketsRows?.rows?.length === undefined || ticketsRows?.rows?.length === 0) {
                return Promise.reject(ValidationErrorsEnum.UnableToCreateReservation);
            }

            switch (ticketsRows.rows[0].type) {
                case TicketTypesEnum.Even:
                    if (CommonUtil.isEvenNumber(ticketsRows.rows.length) === false) {
                        return Promise.reject(ValidationErrorsEnum.OnlyEvenQuantity);
                    }

                    break;
                case TicketTypesEnum.AllTogether:
                    if (CommonUtil.isSeatAllTogether(ticketsRows.rows) === false) {
                        return Promise.reject(ValidationErrorsEnum.OnlyAllTogether);
                    }

                    break;
                case TicketTypesEnum.AvoidOne:
                    if (ticketsRows.rows[0].stock - ticketsRows.rows.length <= 1) {
                        return Promise.reject(ValidationErrorsEnum.AvoidOne);
                    }
                    
                    break;
            }

            let reservationIdRows: {rows: {id: number}[]} = await (this.server as any).pg.query(
                `INSERT INTO ${DBNamesEnum.Reservations} (ticket_stock_ids, date, user_id, status, deadline) VALUES($1, $2 ,$3, $4, $5) RETURNING id`, [reservation.ticket_stock_ids, date.toISOString(), reservation.user_id, ReservationStatusesEnum.Pending, deadline.toISOString()],
            )

            const sumPrices = (prev: {price: number}, curr: {price: number}): {price: number} => {
                return {price: prev.price + curr.price};
            }

            let response: ICreateReservationResponse = {
                reservation_id: reservationIdRows.rows[0].id,
                ticket_id: ticketsRows.rows[0].ticket_id,
                total_price: (ticketsRows.rows as {price: number}[]).reduce(sumPrices).price
            };

            return Promise.resolve(response);
        } catch (err) {
            console.error(`[ReservationService.createNewReservation]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async completeReservation(id: number): Promise<number[]> {
        try {
            let ticketStockIdsRows: {rows: {ticket_stock_ids: number[]}[]} = await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.Reservations} SET status = ${ReservationStatusesEnum.Completed} WHERE id=$1 RETURNING ticket_stock_ids`, [id],
            );

            return Promise.resolve(ticketStockIdsRows.rows[0].ticket_stock_ids);
        } catch (err) {
            console.error(`[ReservationService.completeReservation]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async cancelReservation(id: number): Promise<number[]> {
        try {
            let ticketStockIdsRows: {rows: {ticket_stock_ids: number[]}[]} = await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.Reservations} SET status = ${ReservationStatusesEnum.Cancelled} WHERE id=$1 RETURNING ticket_stock_ids`, [id],
            );

            return Promise.resolve(ticketStockIdsRows.rows[0].ticket_stock_ids);
        } catch (err) {
            console.error(`[ReservationService.cancelReservation]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async setExpireStatus(id: number): Promise<number[]> {
        try {
            let ticketStockIdsRows: {rows: {ticket_stock_ids: number[]}[]} = await (this.server as any).pg.query(
                `UPDATE ${DBNamesEnum.Reservations} SET status = ${ReservationStatusesEnum.Expired} WHERE id=$1 RETURNING ticket_stock_ids`, [id],
            );

            return Promise.resolve(ticketStockIdsRows.rows[0].ticket_stock_ids);
        } catch (err) {
            console.error(`[ReservationService.setExpireStatus]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async getReservations(page: number, limit: number): Promise<IGetReservationsListResponse[]> {
        try {
            let offset: number = page * limit;

            let reservationsRows: {rows: IGetReservationsListResponse[]} = await (this.server as any).pg.query(
                `SELECT ${DBNamesEnum.Reservations}.id, COUNT(ticket_stock_ids) as ticket_quantity, ${DBNamesEnum.Reservations}.status, SUM(${DBNamesEnum.TicketStocks}.price) as cost, ${DBNamesEnum.Tickets}.name as event FROM ${DBNamesEnum.Reservations} INNER JOIN ${DBNamesEnum.TicketStocks} ON ${DBNamesEnum.TicketStocks}.id = ANY(${DBNamesEnum.Reservations}.ticket_stock_ids) INNER JOIN ${DBNamesEnum.Tickets} ON ${DBNamesEnum.Tickets}.id = ${DBNamesEnum.TicketStocks}.ticket_id GROUP BY ${DBNamesEnum.Reservations}.id, event LIMIT $1 OFFSET $2`, [limit, offset],
            );

            return Promise.resolve(reservationsRows.rows);
        } catch (err) {
            console.error(`[ReservationService.getReservations]: ${err}`);

            return Promise.reject(err);
        }
    }

    public async getReservationStatusByPaymentId(paymentId: number): Promise<any> {
        try {

            let statusRows: {rows: {id: number, status: number, deadline: string}[]} = await (this.server as any).pg.query(
                `SELECT ${DBNamesEnum.Reservations}.id as id, ${DBNamesEnum.Reservations}.status as status, ${DBNamesEnum.Reservations}.deadline as deadline FROM reservations INNER JOIN ${DBNamesEnum.Payments} ON ${DBNamesEnum.Payments}.reservation_id = ${DBNamesEnum.Reservations}.id WHERE ${DBNamesEnum.Payments}.id = $1`, [paymentId],
            );

            return Promise.resolve(statusRows.rows);
        } catch (err) {
            console.error(`[ReservationService.getReservations]: ${err}`);

            return Promise.reject(err);
        }
    }
}