import { getChannel } from "../config/rabbitMq.js";
import { queueRateLimitEvent, slidingWindow } from "./slidingWindowCounter.js";

// this is a worker, which will handle the queued requests from the rate-limit-queue. when the request is queued, it will be
// processed by this worker. the worker will check if the request is allowed or not. if the request is allowed, it will ack the 
// message. if the request is not allowed, it will requeue the message after a certain time. */


const startWorker = async () => {
  const channel = getChannel();
  await channel.assertQueue("rate-limit-queue");

  channel.consume("rate-limit-queue", async (msg) => {
    if (!msg) return;

    try {
      const { payload, requestId } = JSON.parse(msg.content.toString());

      const result = await slidingWindow(payload);

      if (result.allowed) {
        channel.ack(msg);
        console.log(`✅ Request for requestId ${requestId} is now allowed.`);
      } else {
        const retryAfter = Math.ceil(result.retryAfter || 1);
        console.log(`⏳ Requeuing requestId ${requestId} after ${retryAfter}s...`);

        // You may requeue here if needed
        // setTimeout(() => {
        //   queueRateLimitEvent(payload);
        // }, retryAfter * 1000);

        channel.ack(msg);
      }
    } catch (err) {
      console.error("❌ Worker error:", err);
      channel.nack(msg, false, false); 
    }
  }, { noAck: false });
};

export { startWorker };
