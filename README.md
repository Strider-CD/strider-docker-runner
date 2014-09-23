strider-docker-runner
=====================

## Installation

`cd` into strider deployment and run `npm install strider-docker-runner`

If you need to install Docker, see the [official installation instructions](https://docs.docker.com/installation/)

The default image is `strider/strider-docker-slave` -- it is recommended to `docker pull strider/strider-docker-slave` directly on the Docker host, however the plugin will do this for you as of [PR#22](https://github.com/Strider-CD/strider-docker-runner/pull/22).

If Docker is running on the same machine as Strider, you do not need to add any additional environment variables -- the plugin will try to use `unix:///var/run/docker.sock` to communicate with Docker. Make sure Strider has permission to do so, otherwise Strider will crash and complain.

If Docker is running on a remote machine, you will need to use the [Docker Remote API](https://docs.docker.com/reference/api/docker_remote_api/) and let Strider know about it by setting `DOCKER_HOST` accordingly. e.g. `DOCKER_HOST=http://127.0.0.1:4243 strider`


Once Strider is running, go to your plugins page for a project and you will be able to select the Docker runner. You can also configure the Runner to use a different, custom base image. You may even combine this feature with [strider-docker-build](https://github.com/Strider-CD/strider-docker-build) to fully automate changes to the base image.

## Configuration Environment Variables

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

## Verification

See this comment in the "prepare" phase telling you that **docker is alive**

![](https://cloud.githubusercontent.com/assets/112170/3838066/871cff0c-1dfc-11e4-9fce-430447bafffa.png)
