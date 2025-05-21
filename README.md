# @gen_epix

## SSL

Install mkcert: [docs](https://github.com/FiloSottile/mkcert)

Goto your home directory and run:

`mkcert -install`

`mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1`

Two files have now been created in your home directory `key.pem` and `cert.pem`. Copy these two files to the cert directory of this project.
