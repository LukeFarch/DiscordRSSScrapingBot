# MSURSSBot
This bot serves the MSU Study Room server. It scrapes the RSS feed of the bleeping computer and posts the articles every 24 hours. This is integrated with AWS Lambda but can be changed depending on what you use. 

# AWS
It uses Event Bridge to trigger every 24 hours with an empty json payload {}
Communicating through an API gateway that AWS provides. Using a one-bucket solution, it reads before posting to ensure no duplicate articles are posted. 


# THINGS TO CHANGE 
You will need to change the channel ID and bucket names for your implementation. Please upload this code to Lambda to test or locally with POSTMAN. Ensure the environmental variables are correctly set as well.

  1. "https://discord.com/api/v10/channels/XXXXXXXXXXXXXXXX/messages"~~~~Change this to your channel ID!

  2. "const PUBLIC_KEY = process.env.PUBLIC_KEY;"~~~~Get your public key from discord and set it in AWS  Lambda

  3. "const DISCORD_TOKEN = process.env.DISCORD_TOKEN;"~~~~Get your private key and set it in AWS Lambda
