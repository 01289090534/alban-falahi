export type Role='owner'|'admin'|'accountant'|'employee'|'attendance_operator';
export type Profile={id:string;full_name:string;phone:string|null;role:Role;employee_id:string|null;branch_id?:string|null;is_active:boolean;must_change_password?:boolean;permissions?:Record<string,boolean>};
