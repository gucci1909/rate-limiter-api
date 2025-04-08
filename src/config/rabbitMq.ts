import dotenv from "dotenv";
import amqp from 'amqplib';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

let channel: amqp.Channel;

const connectRabbitMq = async () => {
    if (channel) {
        console.log('RabbitMQ channel already initialized');
        return;
    }
    
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('Connected to RabbitMQ');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ', error);
        throw error;
    }
};

const getChannel = (): amqp.Channel => {
    if (!channel) {
        throw new Error('RabbitMQ channel is not initialized. Call connectRabbitMq first.');
    }
    return channel;
};

export {connectRabbitMq , getChannel};