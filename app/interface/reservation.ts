import { ReservationStatusesEnum } from "../enum/reservation-statuses.enum";

export interface IReservation {
    id: number;
    ticket_stock_ids: number[];
    date: Date;
    user_id: number;
    status: ReservationStatusesEnum;
    deadline: Date;
}

export interface ICreateReservation {
    ticket_stock_ids: number[];
    user_id: number;
}

export interface ICreateReservationResponse {
    reservation_id: number;
    ticket_id: number;
    total_price: number;
}

export interface IGetReservationsListResponse {
    id: number;
    ticket_quantity: number;
    cost: number;
    status: string;
    event: string;
}