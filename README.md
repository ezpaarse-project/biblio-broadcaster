# biblio-broadcaster

This repository aims to create a general-purpose version of [bibliomap-enricher](https://github.com/ezpaarse-project/bibliomap-enricher). The application listens for [bibliomap-harvester](https://github.com/ezpaarse-project/bibliomap-harvester) data, sends logs to [ezPAARSE](https://github.com/ezpaarse-project/ezpaarse) and broadcasts the results over websocket.

## Prerequisites

  * Docker/docker-compose

## Install and run

This project is expected to work with [bibliomap-harvester](https://github.com/ezpaarse-project/bibliomap-harvester) and [ezPAARSE](https://github.com/ezpaarse-project/ezpaarse). Have a look at [bibliomap](https://github.com/ezpaarse-project/bibliomap) for an example.

## How to use

A socket.io client can be downloaded at `/socket.io/socket.io.js`. Then you can listen for the `ec` events.

```html
  <script src="http://localhost:27779/socket.io/socket.io.js"></script>
  <script>
    const socket = io('http://localhost:27779');
    socket.on('ec', function (data) {
      console.log(data);
    });
  </script>
```

## Configuration

You can customize the configuration using environment variables:

  * BBE_EZPAARSE_URL
  * BBE_EZPAARSE_PREDEF
  * BBE_HARVESTER_HOST
  * BBE_HARVESTER_PORT
  * BBE_BROADCAST_PORT
  * BBE_AUTOCONNECT_DELAY

Look at [config.json](https://github.com/ezpaarse-project/biblio-broadcaster/blob/master/config/default.json) to see the default values.

## Developement

```
git clone https://github.com/ezpaarse-project/biblio-broadcaster.git
cd biblio-broadcaster
make install
DEBUG=biblio* make run-debug
```
