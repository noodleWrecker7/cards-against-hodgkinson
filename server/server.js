console.log('Server Starting')
console.log('Current Build: ' + process.env.GAE_VERSION)

// todo express, socket.io, sysinfo

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
    allowEIO3: true
  }
})
const PORT = process.env.PORT || 6999

io.on('connection', function (socket) {
  // handle sockets

}
)

app.get('/*', function (request, response) {
  console.log(request.path)
  response.send('<html><script>window.location.href="cards.adamhodgkinson.dev"</script></html>')
})

http.listen(PORT, () => {
  console.log('Listening on:' + PORT)
})
