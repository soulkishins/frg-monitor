import { handler } from './main';

process.env.APP_REGION = 'sa-east-1';
process.env.DB_SCHEMA = 'pricemonitor';
process.env.RDS_SECRET_NAME = 'prod/db/pricemonitor';
process.env.S3_BUCKET_NAME = 'frg-price-monitor-data';
process.env.TZ = 'America/Sao_Paulo';

handler({
  "Records": [
      {
          "messageId": "66aa294c-da64-4f6e-b75f-2c889d5da783",
          "receiptHandle": "AQEBA3XWmkCReO0JeqNZzdZtInl0NeYk09tlxu6q+k2r6BHfzF3s+bj3u2pdm0IWaEJoDWCi/CrO7YRXQZrD7xdPPIsaP4GY25+YgKx97QyiNPel1SXc2Ky9FKnLhx2hArJUfGYySP4wWS8XfHN6XmLhDzjkhWm1rbSpagJuCAPesg5E9RUcDhWX13dSEzh7ORG8PYbeAxvngUJPdUMnKwzUXLLaKqGYAZR73w8d+WkWhygiem8BfOLPw8tiyYuhdX4G7gXPe4bgGiTO37tutixHKPth+EEiYd+o99IRAMLsGBEGGqXaUkadPXWFJ9ONUGHxIN189tYuoJX8/cstNwOG4qX+XjfIBpzT+raSdjDByU0kHIjZhE3NGJlwjj1BKuaa2IptoTLxMCY3B0Sga8ylPw==",
          "body": "{\"key\":\"export_08_03_2025_tuzczi8vcu.xlsx\",\"ids\":[\"00b07b60-659e-4b6a-a3bb-d9e5ea25abf0\"],\"user\":\"137cbaaa-60f1-703a-740c-20243cca92f7\"}",
          "attributes": {
              "ApproximateReceiveCount": "1",
              "AWSTraceHeader": "Root=1-67ccab70-4fddf44023df0a7e2e4a4fd4",
              "SentTimestamp": "1741466480146",
              "SenderId": "AROAUL235DKMU6ZENJ5TZ:BackplaneAssumeRoleSession",
              "ApproximateFirstReceiveTimestamp": "1741466480149"
          },
          "messageAttributes": {
              "Authorization": {
                  "stringValue": "Bearer eyJraWQiOiJabld3aHFMR2c4TEhFeUJ1TUEyc1VudTI3OHRvVUFQYldja1p5ZmZFeDMwPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIxMzdjYmFhYS02MGYxLTcwM2EtNzQwYy0yMDI0M2NjYTkyZjciLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnNhLWVhc3QtMS5hbWF6b25hd3MuY29tXC9zYS1lYXN0LTFfM1FBM3NoZDBmIiwiY29nbml0bzp1c2VybmFtZSI6IjEzN2NiYWFhLTYwZjEtNzAzYS03NDBjLTIwMjQzY2NhOTJmNyIsIm9yaWdpbl9qdGkiOiI5ODlhOTU4MS0xMjM0LTQ5NzktYWYzNS0yMWU0NTRkNDg0YmIiLCJhdWQiOiI0dmJmYW82NzFiNHZyamxwbzdsOHU0N2xiYyIsImV2ZW50X2lkIjoiMDUzM2E1OTktNjRiMC00YTFmLWI2NWItZmQ1ZDEyNDFlNDlhIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NDEyNjQ3NTgsIm5hbWUiOiJNb25payIsImV4cCI6MTc0MTQ2NzQzOSwiaWF0IjoxNzQxNDYzODM5LCJqdGkiOiI0YjMyM2IzOC1jYTU0LTQ2YzgtYTg0Zi0zNGU1NzkwZWJiNzEiLCJlbWFpbCI6Im1vbmlrLmZyZ0BmcmcuY29tIn0.ZftW1643-FbL5t1eG0f4ecAs3OljynWAcU71HHtOSDGkkjCxNlZEWcdbVcolTS1Hrb96OBdQjgAnDNlwttxPXebz3AXrE8VqML1OOGXgG00n0EI0poyde2eD2efQQYH2p1HJHLU6i_Y2ciGW9riGS4rwKZiKDunmC_dWxqln-r5cOEIWJeH754UrQYOqqfF1Fuap6WHSbUMHmNQ1ce2PfpuD98eb5dxpuWNCzEE2DvyABjBfYV-nLbZ8Y21hJrFdDLH6V-HK8xeqiVRm0QYzThh_akT7FCjGZgi-9hEyAy7vx8-Yn4bqywfdqsRHEm5Y8FVaootUhV_kKSl7jpeeZw",
                  "stringListValues": [],
                  "binaryListValues": [],
                  "dataType": "String"
              }
          },
          "md5OfMessageAttributes": "0efbb414f4c9e9882c7c187fcff19218",
          "md5OfBody": "9c135cb14f64a0a3ce66f98c42d21e1b",
          "eventSource": "aws:sqs",
          "eventSourceARN": "arn:aws:sqs:sa-east-1:300303587993:near-generate-file",
          "awsRegion": "sa-east-1"
      }
  ]
})
.then(console.log)
.catch(console.error);