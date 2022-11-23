## Directory Structure
```bash
```bash
├── src
│   ├── common
│   │   ├── base.error.ts
│   │   ├── helper.ts
│   │   ├── rest.client.ts
│   ├── models
│   │   ├── common
│   │   ├── linode => object interface received from Linode APIs
│   │   │   ├── balancer.config.ts
│   │   │   ├── balancer.transfer.ts
│   │   │   ├── balancer.ts
│   │   │   ├── node.alert.ts
│   │   │   ├── node.backup.ts
│   │   │   ├── node.ip.ts
│   │   │   ├── node.specs.ts
│   │   │   ├── node.stats.ts
│   │   │   └── node.ts
│   ├── modules
│   │   ├── about
│   │   │   ├── about.controller.ts
│   │   │   ├── health.controller.ts
│   │   │   └── about.module.ts
│   │   ├── linode
│   │   │   ├── api.linode.client.ts => Implement base client for send request to Linode service
│   │   │   ├── balancer.service.ts => Implement linode balancer APIs: List, Config List, Nodes List, Node Create, Node Delete
│   │   │   ├── linode.service.ts => Implement linode APIs: List, Create, View, Stats, Delete, Clone, Boot, Allocate IP, ...
│   │   │   └── linode.module.ts
│   │   ├── scale
│   │   │   ├── scale.service.ts => Implement auto scale algorithm: periodic checking, scale down, scale up
│   │   │   ├── scale.controller.ts => Implement scale APIs, this is empty now
│   │   │   └── scale.module.ts
│   │   └──app.module.ts
│   └── main.ts
├── test
├── README.md
├── Dockerfile
├── package.json
├── .env
└── .gitignore
```

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

