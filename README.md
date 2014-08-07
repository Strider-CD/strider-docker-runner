strider-docker-runner
=====================

## Really quick and rather dirty start

- grab this repo, `npm link` it into your strider installation
- get docker going, and it needs to be broadcasting over http
- `docker pull strider/strider-docker-slave`
- jump into the mongo database (I like [genghisapp](http://genghisapp.com)) and change the "runner.id" of the master branch of one of your projects from "simple-runner" to "docker"
- start strider with the appropriate info about how to connect to docker, like `DOCKER_IP=192.168.59.103 DOCKER_PORT=2375 ./bin/strider`

Profit! see this comment in the "prepare" phase telling you that **docker is alive**

![](https://cloud.githubusercontent.com/assets/112170/3838066/871cff0c-1dfc-11e4-9fce-430447bafffa.png)
