import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

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

/** Generated Node Admin SDK operation action function for the 'CreateUser' Mutation. Allow users to execute without passing in DataConnect. */
export function createUser(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserData>>;
/** Generated Node Admin SDK operation action function for the 'CreateUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function createUser(options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserData>>;

/** Generated Node Admin SDK operation action function for the 'ListServices' Query. Allow users to execute without passing in DataConnect. */
export function listServices(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListServicesData>>;
/** Generated Node Admin SDK operation action function for the 'ListServices' Query. Allow users to pass in custom DataConnect instances. */
export function listServices(options?: OperationOptions): Promise<ExecuteOperationResponse<ListServicesData>>;

/** Generated Node Admin SDK operation action function for the 'GetWorkerProfile' Query. Allow users to execute without passing in DataConnect. */
export function getWorkerProfile(dc: DataConnect, vars: GetWorkerProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetWorkerProfileData>>;
/** Generated Node Admin SDK operation action function for the 'GetWorkerProfile' Query. Allow users to pass in custom DataConnect instances. */
export function getWorkerProfile(vars: GetWorkerProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetWorkerProfileData>>;

/** Generated Node Admin SDK operation action function for the 'CreateBooking' Mutation. Allow users to execute without passing in DataConnect. */
export function createBooking(dc: DataConnect, vars: CreateBookingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateBookingData>>;
/** Generated Node Admin SDK operation action function for the 'CreateBooking' Mutation. Allow users to pass in custom DataConnect instances. */
export function createBooking(vars: CreateBookingVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateBookingData>>;

