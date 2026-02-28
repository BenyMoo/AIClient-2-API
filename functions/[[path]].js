{
  "version": 2,
  "builds": [
    {
      "src": "static",
      "use": "@cloudflare/pages-static",
      "config": {
        "outputDirectory": "static"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
