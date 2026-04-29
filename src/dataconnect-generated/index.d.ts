import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Booking_Key {
  id: UUIDString;
  __typename?: 'Booking_Key';
}

export interface CreateBookingData {
  booking_insert: Booking_Key;
}

export interface CreateBookingVariables {
  workerProfileId: UUIDString;
  workerServiceServiceId: UUIDString;
  bookingDate: DateString;
  startTime: string;
  endTime: string;
  totalPrice: number;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface GetWorkerProfileData {
  workerProfile?: {
    id: UUIDString;
    bio: string;
    hourlyRate: number;
    yearsOfExperience: number;
  } & WorkerProfile_Key;
}

export interface GetWorkerProfileVariables {
  id: UUIDString;
}

export interface ListServicesData {
  services: ({
    id: UUIDString;
    name: string;
    description: string;
    defaultPrice?: number | null;
  } & Service_Key)[];
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface Service_Key {
  id: UUIDString;
  __typename?: 'Service_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface WorkerProfile_Key {
  id: UUIDString;
  __typename?: 'WorkerProfile_Key';
}

export interface WorkerService_Key {
  workerProfileId: UUIDString;
  serviceId: UUIDString;
  __typename?: 'WorkerService_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface ListServicesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListServicesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListServicesData, undefined>;
  operationName: string;
}
export const listServicesRef: ListServicesRef;

export function listServices(): QueryPromise<ListServicesData, undefined>;
export function listServices(dc: DataConnect): QueryPromise<ListServicesData, undefined>;

interface GetWorkerProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetWorkerProfileVariables): QueryRef<GetWorkerProfileData, GetWorkerProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetWorkerProfileVariables): QueryRef<GetWorkerProfileData, GetWorkerProfileVariables>;
  operationName: string;
}
export const getWorkerProfileRef: GetWorkerProfileRef;

export function getWorkerProfile(vars: GetWorkerProfileVariables): QueryPromise<GetWorkerProfileData, GetWorkerProfileVariables>;
export function getWorkerProfile(dc: DataConnect, vars: GetWorkerProfileVariables): QueryPromise<GetWorkerProfileData, GetWorkerProfileVariables>;

interface CreateBookingRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateBookingVariables): MutationRef<CreateBookingData, CreateBookingVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateBookingVariables): MutationRef<CreateBookingData, CreateBookingVariables>;
  operationName: string;
}
export const createBookingRef: CreateBookingRef;

export function createBooking(vars: CreateBookingVariables): MutationPromise<CreateBookingData, CreateBookingVariables>;
export function createBooking(dc: DataConnect, vars: CreateBookingVariables): MutationPromise<CreateBookingData, CreateBookingVariables>;

