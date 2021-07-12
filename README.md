## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## Docker
```bash
docker build -t essence-devops-service:dev .
docker run --name some-essence-devops-service -p 3000:3000 -d essence-devops-service:dev
``` 

## License

Essence DevOps Service is [MIT licensed](LICENSE).
