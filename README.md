strider-docker-runner
=====================

## Quick Start

- grab this repo, `npm link` it into your strider installation
- get docker going, and it needs to be broadcasting over http
- `docker pull strider/strider-docker-slave`
- choose the docker runner in the plugin config page
- start strider with the appropriate info about how to connect to docker, e.g. `DOCKER_IP=192.168.59.103 DOCKER_PORT=2375 ./bin/strider`

Profit! see this comment in the "prepare" phase telling you that **docker is alive**

![](https://cloud.githubusercontent.com/assets/112170/3838066/871cff0c-1dfc-11e4-9fce-430447bafffa.png)
