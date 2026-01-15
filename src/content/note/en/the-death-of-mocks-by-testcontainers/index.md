---
title: The death of mocks by Testcontainers
timestamp: 2025-01-15 20:38:25+01:00
tags: [mocks, test, testcontainers, nestjs]
toc: true
---

![Black stackable stones at the body of water](pexels-nandhukumar-312839.jpg)[^cover]

## Introduction

Writing tests can often feel like a daunting task, especially when you find yourself juggling mocks for internal and external services. Flaky tests, unrealistic mocks, and the constant fear of “what if this breaks in production?” can make the process incredibly stressful. I recently had to write integration tests for a service built with [NestJs](https://nestjs.com/) and having to mock the database layer (repository) didn't sit right with me as it felt like I was testing a facade rather than the real thing.
Now, don’t get me wrong—mocks are great and have their place in testing. But in this scenario, I wanted to ensure my code worked seamlessly in a production-like environment. So, I did what any developer would do: I reached out to my manager for advice.
His suggestion? [Testcontainers](https://testcontainers.com/).
It was a game-changer. With Testcontainers, I was able to spin up lightweight, disposable containers for services like PostgreSQL, Redis, and more—giving me a reliable, production-like testing environment right from my local machine.
No more “living a lie” with overly simplistic mocks.

In this article I would explain what Testcontainers are, why you would like to use Testcontainers and how to set it up (in NestJs).

## What are Testcontainers?

Testcontainers is an open source testing library that helps create light weight instances of databases, message brokers and any thing that can be run with docker. The only requirement for using Testcontainers is a docker environment. Testcontainers is available in different languages like Golang, NodeJs, Java, etc. which means this article can be helpful even if you write a different language. You can find a comprehensive list on their website <https://testcontainers.com/>

## Why Testcontainers?

Using Testcontainers allows you use real world software like a Postgres database, Redis, even Ollama like you would in production, you don't need to setup complex test configuration, or mock your database repository, you just write your test with minimal setup.

## How to setup

Kindly note I would mostly skip the setup required to run the NestJs application, here's a link to the [Github Repository](https://github.com/papidb/nest-js-integration-test-with-testcontainers).

The lifecycle of our test looks like the image below:
![Test lifecycle](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6c7e2mtrt19fv8emyh46.jpg)

This is simple and summarizes a ton of tests that happens, we mostly follow these steps when writing tests

1. Setup configuration
2. Run Tests
3. Clean up

### Setup Test Containers

Let's setup a Postgres container (and build the database configuration for mikro-orm)

```typescript
import { MikroOrmModuleOptions } from "@mikro-orm/nestjs";
import { MikroORM } from "@mikro-orm/postgresql";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import * as dotenv from "dotenv";
import mikroOrmTestConfig from "../src/mikro-orm-test.config";

dotenv.config();

export class SingletonTestContainers {
 private initialized = false;
 private static instance: SingletonTestContainers | null = null;
 public postgresContainer: StartedPostgreSqlContainer | null = null;
 public config: MikroOrmModuleOptions | null = null;

 private constructor() {}

 public async init(): Promise<void> {
  if (this.initialized) {
   return;
  }

  this.postgresContainer = await new PostgreSqlContainer().start();
  const url = this.postgresContainer.getConnectionUri();
  this.config = await mikroOrmTestConfig(url);
  const orm = await MikroORM.init(this.config);
  await orm.getMigrator().up();

  this.initialized = true;
 }

 public async shutdown(): Promise<void> {
  this.postgresContainer = null;
  this.config = null;
  this.initialized = false;
 }

 public static getInstance(): SingletonTestContainers {
  if (!SingletonTestContainers.instance) {
   SingletonTestContainers.instance = new SingletonTestContainers();
  }
  return SingletonTestContainers.instance;
 }
}
```

We are using a singleton pattern to setup the test containers, because we don't want each tests spinning up different containers.
This pattern is helpful as in the future your application might need a caching layer and all you would need to do is add the test container setup in there.

### Setup & Clean Up

We then use the `SingletonTestContainers` class in your test setup as follows:

```typescript
let service: TodoService;
let orm: MikroORM;
let em: EntityManager;
const testContainers = SingletonTestContainers.getInstance();

beforeAll(async () => {
 await testContainers.init();
});

beforeEach(async () => {
 const module: TestingModule = await Test.createTestingModule({
  imports: [
   MikroOrmModule.forRoot(testContainers.config),
   MikroOrmModule.forFeature({
    entities: [Todo]
   })
  ],
  providers: [TodoService, TodoRepository]
 }).compile();

 service = module.get<TodoService>(TodoService);
 orm = module.get<MikroORM>(MikroORM);
 em = module.get<EntityManager>(EntityManager);
});

beforeEach(async () => {
 // Clear the database before each test
 await em.nativeDelete(Todo, {});
});

afterAll(async () => {
 await orm.close(true);
 await testContainers.shutdown();
});
```

Like we stated in the diagram above we want to setup our test containers, run our tests, then shutdown our containers.

Let's actually make this test a bit more complicated, let's add a cache layer to our application, we can edit our docker compose to reflect this, and do some application setup, when we run our tests again they fail because we can't connect to a Redis instance, this is to be expected, one way to resolve this would be to mock the cache service, but with the integration of Testcontainers this won't be necessary, as we can just spin up a Redis instance in less than 10 lines of code.
Firstly we install the Redis library

```shell
pnpm install @testcontainers/redis
```

then we use it in our setup

```typescript
// ...
  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.postgresContainer = await new PostgreSqlContainer().start();
    const url = this.postgresContainer.getConnectionUri();
    this.config = await mikroOrmTestConfig(url);
    const orm = await MikroORM.init(this.config);
    await orm.getMigrator().up();

    this.redisContainer = await new RedisContainer("redis:5.0.3-alpine").start();
    this.redisUrl = this.redisContainer.getConnectionUrl();

    this.initialized = true;
  }

  public async shutdown(): Promise<void> {
    this.postgresContainer = null;
    this.config = null;
    this.redisContainer = null;
    this.redisUrl = null;
    this.initialized = false;
  }
// ...
```

We can then use the redisUrl in our test like so

```typescript
// ...
const redisOptions = AppService.RedisOptions;
    redisOptions.useFactory = async () =>
      AppService.buildRedisStore(testContainers.redisUrl);

// ...
        CacheModule.registerAsync(redisOptions),
// ...
```

We didn't need to write mocks, spy on the mocks all we did was just to start a Redis container, and use the generated Redis url to setup our tests.

## Wrap up

Using Testcontainers made me focus on writing tests without the stress of writing mocks that needs to change if any of my repository or service changes shape. I think this would help everyone needs to write tests. Due to it's availability in different languages I think you should be able to use it in your work place and even in CI/CD environment like GitHub actions, Circle CI etc.

Link to Repository: <https://github.com/papidb/nest-js-integration-test-with-testcontainers/>

[^cover]: Photo by [Nandhu Kumar](https://www.pexels.com/photo/black-stackable-stone-decor-at-the-body-of-water-312839/)
