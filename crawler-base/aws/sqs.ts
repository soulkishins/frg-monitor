import { SQSClient, SendMessageCommand, SendMessageCommandInput } from "@aws-sdk/client-sqs";

interface MessagePayload {
    messageBody: string;
    messageAttributes?: Record<string, any>;
    delaySeconds?: number;
}

export class SQSService {
    private sqsClient: SQSClient;
    private queueUrl: string;

    constructor(region: string, queueUrl: string) {
        this.sqsClient = new SQSClient({ 
            region: region
        });
        this.queueUrl = queueUrl;
    }

    async sendMessage(payload: MessagePayload): Promise<string> {
        try {
            const params: SendMessageCommandInput = {
                QueueUrl: this.queueUrl,
                MessageBody: payload.messageBody,
                DelaySeconds: payload.delaySeconds || 0
            };

            // Add message attributes if they exist
            if (payload.messageAttributes) {
                params.MessageAttributes = Object.entries(payload.messageAttributes).reduce((acc: Record<string, any>, [key, value]) => {
                    acc[key] = {
                        DataType: typeof value === 'number' ? 'Number' : 'String',
                        StringValue: value.toString()
                    };
                    return acc;
                }, {});
            }

            const command = new SendMessageCommand(params);
            const response = await this.sqsClient.send(command);
            
            console.log('Message sent successfully:', response.MessageId);
            return response.MessageId!;
        } catch (error) {
            console.log('Error sending message to SQS:', error);
            throw error;
        }
    }
}

// Usage example:
async function example() {
    const sqsService = new SQSService(
        'us-east-1', // your AWS region
        'https://sqs.us-east-1.amazonaws.com/your-account-id/your-queue-name' // your queue URL
    );

    try {
        const messageId = await sqsService.sendMessage({
            messageBody: JSON.stringify({
                orderId: '12345',
                status: 'PENDING',
                timestamp: new Date().toISOString()
            }),
            messageAttributes: {
                processType: 'ORDER_PROCESSING',
                priority: '1'
            },
            delaySeconds: 0
        });

        console.log('Message sent with ID:', messageId);
    } catch (error) {
        console.log('Failed to send message:', error);
    }
}
