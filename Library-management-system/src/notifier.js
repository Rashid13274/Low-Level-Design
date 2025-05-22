class Notifier {
    constructor() {
        this.subscribers = new Map();
    }

    subscribe(userId, callback) {
        this.subscribers.set(userId, callback);
    }

    notify(userId, message) {
        const callback = this.subscribers.get(userId);
        if (callback) callback(message);
    }
}

module.exports = Notifier;