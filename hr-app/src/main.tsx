import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { AccountantApp, EmployeeApp } from './App';
import './index.css';
const params=new URLSearchParams(window.location.search);
const path=window.location.hash;
const mode=params.get('employee')==='1'||path==='#/employee'?'employee':params.get('accountant')==='1'||path==='#/accountant'?'accountant':'dashboard';
createRoot(document.getElementById('root')!).render(<StrictMode>{mode==='employee'?<EmployeeApp/>:mode==='accountant'?<AccountantApp/>:<App/>}</StrictMode>);
