export type Role='owner'|'admin'|'accountant'|'employee';
export type Profile={id:string;full_name:string;phone:string|null;role:Role;employee_id:string|null;is_active:boolean;permissions?:Record<string,boolean>};
