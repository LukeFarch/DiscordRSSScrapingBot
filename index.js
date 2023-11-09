const axios = require('axios');
const feedparser = require('feedparser-promised');
const AWS = require('aws-sdk');
const nacl = require('tweetnacl'); // Required for Discord verification

// Set up AWS S3
AWS.config.update({ region: 'us-east-2' }); // Update the region if necessary
const s3 = new AWS.S3();

// Your Discord application's public key and bot token. This is setup in AWS but change it for yours
const PUBLIC_KEY = process.env.PUBLIC_KEY; // Ensure this is set in your environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN; // Ensure this is set in your environment variables

// Function to verify Discord request using tweetnacl
async function verifyDiscordRequest(body, signature, timestamp) {
    // Verifying Discord signature
    return nacl.sign.detached.verify(
        Buffer.from(timestamp + body),
        Buffer.from(signature, 'hex'),
        Buffer.from(PUBLIC_KEY, 'hex')
    );
}

// Function to handle EventBridge trigger
async function handleEventBridgeTrigger() {
    let postedArticles = new Set();

    // Fetch posted articles from S3 bucket
    try {
        const data = await s3.getObject({
            Bucket: 'song-output', // Replace with your S3 bucket name if youre using AWS like me
            Key: 'postedarticles.txt'
        }).promise();

        postedArticles = new Set(data.Body.toString().split('\n'));
    } catch (error) {
        console.error("Error fetching posted articles:", error.message);
        // If it's the first run, the file might not exist yet
    }

    // Fetch the RSS feed
    const feed = await feedparser.parse('https://www.bleepingcomputer.com/feed/');
    for (const entry of feed) {
        if (!postedArticles.has(entry.link)) {
            postedArticles.add(entry.link);

            // Post new article to Discord
            try {
                await axios.post(`https://discord.com/api/v10/channels/1158926484707213395/messages`, { // replace with your channel ID
                    content: `New Article: ${entry.title}\nLink: ${entry.link}`
                }, {
                    headers: {
                        'Authorization': `Bot ${DISCORD_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error("Error posting message to Discord:", error.message);
            }
        }
    }

    // Update the list of posted articles in the S3 bucket
    try {
        await s3.putObject({
            Bucket: 'song-output', // S3 bucket name
            Key: 'postedarticles.txt',
            Body: Array.from(postedArticles).join('\n'),
            ContentType: 'text/plain'
        }).promise();
    } catch (error) {
        console.error("Error updating posted articles in S3:", error.message);
    }
}

// Lambda handler function
exports.handler = async function (event, context) {
    // If headers are present, assume this is a Discord verification request
    if (event.headers) {
        const timestamp = event.headers['x-signature-timestamp'];
        const signature = event.headers['x-signature-ed25519'];
        const body = event.body; // Assuming body is a raw string from Discord

        // Verify the signature
        const isVerified = await verifyDiscordRequest(body, signature, timestamp);
        if (!isVerified) {
            return {
                statusCode: 401,
                body: JSON.stringify('invalid request signature')
            };
        }

        // Parse the request body
        const parsedBody = JSON.parse(body);

        // Handle PING from Discord
        if (parsedBody.type === 1) {
            return {
                statusCode: 200,
                body: JSON.stringify({ type: 1 })
            };
        }

        // Fallback for unhandled Discord request types
        return {
            statusCode: 400,
            body: JSON.stringify('unhandled request type')
        };
    } else {
        // No headers present, assume it's an EventBridge trigger (AWS)
        await handleEventBridgeTrigger();
        return {
            statusCode: 200,
            body: JSON.stringify('EventBridge trigger handled successfully')
        };
    }
};
