export class Clients {
    private clients: {[key: string]: WebSocket};
    private counter: number;

    constructor() {
        this.clients = {};
        this.counter = 0;
    }

    addClient(socket): number {
        const id = this.counter++;
        this.clients[id] = socket;
        return id;
    }

    removeClient(id: number) {
        delete this.clients[id];
    }

    notify(update) {
        Object.values(this.clients).forEach(client => client.send(JSON.stringify(update)));
    }
}