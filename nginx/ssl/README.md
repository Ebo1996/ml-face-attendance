# SSL Certificate Setup

## Option 1: Let's Encrypt (Recommended for Production)

### Using Certbot with Docker

1. **Install Certbot:**
```bash
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

2. **Copy certificates to nginx/ssl:**
```bash
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
```

3. **Auto-renewal setup (crontab):**
```bash
0 3 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot renew --quiet
```

## Option 2: Self-Signed Certificate (Development/Testing Only)

⚠️ **WARNING:** Self-signed certificates will show browser warnings. Only use for local testing.

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Option 3: Commercial SSL Certificate

If you purchased an SSL certificate from a provider (DigiCert, Comodo, etc.):

1. Place your certificate files here:
   - `fullchain.pem` - Full certificate chain
   - `privkey.pem` - Private key

2. Ensure proper permissions:
```bash
chmod 600 nginx/ssl/privkey.pem
chmod 644 nginx/ssl/fullchain.pem
```

## Verification

After setting up certificates:

```bash
# Test nginx configuration
docker exec face-attendance-nginx nginx -t

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

## Certificate Files Required

- `fullchain.pem` - Complete certificate chain (required)
- `privkey.pem` - Private key (required)

**Never commit private keys to version control!**
