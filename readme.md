# Fshortner

This is a simple lightweight URL shortning service using express and s3db.js.

Fork-it and use it as you like.


## Usage

### Shorten a URL

Request: 

`POST /v1/urls`

```json
{
  "link": "https://my-long-url.com"
}
```

Response:

```json
{
	"id": ":id",
	"link": "http://google.com",
	"shareable": "http://localhost:8000/AdCcOPzRR4UXCMs4"
}
```

### Get status of a URL

`GET /v1/urls/:id`

Response:

```json
{
	"id": "AdCcOPzRR4UXCMs4",
	"clicks": 121,
	"link": "http://google.com",
	"shareable": "http://localhost:8000/AdCcOPzRR4UXCMs4",
	"createdAt": "2024-10-07T02:25:35.000Z"
}
``` 


## Configuration

// table: 
| variable | description | default |
| ---: | --- | :---: |
| PORT | Port to run the service | 8000 |
| FS_ID_SIZE | Size of the ID to generate | 16 |
| FS_DOMAIN | Domain to use in the shareable link | inferred |
| FS_REDIRECT_TEMPLATE | Interface's template | corporate |
| FS_REDIRECT_TIMEOUT | Timeout to redirect to the original URL | 1 |
| FS_CONNECTION_STRING | Secret to connect to the s3db.js database | - |
| FS_CRON_ENABLE | Enable the cron jobs | true |
| FS_CRON_CLICKS_COUNTER | Cron expression to update the clicks counter | */30 * * * * * |
| FS_CRON_VIEWS_COUNTER | Cron expression to update the views counter | */30 * * * * * |


## Run & test it

```bash
docker run --rm -itd \
  -p 8000:8000 \
  -e PORT=8000 \
  -e FS_CONNECTION_STRING="your-secret" \
  --name fshortner \
  ghcr.io/forattini-dev/fshortner:latest
```
