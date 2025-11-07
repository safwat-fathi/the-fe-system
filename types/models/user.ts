import { Group, MergedPermissions } from "./menu";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  groups?: Group[];
  permissions?: MergedPermissions;
}
