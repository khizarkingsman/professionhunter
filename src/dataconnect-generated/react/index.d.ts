import { CreateUserData, ListServicesData, GetWorkerProfileData, GetWorkerProfileVariables, CreateBookingData, CreateBookingVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useListServices(options?: useDataConnectQueryOptions<ListServicesData>): UseDataConnectQueryResult<ListServicesData, undefined>;
export function useListServices(dc: DataConnect, options?: useDataConnectQueryOptions<ListServicesData>): UseDataConnectQueryResult<ListServicesData, undefined>;

export function useGetWorkerProfile(vars: GetWorkerProfileVariables, options?: useDataConnectQueryOptions<GetWorkerProfileData>): UseDataConnectQueryResult<GetWorkerProfileData, GetWorkerProfileVariables>;
export function useGetWorkerProfile(dc: DataConnect, vars: GetWorkerProfileVariables, options?: useDataConnectQueryOptions<GetWorkerProfileData>): UseDataConnectQueryResult<GetWorkerProfileData, GetWorkerProfileVariables>;

export function useCreateBooking(options?: useDataConnectMutationOptions<CreateBookingData, FirebaseError, CreateBookingVariables>): UseDataConnectMutationResult<CreateBookingData, CreateBookingVariables>;
export function useCreateBooking(dc: DataConnect, options?: useDataConnectMutationOptions<CreateBookingData, FirebaseError, CreateBookingVariables>): UseDataConnectMutationResult<CreateBookingData, CreateBookingVariables>;
