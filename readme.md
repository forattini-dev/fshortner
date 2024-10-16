# Fshortner

This is a simple lightweight URL shortning service using express and s3db.js.

Fork-it and use it as you like.


## Start the service

```bash
docker run --rm -itd \
  -p 8000:8000 \
  -e PORT=8000 \
  -e FS_CONNECTION_STRING="your-secret" \
  --name fshortner \
  ghcr.io/forattini-dev/fshortner:latest
```


## API usage

### Shorten a URL

`POST /v1/urls`

```js
// request: 
{
  "link": "https://my-super-loooooooooooong-url.com?p=with+parameters"
}

// response:
{
  "id": "AdCcOPzRR4UXCMs4",
  "link": "https://my-super-loooooooooooong-url.com?p=with+parameters",
  "shareableLink": "http://localhost:8000/AdCcOPzRR4UXCMs4"
}
```

Body parameters:
| parameter | description | required | type | default |
| :--- | --- | :---: | :---: | :---: |
| link | URL to shorten. | true | url string | null |
| webhook | URL to send updates. | false | url string | null |
| getFingerprints | Enable to get the fingerprints. | true | boolean | true |

#### Ex: shorten a URL and get instant updates

```js
// request 
{
  "link": "https://my-super-loooooooooooong-url.com?p=with+parameters",
  "webhook": "https://my-webhook.io/?id=my-token"
}

// response:
{
  "id": "AdCcOPzRR4UXCMs4",
  "link": "https://my-super-loooooooooooong-url.com?p=with+parameters",
  "shareableLink": "http://localhost:8000/AdCcOPzRR4UXCMs4",
  "webhook": "https://my-webhook.io/?id=my-token"
}
```

### Get status of a URL

`GET /v1/urls/:id`

```js
// response:
{
  "id": "AdCcOPzRR4UXCMs4",
  "clicks": 121,
  "link": "http://google.com",
  "shareable": "http://localhost:8000/AdCcOPzRR4UXCMs4",
  "webhook": true,
  "createdAt": "2024-10-07T02:25:35.000Z"
}
``` 

### Get a QR code of a URL

`GET /v1/urls/:id/qrcode`

Response is a image/png.


## Service global configuration

| variable | description | default |
| :--- | --- | :---: |
| PORT | Port to run the service. | `8000` |
| FS_ID_SIZE | Size of the ID to generate. | `16` |
| FS_SESSION_SECRET | Secret to sign the session. | `secret` |
| FS_DOMAIN | Domain to use in the shareable link. | inferred |
| FS_BEHIND_PROXY | Enable it if the service is behind a proxy. | `false` |
| FS_REDIRECT_TEMPLATE | Interface's template. See `./src/views` dir for more. | `corporate` |
| FS_REDIRECT_TIMEOUT | Timeout to redirect to the original URL. | `0.6` |
| FS_CONNECTION_STRING | Secret to connect to the s3db.js database. | `null` |
| FS_CRON_ENABLE | Enable the cron jobs. | `true` |
| FS_CRON_CLICKS_COUNTER | Cron expression to update the clicks counter. | `*/30 * * * * *` |
| FS_CRON_VIEWS_COUNTER | Cron expression to update the views counter. | `*/30 * * * * *` |


## Contributing

1. Fork it! :)
1. Run it with `docker-compose up`
1. At your minio container, create credentials and use the example at `./src/concerns/minio-policy.json` to create a policy.
1. Make your requests to `http://localhost:8000`
