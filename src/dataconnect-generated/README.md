# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListServices*](#listservices)
  - [*GetWorkerProfile*](#getworkerprofile)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*CreateBooking*](#createbooking)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListServices
You can execute the `ListServices` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listServices(): QueryPromise<ListServicesData, undefined>;

interface ListServicesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListServicesData, undefined>;
}
export const listServicesRef: ListServicesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listServices(dc: DataConnect): QueryPromise<ListServicesData, undefined>;

interface ListServicesRef {
  ...
  (dc: DataConnect): QueryRef<ListServicesData, undefined>;
}
export const listServicesRef: ListServicesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listServicesRef:
```typescript
const name = listServicesRef.operationName;
console.log(name);
```

### Variables
The `ListServices` query has no variables.
### Return Type
Recall that executing the `ListServices` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListServicesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListServicesData {
  services: ({
    id: UUIDString;
    name: string;
    description: string;
    defaultPrice?: number | null;
  } & Service_Key)[];
}
```
### Using `ListServices`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listServices } from '@dataconnect/generated';


// Call the `listServices()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listServices();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listServices(dataConnect);

console.log(data.services);

// Or, you can use the `Promise` API.
listServices().then((response) => {
  const data = response.data;
  console.log(data.services);
});
```

### Using `ListServices`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listServicesRef } from '@dataconnect/generated';


// Call the `listServicesRef()` function to get a reference to the query.
const ref = listServicesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listServicesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.services);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.services);
});
```

## GetWorkerProfile
You can execute the `GetWorkerProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getWorkerProfile(vars: GetWorkerProfileVariables): QueryPromise<GetWorkerProfileData, GetWorkerProfileVariables>;

interface GetWorkerProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetWorkerProfileVariables): QueryRef<GetWorkerProfileData, GetWorkerProfileVariables>;
}
export const getWorkerProfileRef: GetWorkerProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getWorkerProfile(dc: DataConnect, vars: GetWorkerProfileVariables): QueryPromise<GetWorkerProfileData, GetWorkerProfileVariables>;

interface GetWorkerProfileRef {
  ...
  (dc: DataConnect, vars: GetWorkerProfileVariables): QueryRef<GetWorkerProfileData, GetWorkerProfileVariables>;
}
export const getWorkerProfileRef: GetWorkerProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getWorkerProfileRef:
```typescript
const name = getWorkerProfileRef.operationName;
console.log(name);
```

### Variables
The `GetWorkerProfile` query requires an argument of type `GetWorkerProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetWorkerProfileVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetWorkerProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetWorkerProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetWorkerProfileData {
  workerProfile?: {
    id: UUIDString;
    bio: string;
    hourlyRate: number;
    yearsOfExperience: number;
  } & WorkerProfile_Key;
}
```
### Using `GetWorkerProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getWorkerProfile, GetWorkerProfileVariables } from '@dataconnect/generated';

// The `GetWorkerProfile` query requires an argument of type `GetWorkerProfileVariables`:
const getWorkerProfileVars: GetWorkerProfileVariables = {
  id: ..., 
};

// Call the `getWorkerProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getWorkerProfile(getWorkerProfileVars);
// Variables can be defined inline as well.
const { data } = await getWorkerProfile({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getWorkerProfile(dataConnect, getWorkerProfileVars);

console.log(data.workerProfile);

// Or, you can use the `Promise` API.
getWorkerProfile(getWorkerProfileVars).then((response) => {
  const data = response.data;
  console.log(data.workerProfile);
});
```

### Using `GetWorkerProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getWorkerProfileRef, GetWorkerProfileVariables } from '@dataconnect/generated';

// The `GetWorkerProfile` query requires an argument of type `GetWorkerProfileVariables`:
const getWorkerProfileVars: GetWorkerProfileVariables = {
  id: ..., 
};

// Call the `getWorkerProfileRef()` function to get a reference to the query.
const ref = getWorkerProfileRef(getWorkerProfileVars);
// Variables can be defined inline as well.
const ref = getWorkerProfileRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getWorkerProfileRef(dataConnect, getWorkerProfileVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.workerProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.workerProfile);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation has no variables.
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser } from '@dataconnect/generated';


// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef } from '@dataconnect/generated';


// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## CreateBooking
You can execute the `CreateBooking` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createBooking(vars: CreateBookingVariables): MutationPromise<CreateBookingData, CreateBookingVariables>;

interface CreateBookingRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBookingVariables): MutationRef<CreateBookingData, CreateBookingVariables>;
}
export const createBookingRef: CreateBookingRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createBooking(dc: DataConnect, vars: CreateBookingVariables): MutationPromise<CreateBookingData, CreateBookingVariables>;

interface CreateBookingRef {
  ...
  (dc: DataConnect, vars: CreateBookingVariables): MutationRef<CreateBookingData, CreateBookingVariables>;
}
export const createBookingRef: CreateBookingRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createBookingRef:
```typescript
const name = createBookingRef.operationName;
console.log(name);
```

### Variables
The `CreateBooking` mutation requires an argument of type `CreateBookingVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateBookingVariables {
  workerProfileId: UUIDString;
  workerServiceServiceId: UUIDString;
  bookingDate: DateString;
  startTime: string;
  endTime: string;
  totalPrice: number;
}
```
### Return Type
Recall that executing the `CreateBooking` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateBookingData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateBookingData {
  booking_insert: Booking_Key;
}
```
### Using `CreateBooking`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createBooking, CreateBookingVariables } from '@dataconnect/generated';

// The `CreateBooking` mutation requires an argument of type `CreateBookingVariables`:
const createBookingVars: CreateBookingVariables = {
  workerProfileId: ..., 
  workerServiceServiceId: ..., 
  bookingDate: ..., 
  startTime: ..., 
  endTime: ..., 
  totalPrice: ..., 
};

// Call the `createBooking()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createBooking(createBookingVars);
// Variables can be defined inline as well.
const { data } = await createBooking({ workerProfileId: ..., workerServiceServiceId: ..., bookingDate: ..., startTime: ..., endTime: ..., totalPrice: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createBooking(dataConnect, createBookingVars);

console.log(data.booking_insert);

// Or, you can use the `Promise` API.
createBooking(createBookingVars).then((response) => {
  const data = response.data;
  console.log(data.booking_insert);
});
```

### Using `CreateBooking`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createBookingRef, CreateBookingVariables } from '@dataconnect/generated';

// The `CreateBooking` mutation requires an argument of type `CreateBookingVariables`:
const createBookingVars: CreateBookingVariables = {
  workerProfileId: ..., 
  workerServiceServiceId: ..., 
  bookingDate: ..., 
  startTime: ..., 
  endTime: ..., 
  totalPrice: ..., 
};

// Call the `createBookingRef()` function to get a reference to the mutation.
const ref = createBookingRef(createBookingVars);
// Variables can be defined inline as well.
const ref = createBookingRef({ workerProfileId: ..., workerServiceServiceId: ..., bookingDate: ..., startTime: ..., endTime: ..., totalPrice: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createBookingRef(dataConnect, createBookingVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.booking_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.booking_insert);
});
```

