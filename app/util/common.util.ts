export class CommonUtil {
    public static isEvenNumber(n: number): boolean {
        return n % 2 === 0;
    }

    public static isSeatAllTogether(tickets: {row: number, seat: number}[]): boolean {
        const sortTickets = ((a: {row: number, seat: number}, b: {row: number, seat: number}): number => {
            if (a.row > b.row) {
                return -1;
            } else if (a.row < b.row) {
                return -1;
            } else if (a.seat > b.seat) {
                return -1;
            } else if (a.seat < b.seat) {
                return 1;
            }

            return 0;
        });

        tickets.sort(sortTickets);

        let isAllTogether: boolean = true;

        tickets.forEach((ticket: {row: number, seat: number}, index: number) => {
            if (index > 0) {
                if (Math.abs(ticket.row - tickets[index - 1].row) > 1) {
                    isAllTogether = false;
                } else if (Math.abs(ticket.seat - tickets[index - 1].seat) > 1) {
                    isAllTogether = false;
                }
            }
        });

        return isAllTogether;
    }
}