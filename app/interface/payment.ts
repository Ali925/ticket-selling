import { PaymentStatusesEnum } from "../enum/payment-statuses.enum";

export interface IPayment {
    id: number;
    reservation_id: number;
    user_id: number;
    amount: number;
    status: PaymentStatusesEnum;
    date: Date;
}

export interface ICreatePayment {
    reservation_id: number;
    user_id: number;
    amount: number;
}