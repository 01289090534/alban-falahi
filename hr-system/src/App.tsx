import {Navigate,Route,Routes} from 'react-router-dom';
import type {Profile} from './types';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Branches from './pages/Branches';
import Attendance from './pages/Attendance';
import Closeouts from './pages/Closeouts';
import Overtime from './pages/Overtime';
import Money from './pages/Money';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Layout from './components/Layout';

const localProfile:Profile={id:'local-admin',full_name:'علي',phone:null,role:'admin',employee_id:null,is_active:true,permissions:{}};

export default function App(){
  return <Routes>
    <Route element={<Layout profile={localProfile}/>}> 
      <Route index element={<Dashboard profile={localProfile}/>}/>
      <Route path="employees" element={<Employees/>}/>
      <Route path="branches" element={<Branches/>}/>
      <Route path="attendance" element={<Attendance/>}/>
      <Route path="closeouts" element={<Closeouts profile={localProfile}/>}/>
      <Route path="overtime" element={<Overtime profile={localProfile}/>}/>
      <Route path="money" element={<Money profile={localProfile}/>}/>
      <Route path="payroll" element={<Payroll profile={localProfile}/>}/>
      <Route path="reports" element={<Reports/>}/>
      <Route path="users" element={<Users/>}/>
      <Route path="settings" element={<Settings profile={localProfile}/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
