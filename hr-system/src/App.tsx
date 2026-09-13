import {useEffect,useState} from 'react';
import {Navigate,Route,Routes,useLocation} from 'react-router-dom';
import type {Profile} from './types';
import {supabase} from './lib/supabase';
import Login from './pages/Login';
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

function ProtectedApp({profile}:{profile:Profile}){return <Routes>
  <Route element={<Layout profile={profile}/>}> 
    <Route index element={<Dashboard profile={profile}/>}/><Route path="employees" element={<Employees/>}/><Route path="branches" element={<Branches/>}/>
    <Route path="attendance" element={<Attendance/>}/><Route path="closeouts" element={<Closeouts profile={profile}/>}/><Route path="overtime" element={<Overtime profile={profile}/>}/>
    <Route path="money" element={<Money profile={profile}/>}/><Route path="payroll" element={<Payroll profile={profile}/>}/><Route path="reports" element={<Reports/>}/>
    <Route path="users" element={<Users/>}/><Route path="settings" element={<Settings profile={profile}/>}/>
  </Route><Route path="*" element={<Navigate to="/" replace/>}/>
</Routes>}

export default function App(){
  const location=useLocation();
  const [userId,setUserId]=useState<string|null>(null);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [checking,setChecking]=useState(true);
  const [profileError,setProfileError]=useState('');

  useEffect(()=>{
    let alive=true;
    async function checkUser(){
      try{
        const {data,error}=await supabase.auth.getUser();
        if(!alive)return;
        if(error||!data.user){setUserId(null);setChecking(false);return}
        setUserId(data.user.id);setChecking(false);
      }catch{
        if(alive){setUserId(null);setChecking(false)}
      }
    }
    void checkUser();
    return()=>{alive=false};
  },[]);

  useEffect(()=>{
    if(!userId){setProfile(null);setProfileError('');return}
    let alive=true;
    const timer=window.setTimeout(()=>{if(alive){setProfileError('انتهى وقت تحميل الحساب.');setProfile(null)}},5000);
    async function loadProfile(){
      try{
        const {data,error}=await supabase.rpc('hr_v2_get_my_profile');
        if(!alive)return;
        window.clearTimeout(timer);
        if(error||!data?.id){setProfileError('تعذر تحميل بيانات المستخدم.');setProfile(null);return}
        setProfile(data as Profile);
      }catch{
        if(alive){window.clearTimeout(timer);setProfileError('تعذر تحميل بيانات المستخدم.');setProfile(null)}
      }
    }
    void loadProfile();
    return()=>{alive=false;window.clearTimeout(timer)};
  },[userId]);

  if(location.pathname==='/login')return <Login/>;
  if(checking)return <div className="loading">جاري فتح النظام...</div>;
  if(!userId)return <Navigate to="/login" replace/>;
  if(profileError||!profile)return <div className="login-page"><section className="login-card"><div className="error">{profileError||'تعذر تحميل بيانات المستخدم.'}</div><button className="primary full" onClick={()=>{supabase.auth.signOut({scope:'local'}).finally(()=>window.location.href='/login')}}>العودة لتسجيل الدخول</button></section></div>;
  return <ProtectedApp profile={profile}/>;
}
