class AsyncQueue {
  private queue: any[];
  private isProcessing: boolean;
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(task: any) {
    this.queue.push(task);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue[0];

      try {
        await task();
      } catch (error) {
        console.error('An error occurred while executing the task:', error);
      }

      this.queue.shift();
    }

    this.isProcessing = false;
  }
}

export default AsyncQueue;
