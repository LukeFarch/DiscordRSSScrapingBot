# MSURSSBot
This bot serves the MSU Study Room server. It scrapes the RSS feed of the bleeping computer and posts the articles every 24 hours. This is integrated with AWS Lambda but can be changed depending on what you use. 

# AWS
It uses Event Bridge to trigger every 24 hours with an empty json payload {}
