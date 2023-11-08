# MSURSSBot
This bot serves the MSU Study Room server. It scrapes the RSS feed of bleeping computer and posts the articles every 24 hours. This is integrated with AWS Lambda. 

########
It uses Event Bridge to trigger every 24 hours with an empty json payload {}