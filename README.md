strider-docker-runner
=====================

## Quick Start

- grab this repo, `npm link` it into your strider installation
- get docker going, and it needs to be broadcasting over http
- `docker pull strider/strider-docker-slave`
- choose the docker runner in the plugin config page
- start strider with the appropriate info about how to connect to docker, e.g. `DOCKER_IP=192.168.59.103 DOCKER_PORT=2375 ./bin/strider`

## Required Environment Variables

You can either use DOCKER_IP and DOCKER_PORT or you can choose to use DOCKER_HOST. Expected formats:

```
dockerUtil#normalizeOptions()
  passing in nothing
    ✓ defaults to default socket path
  using environment variables DOCKER_IP and DOCKER_PORT
    ✓ returns expected dockerode connection structure
  using environment variable DOCKER_HOST
    ✓ understands http://127.0.0.1:4243
    ✓ understands unix:///var/run/docker.sock
    ✓ understands tcp://127.0.0.1:4243
```

Profit! see this comment in the "prepare" phase telling you that **docker is alive**

![](https://cloud.githubusercontent.com/assets/112170/3838066/871cff0c-1dfc-11e4-9fce-430447bafffa.png)
